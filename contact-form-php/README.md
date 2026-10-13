# Contact form handler (PHP)

Runs on the Cloud Next hosting, not Cloudflare. NOT deployed with the website.

## One-time setup

1. **Turnstile**: Cloudflare dashboard > Turnstile > Add widget. Hostname: `llansannan-cc.gov.wales`. Mode: Managed. Copy the *site key* (public) and *secret key* (private).
2. **Subdomain**: in StackCP create `forms.llansannan-cc.llyw.cymru` (or similar) with its own web folder, and make sure no website redirect applies to it.
3. **Upload** `contact.php` and `.htaccess` to that folder (StackCP File Manager).
4. **Create `config.php`** in that folder (copy from `config.sample.php`) and paste the Turnstile *secret key* there, on the server only.
5. **Website**: put the form URL and Turnstile *site key* into `src/data/site-settings.json` (`form.endpoint`, `form.turnstile_site_key`), then push.
6. **Test**: send a message from the live contact page, then check spam/rate-limit behaviour.

## Notes
- Nothing is stored; the message is only emailed to `to_address`.
- If mail does not arrive, check `from_address` is on a domain hosted in StackCP and check spam folders.
- Never commit `config.php`.
