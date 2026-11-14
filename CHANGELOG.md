# Changelog

All notable changes to `@brig-id/app` are documented in this file. This project
adheres to [Semantic Versioning](https://semver.org/).

From 0.2.0 on, each entry is written by release-please from the commits merged
since the last release: there is no "Unreleased" section to keep by hand. What
a list of commits does not say is in the pull requests it links to.

## [0.2.0](https://github.com/brig-id/app/compare/v0.1.0...v0.2.0) (2026-11-14)


### Features

* ✨ "Add a passkey" now adds a credential to the current identity ([fed712d](https://github.com/brig-id/app/commit/fed712d3a84bba78632e271f28eb2f7bdc31cb8d))
* ✨ visual redesign of login/register — daily photo + gradient accent ([78cbf57](https://github.com/brig-id/app/commit/78cbf571bb8f3d32c1cc18814f849a94c1b0a0ac))
* **app:** ✨ linking page: continue to a site as the identity you choose ([056f957](https://github.com/brig-id/app/commit/056f9570d60831d5734f6697cbd5e0c3c2a74360)), closes [#43](https://github.com/brig-id/app/issues/43)
* **app:** ✨ passkey-only signup with onboarding, sign-in without username, account recovery ([580f8ab](https://github.com/brig-id/app/commit/580f8abb256a6178f4be6c0d3f057a4070a0cfa3))
* **app:** ✨ rewrite the interface on qwik 2, self-contained, in two languages ([392048f](https://github.com/brig-id/app/commit/392048f8247c31b283421e3c8248a3a045b2e934))
* **app:** ✨ say why passkeys can't work here and what to do ([15b6ece](https://github.com/brig-id/app/commit/15b6ece9af006dc32eef32d88091c013b0ad432c))
* **app:** ✨ signed-in shell, identities page, icon library, passkey names, passkey autofill ([ce8170f](https://github.com/brig-id/app/commit/ce8170fae712cb814007903ba692df9037683617))
* **app:** ✨ the light theme, following the system, with a remembered switch ([5d46858](https://github.com/brig-id/app/commit/5d46858e521ffd507f8f9aa8054626edcca8db2b))
* **app:** ✨ the session is an HttpOnly cookie: no token or account id in the browser ([c788e00](https://github.com/brig-id/app/commit/c788e0075d0efae251328130d50b705b578e51c5))
* **app:** ✨ write the CSP hash manifest of inline scripts and styles at build ([3d56e05](https://github.com/brig-id/app/commit/3d56e05062b625d0aa57e45052482edd2b0b02a1))


### Bug Fixes

* 🐛 disable "Remove" for a user's only passkey ([376100e](https://github.com/brig-id/app/commit/376100ef93005a136e70dd36ecc0991ef89f81d5))
* 🐛 drop custom brand gradient, apply the org's WA Kit overrides ([c910036](https://github.com/brig-id/app/commit/c910036d22decbec72461b47ba6cf782acacfbc0))
* **app:** 🐛 a read that hits the rate limit is asked again, not shown stale ([50799b7](https://github.com/brig-id/app/commit/50799b70ca51b1f695ae64c2993ff8e20424fc5f))
* **app:** 🐛 distinguish each passkey's Remove button by accessible name ([19da6ef](https://github.com/brig-id/app/commit/19da6ef1b0e26c9de1b0ecddf4471703f1c4873e))
* **ci:** 🐛 match dev/* branches in workflow triggers ([6cceb38](https://github.com/brig-id/app/commit/6cceb387a97d52679fe8a390f6f1470a6a8945c4))
* **deps:** 🔒️ refresh dependencies to clear pnpm audit advisories ([44f1f6e](https://github.com/brig-id/app/commit/44f1f6e646762afbf41dd511497ac7c4e819f0b5))

## [0.2.0] in words

Written by hand while 0.2.0 was being made; the generated entry is above.

### Changed

- **The interface is rewritten on Qwik 2** (`@qwik.dev/core`, Vite 8), with its own
  design system: native elements, one stylesheet, tokens on three levels, the dark
  theme. No component library.
- **English and French.** Every text lives in `src/i18n/messages.ts`; the language
  follows the browser, with a switch that is remembered.
- **Nothing external.** Icons are Phosphor drawings inlined at build time, the fonts
  (Geist, Geist Mono) and the background image are embedded, and a build step fails
  when the built files name another origin.
- The pages are sorted into parts: sign-in (`/`, `/signup/`, `/recover/`,
  `/continue/`, `/about/`) and account (`/welcome/`, `/identities/`, `/passkeys/`).
  `/login/` and `/register/` are gone.
- Identity logos are `icon:ph:<name>` references; the picker is rebuilt on Phosphor.
- Deleting an identity and replacing a recovery code ask for confirmation in the
  page, not in a browser dialog.
- The sign-up page and the link to it follow the server's setting: a server that
  closed sign-up says so.
- Licence: AGPL-3.0-or-later (was LGPL-3.0-or-later).

### Added

- An About page: what runs here, its licence, where its source is, credits.
- `CREDITS.md`.

### Removed

- Web Awesome Pro and its private npm registry: the app builds from a clean clone
  with no token.
- The Unsplash background and its API key: no third party learns who opens a
  sign-in page.

## [0.1.0] - 2026-09-04

First tagged release, alongside `crypto`, `core`, and `server-leaf`.

### Added

- Qwik UI: login, register, and passkeys pages, talking to `server-leaf`'s
  `brigid-api` over HTTP.
- Native WebAuthn passkey registration/authentication in the browser,
  including detecting whether the platform supports passkeys at all.
- Username-only register/login flow (no separate display-name field),
  with an "add a passkey" flow reusing the same fields.
- Qwik static adapter (SSG) build (`pnpm build.server`), so the UI ships
  as static files for `server-leaf` to serve directly — no Node runtime
  needed in production.
- Dev server on `brigid.localhost` (instead of bare `localhost`) over
  HTTPS via `mkcert`, matching the domain shape a real deployment uses.
- WebAwesome Pro component library, replacing the initial Tailwind CSS
  setup.
- Playwright E2E suite (`pnpm test.e2e`): register, login, list/delete
  passkeys, sign out, and Firefox-compatible form-validation checks,
  driven against a real `leaf` binary and a virtual CDP WebAuthn
  authenticator (Chromium only).
- `SECURITY.md`, matching the SLA already published by `crypto`, `core`,
  and `server-leaf`.

### Changed

- Toolchain migrated to TypeScript 7 and `oxlint`.
- `vite` switched back from the `rolldown-vite` alias to plain `vite`
  (see Fixed below) — `rolldown-vite` remains an option to revisit once
  its bundler-splitting bug is fixed upstream.

### Fixed

- API error responses are now surfaced to the user instead of being
  swallowed; empty-body responses no longer fail to parse.
- `pnpm audit` findings: `sharp` (bundled `libvips` CVEs, pulled in via
  `vite-imagetools`) pinned via a `pnpm-workspace.yaml` override;
  `brace-expansion` bumped.
- Playwright's `clickUntil` retry helper could hang retrying a click on a
  locator that had already vanished from the page; now bounded with a
  timeout.
- The E2E suite's scratch database path is now randomized per run
  (`os.tmpdir()` + timestamp) instead of a fixed repo-root path, so
  parallel/repeated local runs don't collide.
- **Static (SSG) build produced an unusable page**: the first JS chunk
  shipped empty under `rolldown-vite`, so qwikloader never initialized and
  no custom element (`wa-input`, `wa-button`, ...) ever became interactive
  when the build was served statically — reproduced with `server-leaf`
  entirely out of the picture (plain static file server). Root-caused to
  `rolldown-vite` itself: switching the `vite` dependency back to plain
  `vite` produces a real, non-empty bootstrap chunk with working hydration
  (verified with a headless Chromium check: custom elements upgrade,
  shadow roots attach, zero console errors). The Playwright E2E suite now
  runs against the actual static build served by a single `leaf` process
  (`LEAF_SERVER__UI_DIST_DIR`) — the real production topology — instead of
  `pnpm dev`.
- `/passkeys`: deleting a passkey could leave the list showing the
  already-deleted item indefinitely. The delete itself succeeded, but the
  list-refresh fetch that follows it can land within the same `/auth/*`
  rate-limit burst as the register/login calls that preceded it; on a 429
  the refresh silently gave up and never retried, so the UI never
  re-synced. `refresh()` now retries once after a 3.5s backoff (the
  limiter refills one token every 3s) if the first attempt is
  rate-limited.
- Removed a dangling `data-fa-kit-code` attribute in `entry.ssr.tsx` — a
  leftover Font Awesome Kit reference with no corresponding loader script
  anywhere in the app.

### Security

- This build's inline `<script>`/`<style>` output (Qwik's SSG
  resumability bootstrap) is the reason `server-leaf` currently serves a
  `Content-Security-Policy` with `'unsafe-inline'` on `script-src`/
  `style-src` — a tracked stopgap, not a permanent choice. See
  `brig-id/spec`'s `security-model.md` §4.6 and `audit-checklist.md` §2.6
  for the open finding, and `.dev/phases/backlog.md` for the real fix
  (a build-time SHA-256 hash allowlist generated from this repo's static
  output).
