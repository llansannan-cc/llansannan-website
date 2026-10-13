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
   `https://llansannan-cc.gov.wales`, not `www.` if the site doesn't use
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

## If the contact form stops working

The contact form is **not** part of the Cloudflare site. The page at
`/contact/` posts to a small PHP script (`contact-form-php/contact.php` in
this repository) running on the council's Cloud Next hosting, at
`https://forms.llansannan-cc.llyw.cymru/contact.php`. It checks the
submission (Cloudflare Turnstile, a hidden spam field, a rate limit) and
emails it to the Clerk. Nothing is stored. Check, in order:

1. **Does the script load?** Open the address above in a browser. A blank
   page means it is running. A redirect to the home page means the hosting's
   redirect has caught it: `public_html/.htaccess` on the hosting must keep
   the three lines above `#+WebsiteRedirect`
   (`RewriteEngine On` / `RewriteCond "%{HTTP_HOST}" "^forms\."` /
   `RewriteRule ".*" - [L]`). StackCP rewrites the block *between* its own
   markers whenever redirects are changed, but leaves those lines alone.
2. **`config.php` on the server** (same folder as `contact.php`, never in
   git) must contain the Turnstile **secret key**, the `to_address`
   (clerk@) and `from_address` (info@). The sample is
   `contact-form-php/config.sample.php`.
3. **Turnstile keys.** The public **site key** is in
   `src/data/site-settings.json` (`form.turnstile_site_key`); the secret key
   lives only in `config.php`. Both come from the Cloudflare dashboard →
   Turnstile. If the keys are regenerated, update both places.
4. **Is the message arriving but in spam?** The email is sent from
   `info@llansannan-cc.gov.wales`. Check SPF, DKIM and DMARC still pass (see
   below).

## Council email, in brief

Mail is hosted on Cloud Next (StackCP) — mailboxes, forwarders and DKIM are
managed there. DNS for `llansannan-cc.gov.wales` is on **Cloudflare**;
`llansannan-cc.llyw.cymru` DNS stays on Cloud Next. Mail clients use **IMAP**
(`imap.stackmail.com`, port 993) and SMTP (`smtp.stackmail.com`, port 465 or
587) with the full email address as the username. Only one `_dmarc` TXT
record may exist for the domain (managed through Cloudflare's DMARC
Management). The `llyw.cymru` address only receives and does not send.

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
