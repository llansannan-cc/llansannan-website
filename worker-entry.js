/**
 * Thin routing layer in front of the static site assets.
 *
 * The site is otherwise fully static (see wrangler.toml [assets]). This
 * script exists for exactly one reason: the public/_headers file can't
 * express "the strict site-wide CSP applies everywhere EXCEPT /admin/*"
 * (Cloudflare sends headers from every matching block, and browsers
 * enforce the intersection of multiple CSP headers rather than letting a
 * more specific rule win). So the /admin/* override is done here instead,
 * after the asset is fetched, giving the Decap CMS admin (which needs to
 * load a script from unpkg.com and call the GitHub API) a different
 * policy than the rest of the site.
 *
 * For this script to actually run for /admin/* requests at all, wrangler.toml
 * sets run_worker_first = ["/admin/*"] — by default Cloudflare serves any
 * request matching a static file directly, without invoking this script.
 */

const ADMIN_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https://avatars.githubusercontent.com https://*.githubusercontent.com",
  "connect-src 'self' https://api.github.com https://github.com https://llansannan-cms-auth.llansannancc.workers.dev",
  "frame-ancestors 'none'",
].join('; ');

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);

    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      const headers = new Headers(response.headers);
      headers.set('Content-Security-Policy', ADMIN_CSP);
      // Belt and braces: the admin tool should always be fetched fresh,
      // not cached anywhere between deploys.
      headers.set('Cache-Control', 'no-store');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};
