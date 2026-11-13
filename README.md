# brig·id — app

The web interface of brig·id: sign-in, account and passkeys. It is built once, as static
files, and served by a brig·id server from its own origin.

It loads **nothing from anywhere else**: no CDN, font host, icon kit, image API or
analytics, and it builds from a clean clone with the public npm registry only. What it is
made of, and why, is specified in
[`interface.md`](https://github.com/brig-id/spec/blob/main/interface.md).

## Structure

```
├── adapters/ssg/         # the static build
├── e2e/                  # Playwright, against a real server
├── scripts/              # icons.mjs, csp-hashes.mjs, check-origins.mjs
└── src/
    ├── assets/           # fonts and the background image, with their licences
    ├── components/
    │   ├── ui/           # icon, callout, identity logo, language switch
    │   ├── sign-in/      # used by the sign-in part only
    │   └── account/      # used by the account part only
    ├── i18n/             # every text, in English and French
    ├── lib/              # calls to the server, passkey ceremonies, validation
    ├── routes/
    │   ├── (sign-in)/    # /, /signup/, /recover/, /continue/, /about/
    │   └── (account)/    # /welcome/, /identities/, /passkeys/
    └── styles/           # tokens, fonts, base, components, the two layouts
```

The interface has **parts**, called what they are: _sign-in_ (someone arriving) and
_account_ (someone at home); _administration_ comes later. Sign-in imports nothing from
the others, so that its pages can be reviewed in one sitting; `src/architecture.spec.ts`
checks it.

## Design system

Our own, with no component library: native elements, one stylesheet.

- **Tokens** are CSS custom properties on three levels (`src/styles/tokens.css`):
  _primitive_ (the palette in `oklch`, spacing, radii, type scale), _semantic_
  (`--surface`, `--text`, `--accent`, `--danger`… the only ones a component uses) and a
  few _component_ values. The dark theme is the only set of semantic values today; the
  light theme will add a second set and change no component.
- **Components**: page layouts, card, input, button, callout, icon. Classes on native
  elements (`button`, `input`, `fieldset`…), which bring their keyboard and screen-reader
  behaviour with them.
- **Icons** are [Phosphor](https://phosphoricons.com) drawings inlined at build time:
  `scripts/icons.mjs` copies the ones the interface uses from `@iconify-json/ph` into
  `src/components/ui/icons.gen.ts` (committed). After adding an icon to that script or to
  the logo library (`src/lib/icons.ts`), run `pnpm icons`.
- **Fonts**: Geist and Geist Mono, embedded (`src/assets/fonts/`). Geist Mono is for what
  a person compares character by character: server names, recovery codes.

## Languages

English and French. **No component holds a text**: every one is in
`src/i18n/messages.ts`, in both languages, and a test fails on a text left in a component
or written in one language only.

The pages are static, so both languages are in each page and the stylesheet shows the one
of the document. A script in the head sets it before the first paint, from the person's
remembered choice, else from the browser's languages. In a component:

```tsx
<T id="signin.title" />
<T id="continue.title" p={{ app: request.client.name }} />
```

`tr("…")` gives a text at run time, for what cannot hold markup (the document's title, a
downloaded file).

## Development

```shell
pnpm install
pnpm dev       # Vite dev server; open https://brigid.localhost:5173 (see HTTPS below)
```

Vite proxies `/auth/*`, `/account/*` and `/.well-known/*` to `http://localhost:8080`, a
brig·id server ([`server-seedling`](https://github.com/brig-id/server-seedling)), as in
production where the server serves the interface and these routes from one origin.
`*.localhost` resolves to 127.0.0.1 in every modern browser and counts as a secure
context, so passkeys work on it over plain HTTP.

The server must be told the same domain and address (`BRIGID_SERVER__DOMAIN`,
`BRIGID_SERVER__PUBLIC_URL`: `brigid.localhost`, port 5173, `https://` once the
certificate below exists), or the passkey ceremonies fail on an origin mismatch.

### HTTPS in dev

The plain-HTTP `*.localhost` exception above satisfies the browser's own WebAuthn
implementation, but not every WebAuthn _client_ — some passkey-manager browser
extensions (e.g. Proton Pass) run their own origin check that doesn't grant that
exception and require a real `https://` scheme, failing registration with an
"insecure protocol" error even though the browser itself considers the page secure.

Generate a locally-trusted cert once with [`mkcert`](https://github.com/FiloSottile/mkcert):

```shell
mkcert -install   # one-time: trusts a local CA in your OS/browser trust store
mkdir -p .cert && cd .cert
mkcert -cert-file brigid.localhost.pem -key-file brigid.localhost-key.pem \
  brigid.localhost "*.brigid.localhost" localhost 127.0.0.1 ::1
```

`vite.config.ts` picks up `.cert/brigid.localhost{,-key}.pem` automatically if present
and serves HTTPS; without it, `pnpm dev` falls back to plain HTTP so a fresh clone
still runs out of the box. `.cert/` is gitignored — every developer generates their own.

If you're testing from your **host** browser through a devcontainer's forwarded port
(rather than inside the container), run `mkcert -install` on the host too — the CA
trusted inside the container isn't trusted by the host browser. Without it, expect a
cert-authority warning (Chrome: `NET::ERR_CERT_AUTHORITY_INVALID`, Firefox:
`SEC_ERROR_UNKNOWN_ISSUER`) — clicking through still gets you a real `https://` origin,
so it's not blocking, just not a clean padlock.

**Firefox note:** it ships its own certificate store, independent of the OS/system
trust store `mkcert -install` updates — installing the CA system-wide (or even running
`mkcert -install` a second time on the host) does not make Firefox trust it. Import the
CA into Firefox directly instead: copy the `rootCA.pem` from `mkcert -CAROOT` on the
machine that generated it, then in Firefox go to `about:preferences#privacy` →
**Certificates** → **View Certificates** → **Authorities** tab → **Import**, select the
file, and check "Trust this CA to identify websites". Reload the page — no restart
needed.

## Checks

```shell
pnpm typecheck
pnpm lint
pnpm test       # unit tests, and the rules of src/architecture.spec.ts
pnpm build      # static build, then the two checks below
pnpm test.e2e   # Playwright, against a server built from ../server-seedling
pnpm audit --audit-level=moderate
```

`pnpm build` ends with two scripts:

- `scripts/csp-hashes.mjs` writes `dist/csp-hashes.json`, the hash of every inline script
  and style of the pages. The server allows exactly these in its Content Security Policy,
  and nothing inline otherwise.
- `scripts/check-origins.mjs` fails when the built files name an origin that is not on
  its short list (links a person chooses to follow, XML namespaces).

The end-to-end suite needs the sibling repository: by default `../server-seedling`, or
the directory named by `BRIGID_SERVER_DIR`.

## Production

`pnpm build` produces `dist/`: static pages, with no Node.js at run time. A brig·id
server serves it as it is.

## Licence and credits

[AGPL-3.0-or-later](LICENSE). The image, fonts and icons shipped with the interface are
credited in [`CREDITS.md`](CREDITS.md), and on the interface's own About page.
