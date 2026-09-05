# AGENTS.md — brig·id `app`

This repository is the **Qwik UI** for brig·id: login, register, and passkey
(WebAuthn) management. It consumes `brigid-api` over the same origin — in
production that means a single `server-leaf` process serves both the API and
this app's static build (see `LEAF_SERVER__UI_DIST_DIR`); locally, `pnpm dev`
proxies `/auth` and `/.well-known` to a `server-leaf` instance running on
`:8080` (see `vite.config.ts`).

## Language

**All content must be in English** — code, comments, doc-comments, commit
messages, issues, pull requests. No exceptions.

## Scope

- Qwik City app: `/`, `/login/`, `/register/`, `/passkeys/` routes
- Static (SSG) production build — no server-side app code ships; `server-leaf`
  serves the built output as static files
- `src/lib/webauthn.ts` — client-side WebAuthn ceremonies (`register`,
  `login`, `addCredential`, `deletePasskey`) against `brigid-api`
- `src/lib/unsplash.ts` — the daily rotating login/register background photo
- Playwright E2E suite (`e2e/`) — drives a real `leaf` binary from the
  sibling `server-leaf` repo

This repository contains **no business logic** — that lives in `brig-id/core`
behind `brigid-api`.

## Roadmap & planning

TODOs, backlog ideas, and phase/release status for this repo are tracked as
cards in [brig-id Project 1](https://github.com/orgs/brig-id/projects/1), not
in local files.

## Commands

```bash
pnpm dev              # vite dev server (SSR), proxies /auth + /.well-known to :8080
pnpm build            # full production build (SSG)
pnpm typecheck
pnpm lint             # oxlint
pnpm fmt.check        # prettier --check
pnpm test             # vitest unit tests
pnpm test.e2e         # playwright, drives a real leaf from ../server-leaf
```

`UNSPLASH_ACCESS_KEY` must be exported (or set via `envPrefix`-matched env)
for the login/register background photo to load during a local build —
without it, `src/lib/unsplash.ts` degrades gracefully to no photo.

## Commit conventions

Format: `type(scope): <emoji> description`. Full type→emoji mapping:
`/workspaces/roots/commit-convention.json`.

### Allowed scopes

| Scope | Maps to |
| --- | --- |
| `app` | Everything under `src/` not covered by a more specific scope |
| `e2e` | `e2e/` — the Playwright suite |
| `ci` | `.github/workflows/` |
| `deps` | Dependency bumps |

**Do not use a scope outside this list.** Update this table and
`scopes.json` together if a new scope is needed.

```text
feat(app): ✨ add conditional UI passkey login
fix(e2e): 🐛 back off after a 429 before retrying delete-passkey
ci(ci): 👷 add Lighthouse accessibility check
chore(deps): 📦 bump @builder.io/qwik to 1.21.0
```
