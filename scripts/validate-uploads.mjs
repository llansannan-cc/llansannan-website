#!/usr/bin/env node
/**
 * Build-time safeguard for CMS uploads.
 *
 * Decap's "file" widget doesn't reliably enforce file type or size across
 * versions, so the clerk could, in principle, upload something that isn't a
 * PDF, or a very large file. This script runs as part of every build
 * (see package.json "prebuild") and fails the build — meaning Cloudflare
 * will NOT deploy — if anything in the CMS uploads folder isn't a PDF under
 * the size limit. The previous good version of the site stays live until
 * the offending file is replaced.
 *
 * This only checks files uploaded through the CMS (public/documents/uploads),
 * not the pre-existing dated document archive, which isn't touched by Decap.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const UPLOADS_DIR = 'public/documents/uploads';
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function walk(dir) {
  let files = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return files; // nothing uploaded yet — fine
    throw err;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

const files = walk(UPLOADS_DIR);
const problems = [];

for (const file of files) {
  if (extname(file).toLowerCase() !== '.pdf') {
    problems.push(`${file} — not a PDF (only PDF uploads are allowed via the CMS)`);
    continue;
  }
  const { size } = statSync(file);
  if (size > MAX_BYTES) {
    const mb = (size / (1024 * 1024)).toFixed(1);
    problems.push(`${file} — ${mb}MB exceeds the 10MB limit`);
  }
}

if (problems.length > 0) {
  console.error('\n✖ Upload validation failed — build stopped, nothing will deploy:\n');
  for (const p of problems) console.error('  - ' + p);
  console.error('\nRemove or replace the file(s) above via the CMS, then the site will rebuild automatically.\n');
  process.exit(1);
}

console.log(`✓ Upload validation passed (${files.length} file(s) checked in ${UPLOADS_DIR}).`);
