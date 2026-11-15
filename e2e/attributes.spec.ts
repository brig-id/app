import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { E2E_ORIGIN } from "../playwright.config";
import {
  clickUntil,
  finishOnboarding,
  signUp,
  waitForIdentities,
} from "./account";
import {
  answerReturnAddress,
  ask,
  registerApplication,
  RETURN_TO,
  VERIFIER,
} from "./application";
import { addVirtualAuthenticator, skipIfNoVirtualAuthenticator } from "./webauthn";

// An application asks for attributes of the identity it meets. The test is
// the application: it sends the browser to the server, receives the code at
// its return address (answered here, nothing listens there), exchanges it
// and reads the token. What it finds in the token is all an application
// ever gets.

test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
});

// The application's own server calls the token endpoint: not the browser, so
// without the session cookie, and by an address Node resolves (it does not
// know `*.localhost`).
const TOKEN_ENDPOINT = `${E2E_ORIGIN.replace("brigid.localhost", "127.0.0.1")}/token`;

/** Continues to the application and returns what the token it gets says. */
async function continueAndReadToken(
  page: Page,
  request: APIRequestContext,
  clientId: string,
): Promise<Record<string, unknown>> {
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL(/application\.example\/back\?/);
  const code = new URL(page.url()).searchParams.get("code");
  expect(code).toBeTruthy();
  const response = await request.post(TOKEN_ENDPOINT, {
    form: {
      grant_type: "authorization_code",
      client_id: clientId,
      code: code!,
      redirect_uri: RETURN_TO,
      code_verifier: VERIFIER,
    },
  });
  expect(response.status()).toBe(200);
  const { id_token } = (await response.json()) as { id_token: string };
  return JSON.parse(
    Buffer.from(id_token.split(".")[1]!, "base64url").toString("utf8"),
  ) as Record<string, unknown>;
}

