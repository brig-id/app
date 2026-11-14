import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The suite runs the real sign-up, sign-in and passkey flows, which need a
// running brig·id server: the interface alone has nothing to call. The
// server lives in the sibling `server-seedling` repository; by default this
// assumes the workspace layout (`/workspaces/<repo>`). Set BRIGID_SERVER_DIR
// to point elsewhere (CI does).
//
// It is the production topology: one server process serving both the API
// and the static build of the interface, one origin, no proxy.
export const SERVER_DIR =
  process.env.BRIGID_SERVER_DIR ??
  path.resolve(__dirname, "../server-seedling");

const CERT_DIR = path.join(__dirname, ".cert");
const HAS_CERT =
  existsSync(path.join(CERT_DIR, "brigid.localhost.pem")) &&
  existsSync(path.join(CERT_DIR, "brigid.localhost-key.pem"));
const WEB_PROTOCOL = HAS_CERT ? "https" : "http";
const PORT = 8080;

export const E2E_ORIGIN = `${WEB_PROTOCOL}://brigid.localhost:${PORT}`;

// Fixed, valid-looking 64-hex-char (32 byte) master key — deterministic,
// dev/test only.
export const E2E_MASTER_KEY =
  "0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0";

export default defineConfig({
  testDir: "./e2e",
  // A rate-limit backoff can stack across the steps of one test (sign-up,
  // sign-in, a list refresh can each wait 3.5 s and retry): the default 30 s
  // is not enough for the worst case.
  timeout: 90_000,
  // Every test hits the same server from the same address, and the passkey
  // ceremonies are rate-limited there (20 per minute, bursts of 5): a real
  // protection, not something to weaken for tests. One worker keeps the
  // suite within it.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: E2E_ORIGIN,
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Playwright has no virtual authenticator for Firefox (the one in
      // e2e/webauthn.ts is Chrome DevTools Protocol only): the tests that
      // need a passkey skip themselves here, visibly, and the others run.
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],

  webServer: [
    {
      // Build the static interface with its CSP manifest (the server allows
      // the inline scripts by hash: a stale manifest blocks them, and the
      // pages never start), then start the server that serves it.
      command: `pnpm build.server && node scripts/csp-hashes.mjs && cargo run --manifest-path ${path.join(SERVER_DIR, "Cargo.toml")}`,
      // A TCP check, not a URL: with a certificate the server speaks HTTPS
      // only, and this readiness check cannot be told to accept a
      // self-signed certificate.
      port: PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        BRIGID_MASTER_KEY: E2E_MASTER_KEY,
        BRIGID_SERVER__DOMAIN: "brigid.localhost",
        BRIGID_SERVER__HOST: "127.0.0.1",
        BRIGID_SERVER__PORT: String(PORT),
        BRIGID_SERVER__PUBLIC_URL: E2E_ORIGIN,
        BRIGID_SERVER__UI_DIST_DIR: path.join(__dirname, "dist"),
        // A new file per run: accounts and passkeys left by an earlier run
        // would change what the tests see.
        BRIGID_DATABASE__PATH: path.join(
          os.tmpdir(),
          `brigid-e2e-${Date.now()}.db`,
        ),
        ...(HAS_CERT
          ? {
              BRIGID_SERVER__TLS_CERT: path.join(
                CERT_DIR,
                "brigid.localhost.pem",
              ),
              BRIGID_SERVER__TLS_KEY: path.join(
                CERT_DIR,
                "brigid.localhost-key.pem",
              ),
            }
          : {}),
      },
    },
  ],
});
