/**
 * The base Vite configuration. The static build extends it
 * (`adapters/ssg/vite.config.ts`).
 */
import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";

/**
 * Vite normally starts from `index.html`; the qwikRouter plugin makes it
 * start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig(() => {
  return {
    plugins: [qwikRouter(), qwikVite()],
    resolve: {
      // `~/…` is `src/…` (tsconfig.json).
      tsconfigPaths: true,
    },
    server: {
      host: "0.0.0.0",
      // *.localhost resolves to 127.0.0.1 in every modern browser and is a
      // secure context, like bare "localhost": browsers run WebAuthn on it
      // over plain HTTP. Vite's Host-header check blocks anything not
      // explicitly allowed, hence the entry below.
      allowedHosts: [".localhost"],
      // Real HTTPS on top of that: some passkey providers run their own
      // origin check, stricter than the browser's, and require an actual
      // https:// scheme. Generate the certificate once with `mkcert` (see
      // README); without it, plain HTTP.
      https: httpsConfig(),
      headers: {
        "Cache-Control": "public, max-age=0",
      },
      // The server's own routes, as they are: in production the server
      // serves the interface and these routes from one origin.
      proxy: {
        "/auth": { target: "http://localhost:8080", changeOrigin: true },
        "/account": { target: "http://localhost:8080", changeOrigin: true },
        "/.well-known": { target: "http://localhost:8080", changeOrigin: true },
      },
    },
    preview: {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
    },
  };
});

const CERT_DIR = new URL(".cert/", import.meta.url);
const CERT_FILE = new URL("brigid.localhost.pem", CERT_DIR);
const KEY_FILE = new URL("brigid.localhost-key.pem", CERT_DIR);

/** The mkcert certificate for `brigid.localhost` when there is one. */
function httpsConfig() {
  if (!existsSync(CERT_FILE) || !existsSync(KEY_FILE)) return undefined;
  return {
    cert: readFileSync(CERT_FILE),
    key: readFileSync(KEY_FILE),
  };
}