test("an application receives what was ticked, nothing else, and it can be withdrawn", async ({
  page,
  context,
  request,
  browserName,
}) => {
  skipIfNoVirtualAuthenticator(browserName);
  await addVirtualAuthenticator(context, page);
  await answerReturnAddress(page);

  // The operator registers the application: it needs an address, and may
  // ask for a first name.
  const clientId = registerApplication(
    "Field Notes",
    "--required",
    "email",
    "--optional",
    "given_name",
  );

  await signUp(page);
  await finishOnboarding(page);
  await waitForIdentities(page, 3);

  // -- it asks for the identifier only: nothing else to decide ----------------
  await ask(page, clientId, "openid");
  await page.getByRole("radio", { name: "Work" }).check();
  await expect(page.locator(".asked")).toHaveCount(0);
  let claims = await continueAndReadToken(page, request, clientId);
  expect(claims.sub).toBeTruthy();
  expect(claims).not.toHaveProperty("email");
  const sub = claims.sub;

  // -- it asks for attributes the identity does not have ----------------------
  await ask(page, clientId, "openid profile email");
  const next = page.getByRole("button", { name: "Continue", exact: true });
  const asked = page.getByRole("group", { name: "Field Notes asks for" });
  await expect(page.getByRole("radio", { name: "Work" })).toBeChecked();
  await expect(asked.locator(".asked-row")).toHaveCount(2);
  await expect(asked.getByText("This identity has none.")).toHaveCount(2);
  await expect(asked.getByText("Required", { exact: true })).toHaveCount(1);
  await expect(asked.getByText("Optional", { exact: true })).toHaveCount(1);
  // The address is required and absent: no way forward yet.
  await expect(next).toBeDisabled();
  await expect(page.getByText(/does not work without/)).toBeVisible();

  // Put on the identity from here, a value is shown, and not ticked.
  const add = asked.getByRole("button", { name: "Add to this identity" });
  await asked.getByLabel("E-mail address of this identity").fill("ada@work.example");
  await add.last().click();
  const email = asked.getByRole("checkbox", { name: /E-mail address/ });
  await expect(email).not.toBeChecked();
  await expect(asked.getByText("ada@work.example")).toBeVisible();
  await asked.getByLabel("First name of this identity").fill("Ada");
  await add.click();
  const firstName = asked.getByRole("checkbox", { name: /First name/ });
  await expect(firstName).not.toBeChecked();
  await expect(next).toBeDisabled();

  // The first name alone is not enough; the address alone is.
  await firstName.check();
  await expect(next).toBeDisabled();
  await firstName.uncheck();
  await email.check();
  await expect(next).toBeEnabled();
  claims = await continueAndReadToken(page, request, clientId);
  expect(claims.sub).toBe(sub);
  expect(claims.email).toBe("ada@work.example");
  expect(claims.email_verified).toBe(false);
  // On the identity, asked for, and not ticked: not sent.
  expect(claims).not.toHaveProperty("given_name");
  // No label of the identity either.
  expect(JSON.stringify(claims)).not.toContain("Work");

  // -- it asks again: what was decided is remembered ---------------------------
  await ask(page, clientId, "openid profile email");
  await expect(email).toBeChecked();
  await expect(firstName).not.toBeChecked();
  await expect(asked.getByText("You accepted this before.")).toBeVisible();
  await expect(asked.getByText("You refused this before.")).toBeVisible();
  // Another identity starts from nothing.
  await page.getByRole("radio", { name: "Personal" }).check();
  await expect(asked.getByText("This identity has none.")).toHaveCount(2);
  await page.getByRole("radio", { name: "Work" }).check();
  await expect(email).toBeChecked();
  await firstName.check();
  claims = await continueAndReadToken(page, request, clientId);
  expect(claims.email).toBe("ada@work.example");
  expect(claims.given_name).toBe("Ada");

  // -- the identity's page: what it shares, and with whom ----------------------
  await page.goto("/identities/");
  await waitForIdentities(page, 3);
  await page
    .getByRole("link", { name: "What it shares, and with whom (Work)" })
    .click();
  await expect(page.getByRole("heading", { name: "Work", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Used by" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connected to" })).toBeVisible();
  const application = page.locator('[data-application="Field Notes"]');
  await expect(application.locator(".shared-row")).toHaveCount(2);
  await expect(application.getByText("ada@work.example")).toBeVisible();

  // A changed value is said to be no longer sent. (A button shown a moment
  // ago may not answer its first click: each one is pressed until it did.)
  await page.getByRole("button", { name: "Edit What it can share" }).click();
  await page.getByLabel("E-mail address").fill("ada@new.example");
  await clickUntil(
    page,
    page.getByRole("button", { name: "Save", exact: true }),
    () =>
      expect(page.getByRole("status")).toContainText(
        "only after asking you again",
        { timeout: 3000 },
      ),
  );
  await expect(
    application.getByText(/You changed this value since/),
  ).toBeVisible();

  // One attribute withdrawn: the page says what that cannot undo.
  await clickUntil(
    page,
    application.getByRole("button", {
      name: "Stop sharing First name (Field Notes)",
    }),
    () =>
      expect(page.getByRole("status")).toContainText(
        "Field Notes keeps what it already received",
        { timeout: 3000 },
      ),
  );
  await expect(application.locator(".shared-row")).toHaveCount(1);

  // The application asks again: the new address and the first name both
  // wait for an answer.
  await ask(page, clientId, "openid profile email");
  await expect(asked.getByText("ada@new.example")).toBeVisible();
  await expect(email).not.toBeChecked();
  await expect(firstName).not.toBeChecked();
  await expect(next).toBeDisabled();

  // Everything withdrawn, after a confirmation that says what it cannot do.
  await page.goto("/identities/");
  await waitForIdentities(page, 3);
  await page
    .getByRole("link", { name: "What it shares, and with whom (Work)" })
    .click();
  await clickUntil(
    page,
    application.getByRole("button", {
      name: "Withdraw everything Field Notes",
    }),
    () =>
      expect(
        application.getByText(
          /cannot take back what Field Notes already received/,
        ),
      ).toBeVisible({ timeout: 3000 }),
  );
  await clickUntil(
    page,
    application.getByRole("button", { name: "Yes, withdraw" }),
    () =>
      expect(page.getByText(/No application yet/)).toBeVisible({
        timeout: 3000,
      }),
  );
  await ask(page, clientId, "openid profile email");
  await expect(page.getByRole("radio", { name: "Work" })).not.toBeChecked();
});
