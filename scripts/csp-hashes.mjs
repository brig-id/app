#!/usr/bin/env node
// Writes dist/csp-hashes.json: the CSP `sha256-…` source of every inline
// <script> and <style> in the static build (app#3). A server that serves
// dist/ can then allow exactly these instead of 'unsafe-inline' (core#20).
//
// Usage: node scripts/csp-hashes.mjs [distDir]   (default: dist)
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dist = process.argv[2] ?? "dist";

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith(".html")) yield path;
  }
}

const sha256 = (text) =>
  `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

// Inline only: a <script src=…> is covered by 'self'. Content is hashed
// exactly as written between the tags, which is what browsers hash.
const SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
const STYLE = /<style[^>]*>([\s\S]*?)<\/style>/gi;

const script = new Set();
const style = new Set();
const pages = [];
for await (const file of htmlFiles(dist)) {
  const html = await readFile(file, "utf8");
  for (const [, body] of html.matchAll(SCRIPT))
    if (body) script.add(sha256(body));
  for (const [, body] of html.matchAll(STYLE))
    if (body) style.add(sha256(body));
  pages.push(file.slice(dist.length + 1));
}

const manifest = {
  script: [...script].sort(),
  style: [...style].sort(),
  pages: pages.sort(),
};
await writeFile(
  join(dist, "csp-hashes.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `csp-hashes.json: ${manifest.script.length} script and ${manifest.style.length} style hashes from ${pages.length} pages`,
);
