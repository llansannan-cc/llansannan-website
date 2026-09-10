/**
 * Llansannan Community Council — Decap CMS GitHub OAuth Worker.
 *
 * This is the ONLY thing standing between the clerk's browser and a GitHub
 * access token. It deliberately does very little else:
 *
 *  - GET /auth      redirects to GitHub's OAuth consent screen, with a
 *                    random "state" value stored in a short-lived,
 *                    HttpOnly cookie (CSRF protection).
 *  - GET /callback  verifies the state cookie, exchanges the returned code
 *                    for an access token (server-side, using the client
 *                    secret — the browser never sees the secret), then
 *                    hands the token back to the CMS admin tab using the
 *                    postMessage handshake Decap expects, restricted to
 *                    ALLOWED_ORIGIN so the token can only reach the
 *                    council's own site, not an arbitrary page.
 *
 * Secrets: GITHUB_CLIENT_SECRET must be set with
 *   npx wrangler secret put GITHUB_CLIENT_SECRET
 * Non-secret config (GITHUB_CLIENT_ID, ALLOWED_ORIGIN) lives in wrangler.toml.
 */

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function page(message) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
<p>${message}</p>
<p>You can close this window.</p>
</body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const redirectUri = `${url.origin}/callback`;

      const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
      authorizeUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authorizeUrl.searchParams.set('redirect_uri', redirectUri);
      authorizeUrl.searchParams.set('scope', 'repo,user');
      authorizeUrl.searchParams.set('state', state);

      return new Response(null, {
        status: 302,
        headers: {
          Location: authorizeUrl.toString(),
          'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
      });
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const cookieHeader = request.headers.get('Cookie') || '';
      const match = cookieHeader.match(/(?:^|;\s*)oauth_state=([^;]+)/);
      const cookieState = match ? match[1] : null;

      if (!code || !returnedState || !cookieState || returnedState !== cookieState) {
        return html(page('Login could not be verified (missing or mismatched state). Close this window and try logging in again.'), 400);
      }

      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${url.origin}/callback`,
        }),
      });

      if (!tokenRes.ok) {
        return html(page('GitHub rejected the login request. Close this window and try again.'), 502);
      }

      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        return html(page('GitHub did not return an access token. Close this window and try again.'), 400);
      }

      return html(renderSuccess(tokenData.access_token, env.ALLOWED_ORIGIN));
    }

    return html(page('Llansannan Community Council CMS authentication service.'));
  },
};

function renderSuccess(token, allowedOrigin) {
  // Decap's expected handshake: the popup announces itself, waits for the
  // opener to acknowledge, then sends the token in a single postMessage.
  // Both the listener and the final send are restricted to ALLOWED_ORIGIN —
  // this worker will not hand a token to any other page.
  const payload = JSON.stringify({ token, provider: 'github' });

  return `<!DOCTYPE html>
<html>
<body>
<script>
(function() {
  var allowedOrigin = ${JSON.stringify(allowedOrigin)};
  var message = 'authorization:github:success:' + ${JSON.stringify(payload)};

  function receiveMessage(e) {
    if (e.origin !== allowedOrigin) return;
    window.opener.postMessage(message, allowedOrigin);
    window.removeEventListener('message', receiveMessage, false);
  }

  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', allowedOrigin);
})();
</script>
<p style="font-family:sans-serif;padding:2rem">Login successful. This window should close automatically.</p>
</body>
</html>`;
}
