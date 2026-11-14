#!/usr/bin/env node
// Fails when the built interface names an origin other than the server that
// serves it. At run time the interface loads nothing from anywhere else: no
// font host, icon kit, image API, analytics. What remains allowed is listed
// below, each with its reason; anything new must be argued for here.
//
// Usage: node scripts/check-origins.mjs [distDir]   (default: dist)
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const dist = process.argv[2] ?? "dist";

/** Links a person chooses to follow. Never loaded by a page. */
const LINKS = [
  "https://github.com/brig-id",
  "https://commons.wikimedia.org/wiki/File:Prism_tribeam_1.jpg",
  "https://commons.wikimedia.org/wiki/File:Dingle_cliff_%28Unsplash%29.jpg",
  "https://passkeys.dev/docs/intro/what-are-passkeys/",
];

/** Names, not addresses anything is fetched from. */
const NAMES = [
  // XML namespaces of SVG and MathML, which the framework creates elements in.
  "http://www.w3.org/",
  // The schema a JSON file declares.
  "https://json.schemastore.org/",
  // Where the framework's error messages point a developer.
  "https://qwik.dev/",
  "https://github.com/QwikDev/",
  "https://qwikdev-build-v2.qwik-8nx.pages.dev/docs/errors/",
  // The stand-in origin of the static build (`adapters/ssg`): each server has
  // its own, unknown at build time. `.invalid` is reserved and never resolves.
  "https://brigid.invalid/",
  // A base for parsing relative addresses, never requested.
  "http://localhost",
  "https://localhost",
];

const TEXT = /\.(html|js|mjs|css|json|svg|txt|webmanifest)$/;
const URL_PATTERN = /https?:\/\/[A-Za-z0-9.-]+(?::\d+)?[^\s"'`<>)\\]*/g;

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (TEXT.test(entry.name)) yield path;
  }
}

const found = new Map();
let scanned = 0;
for await (const file of files(dist)) {
  scanned++;
  const text = await readFile(file, "utf8");
  for (const [url] of text.matchAll(URL_PATTERN)) {
    if (LINKS.some((link) => url === link || url.startsWith(`${link}/`)))
      continue;
    if (NAMES.some((name) => url.startsWith(name))) continue;
    const where = found.get(url) ?? new Set();
    where.add(file.slice(dist.length + 1));
    found.set(url, where);
  }
}

if (scanned === 0) {
  console.error(`check-origins: nothing to read in ${dist}/ (build first)`);
  process.exit(1);
}
if (found.size > 0) {
  console.error(
    "check-origins: the built files name origins that are not allowed:",
  );
  for (const [url, where] of found) {
    console.error(`  ${url}\n    in ${[...where].join(", ")}`);
  }
  process.exit(1);
}
console.log(`check-origins: ${scanned} files, no external origin`);
