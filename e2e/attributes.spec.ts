import { expect, test } from "@playwright/test";
import {
  clickUntil,
  finishOnboarding,
  signUp,
  waitForIdentities,
} from "./account";
import {
  answerReturnAddress,
  ask,
  chooseIdentity,
  continueAndReadToken,
  registerApplication,
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

test("an application receives what the person shares, nothing else, and it can be withdrawn", async ({
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
  // No identity is chosen for the person, and nothing of any is shown.
  await expect(page.getByRole("radio")).toHaveCount(3);
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Continue with / })).toHaveCount(0);
  await chooseIdentity(page, "Work");
  await expect(page.locator(".asked")).toHaveCount(0);
  let claims = await continueAndReadToken(page, request, clientId);
  expect(claims.sub).toBeTruthy();
  expect(claims).not.toHaveProperty("email");
  const sub = claims.sub;

  // -- it asks for attributes the identity does not have ----------------------
  await ask(page, clientId, "openid profile email");
  // Not even the identity chosen last time is selected.
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await chooseIdentity(page, "Work");
  const next = page.getByRole("button", { name: "Continue with Work" });
  const needed = page.getByRole("region", { name: "This application needs it" });
  const optional = page.getByRole("region", { name: "You choose" });
  await expect(needed.locator(".asked-row")).toHaveCount(1);
  await expect(optional.locator(".asked-row")).toHaveCount(1);
  await expect(page.getByText("This identity has none.")).toHaveCount(2);
  // The address is required and absent: no way forward yet, and the page
  // says why just above the button.
  await expect(next).toBeDisabled();
  await expect(page.getByText(/Something is missing/)).toBeVisible();

  // Put on the identity from here. (The server limits how fast an account's
  // pages may write; refused, the page says so and keeps the field, and a
  // person would press again.)
  const addToIdentity = (label: string, value: string) =>
    expect(async () => {
      const row = page.locator(".asked-row", { hasText: label });
      const field = page.getByLabel(`${label} of this identity`);
      if ((await field.count()) > 0) {
        await field.fill(value);
        await row
          .getByRole("button", { name: "Add to this identity" })
          .click({ timeout: 2000 });
      }
      await expect(row.getByText(value)).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 40_000 });
  // What the application needs is shown and sent: no switch, and the way
  // forward opens.
  await addToIdentity("E-mail address", "ada@work.example");
  await expect(needed.getByText("ada@work.example")).toBeVisible();
  await expect(needed.getByRole("switch")).toHaveCount(0);
  await expect(page.getByText(/Something is missing/)).toHaveCount(0);
  await expect(next).toBeEnabled();
  // What it would like is shared unless the person turns it off.
  await addToIdentity("First name", "Ada");
  const firstName = optional.getByRole("switch", { name: "Share: First name" });
  await expect(firstName).toBeChecked();
  await page.getByText("What Field Notes will know about you").click();
  await expect(page.getByText(/these 2 pieces of information only/)).toBeVisible();
  await firstName.click();
  await expect(firstName).not.toBeChecked();
  await expect(optional.getByText("Kept to yourself")).toBeVisible();
  await expect(optional.getByText("Ada", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/this one piece of information only/)).toBeVisible();
  claims = await continueAndReadToken(page, request, clientId);
  expect(claims.sub).toBe(sub);
  expect(claims.email).toBe("ada@work.example");
  expect(claims.email_verified).toBe(false);
  // On the identity, asked for, and turned off: not sent.
  expect(claims).not.toHaveProperty("given_name");
  // No label of the identity either.
  expect(JSON.stringify(claims)).not.toContain("Work");

  // -- it asks again: what was refused stays off -------------------------------
  await ask(page, clientId, "openid profile email");
  await chooseIdentity(page, "Work");
  await expect(needed.getByText("ada@work.example")).toBeVisible();
  await expect(firstName).not.toBeChecked();
  // Another identity has neither value: back to the choice, and again.
  await page.getByRole("button", { name: "Change" }).click();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await chooseIdentity(page, "Personal");
  await expect(page.getByText("This identity has none.")).toHaveCount(2);
  await page.getByRole("button", { name: "Change" }).click();
  await chooseIdentity(page, "Work");
  await expect(firstName).not.toBeChecked();
  await firstName.click();
  await expect(firstName).toBeChecked();
  claims = await continueAndReadToken(page, request, clientId);
  expect(claims.email).toBe("ada@work.example");
  expect(claims.given_name).toBe("Ada");

  // -- the identity's page: what it shares, and with whom ----------------------
  await page.goto("/identities/");
  await waitForIdentities(page, 3);
  await page.getByRole("link", { name: "Open (Work)" }).click();
  await expect(page.getByRole("heading", { name: "Work", level: 1 })).toBeVisible();
  await page.getByRole("tab", { name: "Usage" }).click();
  await expect(page.getByRole("heading", { name: "Used by" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connected to" })).toBeVisible();
  const application = page.locator('[data-application="Field Notes"]');
  await expect(application.locator(".shared-row")).toHaveCount(2);
  await expect(application.getByText("ada@work.example")).toBeVisible();

  // A changed value is said to be no longer sent. (A button shown a moment
  // ago may not answer its first click: each one is pressed until it did.)
  await page.getByRole("tab", { name: "My information" }).click();
  await page.getByRole("button", { name: "Edit My information" }).click();
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
  await page.getByRole("tab", { name: "Usage" }).click();
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

  // The application asks again: the new address is the one shown, and the
  // first name, withdrawn, is shared again unless turned off.
  await ask(page, clientId, "openid profile email");
  await chooseIdentity(page, "Work");
  await expect(needed.getByText("ada@new.example")).toBeVisible();
  await expect(firstName).toBeChecked();
  await expect(next).toBeEnabled();

  // Everything withdrawn, after a confirmation that says what it cannot do.
  await page.goto("/identities/");
  await waitForIdentities(page, 3);
  await page.getByRole("link", { name: "Open (Work)" }).click();
  await page.getByRole("tab", { name: "Usage" }).click();
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
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
});
