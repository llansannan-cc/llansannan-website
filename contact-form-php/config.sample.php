<?php
/**
 * SAMPLE ONLY. On the server, copy this file to config.php and fill in the
 * real values there. Never commit config.php or put the secret in chat.
 */
return [
    // The public website (no trailing slash). Forms from anywhere else are refused.
    'site_url'        => 'https://llansannan-cc.gov.wales',

    // Where messages are delivered.
    'to_address'      => 'clerk@llansannan-cc.gov.wales',

    // Sender shown on the email. Must be an address on a domain you host here.
    'from_address'    => 'info@llansannan-cc.gov.wales',
    'from_name'       => 'Llansannan Council Website',

    // Cloudflare Turnstile SECRET key (from the Cloudflare dashboard). Keep private.
    'turnstile_secret' => 'PASTE-SECRET-KEY-HERE-ON-THE-SERVER-ONLY',

    // Anti-spam: maximum messages per visitor IP per hour.
    'max_per_hour'    => 5,

    // Optional: folder for rate-limit files (defaults to the server temp folder).
    // 'rate_dir'     => '/path/outside/public_html',
];
