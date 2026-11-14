# AGENTS.md — brig·id `app`

This repository is the **web interface** of brig·id: sign-in, account and passkeys, on
Qwik 2. It is built once as static files; a brig·id server (`server-seedling`) serves
them and the API from one origin. Locally, `pnpm dev` proxies `/auth`, `/account` and
`/.well-known` to a server on `:8080` (see `vite.config.ts`).

What the interface is made of, and why, is specified in `brig-id/spec`,
[`interface.md`](https://github.com/brig-id/spec/blob/main/interface.md). Read it before
changing how the interface is built.

## Language

**All content must be in English** — code, comments, doc-comments, commit
messages, issues, pull requests. No exceptions. The interface itself speaks English
and French (see below).

## Rules of the interface

Each is held by a test or a build step; do not work around one.

- **Nothing external.** No request leaves the server's origin at run time, and the app
  builds from the public npm registry with no token. No CDN, font host, icon kit,
  analytics or image API. `scripts/check-origins.mjs` reads the built files.
- **No component library.** Native elements and the classes of `src/styles/`. Components
  use semantic tokens only (`--surface`, `--text`, `--accent`…), never a primitive or a
  literal colour. A widget the platform does not give is written when a page needs it,
  following its WAI-ARIA pattern.
- **Every text is in `src/i18n/messages.ts`, in English and French.** A component holds
  none: `<T id="…" />`, or `tr("…")` at run time. No translated attribute
  (`aria-label`, `title`, `placeholder`): use a visible label, or a `sr-only` text.
- **Sign-in imports nothing from the account part** (`routes/(sign-in)`,
  `components/sign-in` against `routes/(account)`, `components/account`). What both need
  lives in `components/ui` or `lib`.
- **Icons are Phosphor, inlined**: add the name to `scripts/icons.mjs` (interface) or to
  `src/lib/icons.ts` (identity logos), then run `pnpm icons` and commit the result.
- Anything shipped that the project did not make is credited in `CREDITS.md` and on the
  About page, and must be redistributable under the AGPL.

This repository contains **no business logic** — that lives in `brig-id/core`
behind the API. The interface hiding a page is not a control: the server authorises
every request.

## Roadmap & planning

TODOs, backlog ideas, and phase/release status for this repo are tracked as
cards in [brig-id Project 1](https://github.com/orgs/brig-id/projects/1), not
in local files.

## Commands

```bash
pnpm dev              # vite dev server, proxies the API to :8080
pnpm build            # static build + dist/csp-hashes.json + the origin check
pnpm typecheck
pnpm lint             # oxlint
pnpm fmt.check        # prettier --check
pnpm test             # vitest: unit tests and the rules above
pnpm test.e2e         # playwright, against a server built from ../server-seedling
pnpm icons            # regenerate src/components/ui/icons.gen.ts
```

## Commit conventions

Format: `type(scope): <emoji> description`. Full type→emoji mapping:
`/workspaces/roots/commit-convention.json`.

### Allowed scopes

| Scope  | Maps to                                                      |
| ------ | ------------------------------------------------------------ |
| `app`  | Everything under `src/` not covered by a more specific scope |
| `e2e`  | `e2e/` — the Playwright suite                                |
| `ci`   | `.github/workflows/`                                         |
| `deps` | Dependency bumps                                             |
| `ai`   | Instructions for coding agents (this file)                   |
| `docs` | README, CHANGELOG, CREDITS                                   |

**Do not use a scope outside this list.** Update this table and
`scopes.json` together if a new scope is needed.

```text
feat(app): ✨ add conditional UI passkey login
fix(e2e): 🐛 back off after a 429 before retrying delete-passkey
ci(ci): 👷 add Lighthouse accessibility check
chore(deps): 📦 bump @qwik.dev/core to 2.0.0
```

## Releases

Nobody tags by hand. `.github/workflows/release.yml` (release-please) keeps a release
pull request up to date: the next version (from the commit types since the last
release) and its `CHANGELOG.md` entry. **Merging that pull request is the release**: the
tag `vX.Y.Z` and the GitHub Release follow. So:

- the commit type decides the version: `feat` is a minor, `fix` a patch, a `!` or a
  `BREAKING CHANGE:` footer a minor too while the version is 0.x;
- the commit subject is the changelog line: write it for someone reading the release;
- do not edit `CHANGELOG.md`, `.release-please-manifest.json` or the version of
  `package.json` by hand.

## CSP hash manifest

`pnpm build` runs `scripts/csp-hashes.mjs`, which writes `dist/csp-hashes.json`: the
`'sha256-…'` source of every inline `<script>` and `<style>` in the static pages. The
server reads it to allow exactly those and nothing else inline. The hashes change from
one build to the next (the framework's inline state differs), so the manifest is
produced with each build and shipped inside `dist/`, never committed.
