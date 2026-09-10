# Decap CMS setup — Llansannan Community Council

This is the one-time setup for the clerk's content editor at `/admin/`. It
covers four content types only: **Meetings**, **Minutes**, **Agendas**, and
**Events**. It does not give access to site design, navigation, or any other
page — those live in files the CMS never touches.

Read this fully before starting. Steps 1–4 are done once by whoever
administers the GitHub/Cloudflare accounts (currently Tom). Steps 5–6 are
what the clerk needs day to day.

---

## 1. Council-owned GitHub organisation, with 2FA enforced

The repository should live in a GitHub **organisation** the council owns —
not a personal account — so access survives any one person leaving.

1. Create an organisation (or use the existing council one) at
   github.com/organizations/new.
2. In the organisation's **Settings → Authentication security**, turn on
   **"Require two-factor authentication for everyone in this organisation."**
3. Transfer this repository into that organisation (Repository →
   Settings → General → "Transfer ownership"), or push a fresh copy if a
   transfer isn't practical.

## 2. Create the GitHub OAuth App

This lets the CMS log the clerk in via GitHub, without ever seeing their
password.

1. In the organisation: **Settings → Developer settings → OAuth Apps →
   New OAuth App** (or create it under a personal account with admin
   rights on the repo, if the org doesn't support org-owned OAuth Apps on
   your plan).
2. Fill in:
   - **Application name**: `Llansannan Council CMS`
   - **Homepage URL**: your live site URL, e.g. `https://llansannan-cc.gov.uk`
   - **Authorization callback URL**: `https://<your-worker-subdomain>.workers.dev/callback`
     (you'll get the exact Worker URL in step 3 — come back and set this
     precisely once you know it; a mismatch here is the #1 cause of login
     failing).
3. After creating it, copy the **Client ID**, and generate a **Client
   secret** — copy it immediately, it's only shown once.

## 3. Deploy the Cloudflare OAuth Worker

This is the small, separate Worker in `/cms-oauth-worker/` — it's the only
component that ever handles the GitHub client secret.

```
cd cms-oauth-worker
npx wrangler login
npx wrangler deploy
```

Then:

1. Open `cms-oauth-worker/wrangler.toml` and set:
   - `GITHUB_CLIENT_ID` — from step 2
   - `ALLOWED_ORIGIN` — the exact site origin, e.g. `https://llansannan-cc.gov.uk`
     (no trailing slash). This is what stops the login token being handed
     to any page other than the council's own site.
2. Set the secret (never goes in a file, never goes in git):
   ```
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```
   Paste the Client Secret from step 2 when prompted.
3. Redeploy so the settings take effect: `npx wrangler deploy`
4. Note the Worker's URL from the deploy output (something like
   `https://llansannan-cms-auth.<your-subdomain>.workers.dev`). Go back to
   the GitHub OAuth App (step 2) and set the callback URL to
   `<that-url>/callback` exactly.

## 4. Point the CMS at your repo and Worker

Edit `public/admin/config.yml`:

- `repo:` → `your-org-name/llansannan-website`
- `base_url:` → the Worker URL from step 3 (no trailing slash, no `/callback`)

Commit and push. Cloudflare will rebuild automatically.

## 5. Add the clerk as a collaborator

1. Repository → **Settings → Collaborators and teams → Add people**.
2. Add the clerk's GitHub account with **Write** access (not Admin — they
   don't need to change repository settings).
3. Confirm their personal GitHub account also has 2FA enabled (the org
   setting from step 1 enforces this on next login if it isn't already).
4. It's worth adding one backup collaborator (e.g. the chair) in case the
   clerk is unavailable — but keep the list short. Every collaborator has
   push access to the *whole* repository, not just the four CMS
   collections (see `DATA_PROCESSING_NOTE.md` for why that matters).

## 6. Using it day to day (for the clerk)

1. Go to `https://<your-site>/admin/`.
2. Click **Login with GitHub**, sign in if prompted.
3. Choose **Meetings**, **Minutes**, **Agendas**, or **Events** from the
   sidebar.
4. Fill in the Welsh and English fields, upload the PDF where asked, and
   click **Publish**. The site rebuilds automatically within a couple of
   minutes.

### Accessible PDFs

Every minutes/agenda PDF must be a genuine searchable, tagged PDF — not a
scanned photo of a printed page. In practice: type or paste the text into
Word (or LibreOffice Writer), then use **File → Export → Create PDF**
(not "print to PDF" from a scanned image). Word's built-in Accessibility
Checker (Review tab) is worth running before exporting. If a document must
be scanned, run it through OCR first so the text is selectable.

### Limits enforced automatically

- Only `.pdf` files are accepted, and only up to 10MB — anything else fails
  the site's build step and won't go live (the CMS will show an error;
  see `CMS_BACKUP_RECOVERY.md` if that happens unexpectedly).
- Events disappear from the public calendar automatically once their date
  has passed — no need to delete them, though tidying up old entries
  occasionally keeps the list in the CMS manageable.
