import { expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { E2E_DATABASE, E2E_MASTER_KEY, SERVER_DIR } from "../playwright.config";

// An application that signs people in through the server under test. There
// is none running: a suite plays its part. It registers it with the server's
// command line, sends the browser to the server as the application would,
// and answers at its return address itself.

export const RETURN_TO = "https://application.example/back";
// RFC 7636 appendix B.
export const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
export const CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

/** `seedling client …` on the database of the running server. */
export function seedlingClient(...args: string[]): string {
  return execFileSync(
    "cargo",
    [
      "run",
      "--quiet",
      "--manifest-path",
      path.join(SERVER_DIR, "Cargo.toml"),
      "--",
      "client",
      ...args,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        BRIGID_MASTER_KEY: E2E_MASTER_KEY,
        BRIGID_DATABASE__PATH: E2E_DATABASE,
      },
      stdio: ["ignore", "pipe", "ignore"],
    },
  );
}

/** Sends the browser to the server as the application does. */
export async function ask(page: Page, clientId: string, scope: string) {
  const query = new URLSearchParams({
    response_type: "code",
    scope,
    client_id: clientId,
    redirect_uri: RETURN_TO,
    state: "s",
    nonce: "n",
    code_challenge: CHALLENGE,
    code_challenge_method: "S256",
  });
  await page.goto(`/authorize?${query}`);
  await expect(page).toHaveURL(/\/continue\/\?request=/);
}

/** Registers a public application named `name` and returns its client id.
 * `options` say what it may ask for (`--required email`, …). */
export function registerApplication(
  name: string,
  ...options: string[]
): string {
  const printed = seedlingClient(
    "add",
    "--public",
    "--name",
    name,
    "--redirect-uri",
    RETURN_TO,
    ...options,
  );
  const clientId = /^client_id=(.+)$/m.exec(printed)?.[1] ?? "";
  expect(clientId, printed).not.toBe("");
  return clientId;
}

/** Answers at the application's return address: nothing listens there. */
export async function answerReturnAddress(page: Page) {
  await page.route(`${new URL(RETURN_TO).origin}/**`, (route) =>
    route.fulfill({ contentType: "text/html", body: "<title>back</title>" }),
  );
}
