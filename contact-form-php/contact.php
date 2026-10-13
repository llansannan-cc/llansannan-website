<?php
/**
 * Llansannan Community Council - contact form handler.
 *
 * Runs on the Cloud Next hosting (NOT on Cloudflare). The static site posts
 * the form here; this script checks it, emails it to the Clerk, then sends
 * the visitor back to the contact page. Nothing is stored.
 *
 * Protections: POST only, Origin check, honeypot field, Cloudflare Turnstile
 * (verified server-side), per-IP rate limit, strict input validation, header
 * injection prevention, plain-text email only.
 *
 * Secrets live in config.php on the server only (never in the repo).
 */
declare(strict_types=1);

$config = require __DIR__ . '/config.php';

header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

function go(array $config, string $status): void
{
    header('Location: ' . $config['site_url'] . '/contact/?status=' . $status . '#form-status', true, 303);
    exit;
}

/** Remove control characters and line breaks (blocks email header injection). */
function one_line(string $s): string
{
    return trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s) ?? '');
}

// 1. POST only, and a sane size.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit;
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) {
    http_response_code(413);
    exit;
}

// 2. The request must come from our own website.
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$okOrigin = $origin !== ''
    ? hash_equals($config['site_url'], $origin)
    : ($referer !== '' && strpos($referer, $config['site_url'] . '/') === 0);
if (!$okOrigin) {
    http_response_code(403);
    exit;
}

// 3. Honeypot: real people never see or fill this field. Bots do.
//    Pretend success so the bot learns nothing.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    go($config, 'sent');
}

// 4. Rate limit: max N messages per IP per hour.
$ip      = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateDir = rtrim($config['rate_dir'] ?? sys_get_temp_dir(), '/\\');
$rateFile = $rateDir . '/llansannan-form-' . hash_hmac('sha256', $ip, $config['turnstile_secret']) . '.json';
$now = time();
$window = 3600;
$hits = [];
$fh = @fopen($rateFile, 'c+');
if ($fh && flock($fh, LOCK_EX)) {
    $raw = stream_get_contents($fh);
    $hits = array_values(array_filter(
        json_decode($raw ?: '[]', true) ?: [],
        fn($t) => is_int($t) && $t > $now - $window
    ));
    if (count($hits) >= (int)$config['max_per_hour']) {
        flock($fh, LOCK_UN);
        fclose($fh);
        go($config, 'toomany');
    }
    $hits[] = $now;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($hits));
    flock($fh, LOCK_UN);
    fclose($fh);
}

// 5. Cloudflare Turnstile - verified server-side, fails closed.
$token = (string)($_POST['cf-turnstile-response'] ?? '');
if ($token === '' || strlen($token) > 2048) {
    go($config, 'spam');
}
$ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query([
        'secret'   => $config['turnstile_secret'],
        'response' => $token,
        'remoteip' => $ip,
    ]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
]);
$res = curl_exec($ch);
curl_close($ch);
$verdict = is_string($res) ? json_decode($res, true) : null;
if (!is_array($verdict) || empty($verdict['success'])) {
    go($config, 'spam');
}

// 6. Validate input.
$name    = one_line((string)($_POST['name'] ?? ''));
$email   = one_line((string)($_POST['email'] ?? ''));
$subject = one_line((string)($_POST['subject'] ?? ''));
$message = str_replace(["\r\n", "\r"], "\n", (string)($_POST['message'] ?? ''));
$message = trim(preg_replace('/[^\P{C}\n\t]+/u', '', $message) ?? '');

$len = fn(string $s) => mb_strlen($s, 'UTF-8');
if ($name === '' || $len($name) > 100
    || $email === '' || $len($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || $len($subject) > 150
    || $len($message) < 5 || $len($message) > 5000) {
    go($config, 'invalid');
}

// 7. Build and send a plain-text email to the Clerk.
$subjectLine = '[Website] ' . ($subject !== '' ? $subject : 'Message from ' . $name);
$body = "A message was sent through the council website contact form.\n\n"
      . "Name:  $name\n"
      . "Email: $email\n"
      . "Subject: " . ($subject !== '' ? $subject : '(none)') . "\n\n"
      . "Message:\n$message\n\n"
      . "---\nReply to this email to answer the sender.\n";

$headers = [
    'From: ' . $config['from_name'] . ' <' . $config['from_address'] . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: llansannan-contact-form',
];

$sent = mail(
    $config['to_address'],
    mb_encode_mimeheader($subjectLine, 'UTF-8', 'B', "\r\n"),
    $body,
    implode("\r\n", $headers),
    '-f' . $config['from_address']
);

go($config, $sent ? 'sent' : 'error');
