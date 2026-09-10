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

## If `/admin/` shows a Content-Security-Policy console error again

The admin page needs a looser CSP than the rest of the site (see the note
at the top of `worker-entry.js`). That override only works because
`wrangler.toml` has:

```
run_worker_first = ["/admin/*"]
```

Without that line, Cloudflare serves `/admin/*` as a plain static file and
never runs `worker-entry.js` at all — so any change to that script,
`_headers`, or anything else has no effect whatsoever on `/admin/*`, no
matter how correct the code is. If this setting is ever accidentally
removed (e.g. during a wrangler.toml rewrite), the admin page will start
loading with the strict site-wide CSP again and the Decap script will fail
to load. Check for this line first before assuming it's a caching issue.

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
