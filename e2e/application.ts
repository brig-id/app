import { type APIRequestContext, expect, type Page } from "@playwright/test";
import { E2E_ORIGIN } from "../playwright.config";
import { seedling } from "./server";

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
  return seedling("client", ...args);
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

// The application's own server calls the token endpoint: not the browser, so
// without the session cookie, and by an address Node resolves (it does not
// know `*.localhost`).
const TOKEN_ENDPOINT = `${E2E_ORIGIN.replace("brigid.localhost", "127.0.0.1")}/token`;

/** Continues to the application and returns what the token it gets says.
 * An application that has a `secret` proves who it is with it. */
export async function continueAndReadToken(
  page: Page,
  request: APIRequestContext,
  clientId: string,
  secret?: string,
): Promise<Record<string, unknown>> {
  // Refused for going too fast, the page says so and stays.
  await expect(async () => {
    await page
      .getByRole("button", { name: "Continue", exact: true })
      .click({ timeout: 2000 });
    await page.waitForURL(/application\.example\/back\?/, { timeout: 3000 });
  }).toPass({ timeout: 40_000 });
  const code = new URL(page.url()).searchParams.get("code");
  expect(code).toBeTruthy();
  const response = await request.post(TOKEN_ENDPOINT, {
    form: {
      grant_type: "authorization_code",
      client_id: clientId,
      code: code!,
      redirect_uri: RETURN_TO,
      code_verifier: VERIFIER,
      ...(secret === undefined ? {} : { client_secret: secret }),
    },
  });
  expect(response.status()).toBe(200);
  const { id_token } = (await response.json()) as { id_token: string };
  return JSON.parse(
    Buffer.from(id_token.split(".")[1]!, "base64url").toString("utf8"),
  ) as Record<string, unknown>;
}
