# Data processing note — website content editor (Decap CMS)

This note exists so the council can record the CMS setup correctly in its
own data-processing records. It is a technical description, not legal
advice — the council remains responsible for its own UK GDPR compliance
and should have its data protection lead review this before relying on it.

**This does not claim that all processing stays in the UK. It doesn't.**

## What the system is

The content editor at `/admin/` is Decap CMS, an open-source tool that
runs entirely as a page in the clerk's browser — there is no separate
Decap company or Decap server involved, and no database beyond GitHub
itself. Content (meeting minutes, agendas, meeting dates, event listings)
and uploaded PDFs are stored as files in the council's own GitHub
repository. A small Cloudflare Worker, controlled by the council,
handles only the login handshake with GitHub.

## Processors involved and where they operate

- **GitHub (owned by Microsoft)** — stores the repository, all content
  files, uploaded PDFs, and full edit history. GitHub's infrastructure is
  primarily US-based. Transfers of personal data to Microsoft/GitHub in
  the US are, at the time of writing, generally treated as covered by the
  UK extension to the EU–US Data Privacy Framework ("the Data Bridge"),
  but adequacy and certification status can change. The council should
  check GitHub's current data protection terms and Data Bridge
  participation status before relying on this, and record that check.

- **Cloudflare** — serves the public website and runs the OAuth Worker.
  Cloudflare Inc. is a US company operating a global edge network; a
  login request may be processed at any Cloudflare data centre worldwide
  depending on where it originates, not only in the UK or EU. The council
  should review Cloudflare's Data Processing Addendum and standard
  contractual clauses and record that review.

- **No third-party CMS vendor.** Because Decap is self-hosted (as a
  static page) rather than a hosted SaaS product, there is no additional
  processor beyond GitHub and Cloudflare for the CMS itself — unlike
  CMS options that route content through a vendor's own servers.

## What personal data is involved

- The clerk's (and any other CMS user's) GitHub account — name, email
  address, and login activity, held by GitHub.
- Standard web server/edge logs (IP address, timestamp, browser
  information) held briefly by Cloudflare and GitHub as part of normal
  operation, not something the council configures directly.
- Councillors' names appear in published minutes/agendas as public
  meeting records — this is public-task processing, separate from the
  CMS login question above.

## A limitation worth recording: CMS access vs. repository access

The CMS interface only exposes four content types (Meetings, Minutes,
Agendas, Events) and cannot edit site design or any other page. However,
this is a restriction of the *interface*, not of *permissions*. Anyone
added as a GitHub collaborator on the repository has write access to the
entire repository and could, in principle, edit any file directly via
GitHub.com or git, bypassing the CMS altogether. The practical safeguard
is keeping the collaborator list short (see `DECAP_CMS_SETUP.md` step 5),
enforcing 2FA organisation-wide, and treating "being added as a
collaborator" as a privileged decision — not simply "being given CMS
access."

## Recommended next step

Add an entry to the council's Record of Processing Activities (or
equivalent) covering: purpose (publishing statutory minutes/agendas and
community information), categories of data subject (clerk, councillors),
categories of data, processors (GitHub, Cloudflare), and international
transfer basis, reviewed and dated by whoever holds data protection
responsibility for the council.
