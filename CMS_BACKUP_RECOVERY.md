# CMS backup and recovery — Llansannan Community Council

## Backups: nothing extra to set up

Every time the clerk clicks **Publish** in the CMS, it's a normal git
commit to the repository. That means:

- Full history of every change is kept automatically and forever — who
  changed what, and when (visible on GitHub under a file's "History").
- Nothing is ever silently overwritten. Any previous version of any
  minutes entry, agenda, or event can be viewed or restored from GitHub's
  history at any time.
- Deleting the CMS, the Worker, or even the GitHub OAuth App does **not**
  delete any content — the JSON data files and PDFs stay exactly where
  they are in the repository.

**Recommended extra step:** every few months, clone or download a copy of
the repository to a council-controlled drive (not just GitHub), as an
independent copy in case of a lost or compromised GitHub account:

```
git clone https://github.com/YOUR-ORG/llansannan-website.git
```

## If the clerk can't log in to `/admin/`

Work through these in order:

1. **Check the site itself is up.** If the main website is down,
   the CMS (which is part of the same site) will be too — that's a
   hosting issue, not a CMS issue.

2. **Check the Cloudflare Worker is running.** Cloudflare dashboard →
   Workers & Pages → `llansannan-cms-auth` should show as Active with
   recent successful requests.

3. **Check the GitHub OAuth App callback URL.** GitHub org → Settings →
   Developer settings → OAuth Apps → `Llansannan Council CMS`. The
   "Authorization callback URL" must exactly match
   `https://<worker-url>/callback` — no trailing slash, correct
   subdomain. A mismatch here is the most common cause of login failing
   after any redeployment.

4. **Check `ALLOWED_ORIGIN` in `cms-oauth-worker/wrangler.toml`.** It
   must exactly match the site's real address (e.g.
   `https://llansannan-cc.gov.uk`, not `www.` if the site doesn't use
   `www.`, correct `https://`). If the site's domain ever changes, this
   must be updated and redeployed (`npx wrangler deploy` from
   `cms-oauth-worker/`).

5. **If the Client Secret was lost or the OAuth App was regenerated,**
   the Worker's copy is now wrong. Generate a new secret in the GitHub
   OAuth App, then run:
   ```
   cd cms-oauth-worker
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler deploy
   ```

6. **If the clerk's GitHub account itself is the problem** (locked out,
   2FA device lost, account compromised), that's resolved through
   GitHub's own account recovery — the CMS has no separate login system
   to reset.

## If `/admin/` shows old, broken, or unexpected behaviour after a deploy

Check the response headers in the browser's Network tab for
`cf-cache-status`. If it says `HIT`, Cloudflare's edge is serving a stale
cached copy of `/admin/index.html` rather than the newly deployed one.

Cloudflare only invalidates its cache for a static file when that exact
file's *content* changes — not when `worker-entry.js`, `wrangler.toml`, or
`_headers` change around it. So a fix that only touches those files can
deploy successfully while `/admin/` keeps serving a stale cached response
indefinitely. A cache-busting query string (`/admin/?x=1`) does **not**
help either — the cache key here is the asset path, not the full URL.

The fix is to make a real edit to `public/admin/index.html` itself (even
just bumping the `cache-rev:` number in its comment) so Cloudflare treats
it as new content and invalidates the stale copy on the next deploy.

## If a build fails after publishing

The CMS will show an error, and the site will keep serving its last
successful version (nothing goes offline). The most likely cause is the
automatic upload check: only PDF files under 10MB are accepted from the
CMS (see `scripts/validate-uploads.mjs`). Replace the offending file via
the CMS and the next publish will rebuild cleanly.

## Who to contact

For anything beyond the steps above — changing the domain, moving
hosting, or a genuinely broken deployment — contact the developer who set
this up (Tom, derivativemedia.co.uk) rather than guessing at GitHub or
Cloudflare settings, since some of the values above (Client ID, Worker
name) are specific to this exact setup.
