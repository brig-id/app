/**
 * Rules of the interface that a reviewer should not have to check by eye.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL(".", import.meta.url));

function files(dir: string, keep: (path: string) => boolean): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return files(path, keep);
    return keep(path) ? [path] : [];
  });
}

const components = files(SRC, (p) => p.endsWith(".tsx"));
const sources = files(SRC, (p) => /\.(tsx?|css)$/.test(p) && !/\.spec\.tsx?$/.test(p));
const name = (path: string) => relative(SRC, path);

/** The source without its comments. */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("every text lives in src/i18n/messages.ts", () => {
  // Written the same in every language.
  const ALLOWED = new Set(["brig·id", "Français", "English"]);
  // A word between two tags, or between a tag and an expression. Code
  // between a `>` and a `<` (a generic, a comparison) holds one of the
  // characters excluded here.
  const TEXT = /(?:>|\})\s*([^<>{}()=;,:&|?!"'`[\]\n]*\p{L}[^<>{}()=;,:&|?!"'`[\]\n]*?)\s*(?:<|\{)/gu;
  const KEYWORDS =
    /^(?:return|else|export|const|let|import|from|as|satisfies|extends|async|await|typeof|keyof|readonly|function|default|type|interface|in|of|try|catch|finally|void|Promise)(?:\s|$)/;
  const texts = (source: string) =>
    [...source.matchAll(TEXT)]
      .map(([, text]) => text!.trim())
      .filter((word) => !ALLOWED.has(word) && !KEYWORDS.test(word));

  it("the scan sees a text when there is one", () => {
    expect(texts("<h1>Sign in</h1>")).toEqual(["Sign in"]);
    expect(texts("<p>Back to {name}</p>")).toEqual(["Back to"]);
    expect(texts("<p>{count} passkeys</p>")).toEqual(["passkeys"]);
    expect(texts("<p>\n  Créer un compte\n</p>")).toEqual(["Créer un compte"]);
    expect(texts('<a class="brand">brig·id</a>')).toEqual([]);
    expect(texts('<T id="signin.title" />')).toEqual([]);
    expect(texts("const s = useSignal<string | null>(null);")).toEqual([]);
  });

  it("no component holds a text of its own", () => {
    const found: string[] = [];
    for (const path of components) {
      for (const word of texts(code(path))) found.push(`${name(path)}: ${word}`);
    }
    expect(found).toEqual([]);
  });

  it("no attribute holds one either", () => {
    // Examples of what to type are the same in every language.
    const EXAMPLES = new Set(["id.example.org", "XXXX-XXXX-XXXX-…"]);
    const ATTRIBUTE = /\b(aria-label|title|alt|placeholder|label)="([^"]*)"/g;
    const found: string[] = [];
    for (const path of components) {
      for (const [, attribute, value] of code(path).matchAll(ATTRIBUTE)) {
        if (!/\p{L}/u.test(value!) || EXAMPLES.has(value!)) continue;
        found.push(`${name(path)}: ${attribute}="${value}"`);
      }
    }
    expect(found).toEqual([]);
  });
});

describe("the sign-in part can be reviewed in one sitting", () => {
  const signIn = sources.filter((p) =>
    /[\\/](routes[\\/]\(sign-in\)|components[\\/]sign-in)[\\/]/.test(p),
  );
  const OTHER_PARTS = /(\(account\)|\(admin\)|components\/account|components\/admin)/;

  it("has pages", () => {
    expect(signIn.length).toBeGreaterThan(4);
  });

  it("imports nothing from the account or the administration", () => {
    const found: string[] = [];
    for (const path of signIn) {
      for (const [, from] of code(path).matchAll(/from\s+"([^"]+)"/g)) {
        if (OTHER_PARTS.test(from!)) found.push(`${name(path)}: ${from}`);
      }
    }
    expect(found).toEqual([]);
  });
});

describe("the interface is self-contained", () => {
  it("uses no element or class of a component library", () => {
    const found = sources.filter((p) => /\bwa-[a-z]/.test(code(p))).map(name);
    expect(found).toEqual([]);
  });

  it("names no other origin, except links a person chooses to follow", () => {
    // The same list as `scripts/check-origins.mjs`, which reads the built files.
    const LINKS = new Set([
      "https://github.com/brig-id",
      "https://commons.wikimedia.org/wiki/File:Prism_tribeam_1.jpg",
      "https://passkeys.dev/docs/intro/what-are-passkeys/",
    ]);
    const found: string[] = [];
    for (const path of sources) {
      if (path.endsWith("icons.gen.ts") || path.endsWith("messages.ts")) continue;
      for (const [url] of code(path).matchAll(/https?:\/\/[^\s"'`)<]+/g)) {
        if (LINKS.has(url) || url.startsWith("https://${")) continue;
        found.push(`${name(path)}: ${url}`);
      }
    }
    expect(found).toEqual([]);
  });
});
