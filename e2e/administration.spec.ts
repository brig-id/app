import { expect, type Page, test } from "@playwright/test";
import {
  clickUntil,
  finishOnboarding,
  signUp,
  waitForIdentities,
} from "./account";
import {
  answerReturnAddress,
  ask,
  continueAndReadToken,
  RETURN_TO,
} from "./application";
import { administratorLink, seedling, startNewServer } from "./server";
import { addVirtualAuthenticator, skipIfNoVirtualAuthenticator } from "./webauthn";

// Administering a server: who gets the role and how, and what it lets them
// do. An administrator sees accounts, never identities; every change they
// make needs their passkey, used a moment ago.

test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
});

// Another suite must find the server as it expects it: open.
test.afterAll(() => {
  seedling("signup", "open");
});

/** A change refused for going too fast is said and not made: pressed again,
 * as a person would, until `check` holds. */
async function until(check: () => Promise<void>, press: () => Promise<void>) {
  await expect(async () => {
    await press();
    await check();
  }).toPass({ timeout: 40_000, intervals: [3500] });
}

/** The usernames in the accounts list of the administration, loaded. */
async function listedAccounts(page: Page): Promise<string[]> {
  const rows = page.locator("[data-account]");
  await expect(rows.first()).toBeVisible({ timeout: 20_000 });
  return rows.evaluateAll((all) =>
    all.map((row) => row.getAttribute("data-account") ?? ""),
  );
}

test("a new server makes its first administrator from the link it prints, and asks for the passkey again before a change", async ({
  browser,
  browserName,
}) => {
  skipIfNoVirtualAuthenticator(browserName);
  // A ceremony covers changes for five seconds here, five minutes by default.
  const server = await startNewServer(8081, {
    BRIGID_SECURITY__ADMIN_CONFIRMATION_SECONDS: "5",
  });
  try {
    const context = await browser.newContext({
      baseURL: server.origin,
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await addVirtualAuthenticator(context, page);

    // Nobody decided who may sign up yet: by invitation.
    await page.goto("/signup/");
    await expect(page.getByText(/takes new accounts by invitation/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create my account" }),
    ).toHaveCount(0);

    // The link the server printed.
    await page.goto(server.setupLink);
    await expect(
      page.getByRole("heading", { name: "Set up this server" }),
    ).toBeVisible();
    await clickUntil(
      page,
      page.getByRole("button", { name: "Create the administrator’s account" }),
      () => expect(page).toHaveURL(/\/welcome\/?/, { timeout: 5000 }),
    );
    await finishOnboarding(page);
    await waitForIdentities(page, 3);

    // The account administers: one account, its own, and no way to lose the
    // only administrator.
    await page.getByRole("link", { name: "Administration" }).click();
    await expect(page).toHaveURL(/\/admin\/$/);
    const own = page.locator("[data-account]");
    // (A list refused for going too fast is asked again by the page.)
    await expect(own).toHaveCount(1, { timeout: 20_000 });
    await expect(own.getByText("You", { exact: true })).toBeVisible();
    await expect(own.getByText("Administrator", { exact: true })).toBeVisible();
    await expect(own.getByRole("button", { name: /Suspend|Delete/ })).toHaveCount(
      0,
    );
    await own.getByRole("button", { name: /Withdraw the role/ }).click();
    await expect(page.getByText("The change was not made.")).toBeVisible();
    await expect(own.getByText("Administrator", { exact: true })).toBeVisible();

    // The link worked once.
    const other = await browser.newContext({
      baseURL: server.origin,
      ignoreHTTPSErrors: true,
    });
    const visitor = await other.newPage();
    await addVirtualAuthenticator(other, visitor);
    await visitor.goto(server.setupLink);
    await clickUntil(
      visitor,
      visitor.getByRole("button", { name: "Create the administrator’s account" }),
      () =>
        expect(
          visitor.getByText(/This setup link is not valid any more/),
        ).toBeVisible({ timeout: 5000 }),
    );
    await other.close();

    // Later than the few seconds a ceremony covers, a change asks for the
    // passkey again, then is made.
    await page.getByRole("link", { name: "Sign-up", exact: true }).click();
    const anyone = page.getByRole("radio", { name: /Anyone/ });
    await expect(page.getByRole("radio", { name: /Whoever you invite/ })).toBeChecked();
    await page.waitForTimeout(5500);
    const ceremonies: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/auth/confirm/")) ceremonies.push(request.url());
    });
    await until(
      () => expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 }),
      () => anyone.check({ timeout: 2000 }),
    );
    await expect(anyone).toBeChecked();
    expect(ceremonies.some((url) => url.endsWith("/auth/confirm/begin"))).toBe(true);
    expect(ceremonies.some((url) => url.endsWith("/auth/confirm/finish"))).toBe(true);

    // And the server is open.
    await context.close();
    const third = await browser.newContext({
      baseURL: server.origin,
      ignoreHTTPSErrors: true,
    });
    const newcomer = await third.newPage();
    await newcomer.goto("/signup/");
    await expect(
      newcomer.getByRole("button", { name: "Create my account" }),
    ).toBeVisible();
    await third.close();
  } finally {
    await server.stop();
  }
});

test("an administrator named from the machine registers an application, invites, suspends, and it is all in the log", async ({
  page,
  context,
  browser,
  request,
  browserName,
}) => {
  skipIfNoVirtualAuthenticator(browserName);
  test.setTimeout(240_000);
  // A step that cannot be done says so soon, not at the end of the test.
  page.setDefaultTimeout(15_000);
  await addVirtualAuthenticator(context, page);
  await answerReturnAddress(page);

  // -- an account like any other ----------------------------------------------
  await signUp(page);
  await finishOnboarding(page);
  await waitForIdentities(page, 3);
  await expect(page.getByRole("link", { name: "Administration" })).toHaveCount(0);
  await page.goto("/admin/");
  await expect(
    page.getByText("This part is for the administrators of this server."),
  ).toBeVisible();
  // Nothing was asked of the server on their behalf, and nothing is shown.
  await expect(page.locator("[data-account]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Accounts" })).toBeHidden();

  // -- the operator makes a link on the machine; the account opens it ----------
  const sent: string[] = [];
  page.on("request", (r) => sent.push(r.url()));
  const link = administratorLink();
  await page.goto(link);
  const linkSecret = new URL(link).hash.split("=")[1]!;
  await until(
    () =>
      expect(
        page.getByText("Your account now administers this server."),
      ).toBeVisible({ timeout: 5000 }),
    async () => {
      const button = page.getByRole("button", { name: "Become an administrator" });
      if (await button.isVisible()) await button.click({ timeout: 2000 });
    },
  );
  // The secret of the link went in no address: only in the request that
  // used it.
  expect(sent.filter((url) => url.includes(linkSecret))).toEqual([]);
  await page.getByRole("link", { name: "Open the administration" }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
  const before = await listedAccounts(page);
  const own = page.locator("[data-account]", {
    has: page.getByText("You", { exact: true }),
  });
  await expect(own).toHaveCount(1);
  const administrator = (await own.getAttribute("data-account")) ?? "";
  await expect(own.getByText("Administrator", { exact: true })).toBeVisible();
  // Accounts, and nothing of what they hold: no identity is named here.
  await expect(page.getByText(/Work|Personal|Public/)).toHaveCount(0);

  // -- an application registered from the interface signs a person in ----------
  await page.getByRole("link", { name: "Applications", exact: true }).click();
  const name = page.getByRole("textbox", { name: "Name", exact: true });
  await until(
    () => expect(name).toBeVisible({ timeout: 2000 }),
    async () => {
      if (!(await name.isVisible())) {
        await page
          .getByRole("button", { name: "Register an application" })
          .click({ timeout: 2000 });
      }
    },
  );
  await name.fill("Field Notes");
  await page.getByLabel("Return addresses").fill(RETURN_TO);
  await page
    .locator('[data-attribute="email"]')
    .getByRole("checkbox", { name: /May ask/ })
    .check();
  const registered = page.locator('[data-value="client-id"]');
  await until(
    () => expect(registered).toBeVisible({ timeout: 5000 }),
    async () => {
      const register = page.getByRole("button", { name: "Register", exact: true });
      if (await register.isVisible()) await register.click({ timeout: 2000 });
    },
  );
  const clientId = ((await registered.textContent()) ?? "").trim();
  expect(clientId).not.toBe("");
  // It has a server, said the form: its secret is shown, now and never again.
  const secret = (
    (await page.locator('[data-value="client-secret"]').textContent()) ?? ""
  ).trim();
  expect(secret).not.toBe("");
  const listed = page.locator('[data-application="Field Notes"]');
  await expect(listed).toBeVisible();
  await expect(listed.getByText("E-mail address")).toBeVisible();

  await ask(page, clientId, "openid");
  await page.getByRole("radio", { name: "Work" }).check();
  const claims = await continueAndReadToken(page, request, clientId, secret);
  expect(claims.sub).toBeTruthy();
  expect(claims.aud).toBe(clientId);
  await page.goto("/admin/applications/");
  await expect(listed).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(secret)).toHaveCount(0);

  // -- by invitation: a link that creates one account ---------------------------
  await page.goto("/admin/sign-up/");
  const byInvitation = page.getByRole("radio", { name: /Whoever you invite/ });
  await until(
    () => expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 }),
    () => byInvitation.check({ timeout: 2000 }),
  );
  // Other suites may have left invitations of their own: this one is counted.
  const invitations = page.locator(
    'section[aria-labelledby="invitations-title"] .shared-row',
  );
  const waiting = await invitations.count();
  await page.getByLabel("Accounts it can create").fill("1");
  const shown = page.locator('[data-value="invitation"]');
  await until(
    () => expect(shown).toBeVisible({ timeout: 5000 }),
    async () => {
      if (!(await shown.isVisible())) {
        await page
          .getByRole("button", { name: "Create an invitation" })
          .click({ timeout: 2000 });
      }
    },
  );
  const invitation = ((await shown.textContent()) ?? "").trim();
  // The secret is in the fragment: no request carries it but the one that
  // uses it.
  expect(invitation).toMatch(/\/signup\/#invitation=\S+$/);
  await expect(invitations).toHaveCount(waiting + 1);
  await expect(invitations.last()).toContainText(/Accounts left: 1, until/);

  const elsewhere = await browser.newContext();
  const invited = await elsewhere.newPage();
  await addVirtualAuthenticator(elsewhere, invited);
  // Without the link, no account.
  await invited.goto("/");
  await expect(invited.getByRole("link", { name: "Create an account" })).toHaveCount(0);
  await invited.goto("/signup/");
  await expect(
    invited.getByText(/takes new accounts by invitation/),
  ).toBeVisible();
  await expect(
    invited.getByRole("button", { name: "Create my account" }),
  ).toHaveCount(0);
  // With it, one.
  await invited.goto(invitation);
  await expect(invited.getByText("You were invited to this server.")).toBeVisible();
  await clickUntil(
    invited,
    invited.getByRole("button", { name: "Create my account" }),
    () => expect(invited).toHaveURL(/\/welcome\/?/, { timeout: 5000 }),
  );
  await finishOnboarding(invited);
  await waitForIdentities(invited, 3);

  // The invitation is spent: it is gone from the list, and opens nothing.
  await page.reload();
  await expect(byInvitation).toBeChecked({ timeout: 20_000 });
  await expect(invitations).toHaveCount(waiting);
  const late = await browser.newContext();
  const latecomer = await late.newPage();
  await addVirtualAuthenticator(late, latecomer);
  await latecomer.goto(invitation);
  await clickUntil(
    latecomer,
    latecomer.getByRole("button", { name: "Create my account" }),
    () =>
      expect(
        latecomer.getByText(/This link is not valid any more/),
      ).toBeVisible({ timeout: 5000 }),
  );
  await late.close();

  // -- suspending closes the account's sessions and its sign-in ----------------
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  // The account the invitation made is the one that was not there before.
  const guest = (await listedAccounts(page)).find(
    (name) => !before.includes(name),
  );
  expect(guest).toBeTruthy();
  const theirs = page.locator(`[data-account="${guest}"]`);
  await expect(theirs).toBeVisible();
  await theirs.getByRole("button", { name: /^Suspend/ }).click();
  await until(
    () =>
      expect(theirs.getByText("Suspended", { exact: true })).toBeVisible({
        timeout: 5000,
      }),
    async () => {
      const yes = theirs.getByRole("button", { name: "Yes, suspend" });
      if (await yes.isVisible()) await yes.click({ timeout: 2000 });
    },
  );
  await invited.goto("/identities/");
  await expect(invited).toHaveURL(/brigid\.localhost:\d+\/$/);
  await clickUntil(
    invited,
    invited.getByRole("button", { name: "Use my passkey" }),
    () =>
      expect(
        invited.getByText(
          "This account is suspended by an administrator of this server.",
        ),
      ).toBeVisible({ timeout: 5000 }),
  );

  // Lifted, the account is as it was: nothing was deleted.
  await until(
    () =>
      expect(theirs.getByText("Suspended", { exact: true })).toHaveCount(0, {
        timeout: 5000,
      }),
    async () => {
      const lift = theirs.getByRole("button", { name: /Lift the suspension/ });
      if (await lift.isVisible()) await lift.click({ timeout: 2000 });
    },
  );
  await invited.goto("/");
  await clickUntil(
    invited,
    invited.getByRole("button", { name: "Use my passkey" }),
    () => expect(invited).toHaveURL(/\/identities\/?$/, { timeout: 5000 }),
  );
  await waitForIdentities(invited, 3);

  // -- deleting an account ------------------------------------------------------
  await theirs.getByRole("button", { name: /^Delete/ }).click();
  await until(
    () => expect(theirs).toHaveCount(0, { timeout: 5000 }),
    async () => {
      const yes = theirs.getByRole("button", { name: "Yes, delete" });
      if (await yes.isVisible()) await yes.click({ timeout: 2000 });
    },
  );
  await elsewhere.close();

  // -- the application, removed -------------------------------------------------
  await page.getByRole("link", { name: "Applications", exact: true }).click();
  await listed.getByRole("button", { name: /^Remove/ }).click();
  await until(
    () => expect(listed).toHaveCount(0, { timeout: 5000 }),
    async () => {
      const yes = listed.getByRole("button", { name: "Yes, remove" });
      if (await yes.isVisible()) await yes.click({ timeout: 2000 });
    },
  );

  // -- the log: what was done, by whom, and no name for an account gone ---------
  await page.getByRole("link", { name: "Log", exact: true }).click();
  const entry = (action: string) => page.locator(`[data-action="${action}"]`);
  for (const action of [
    "administrator.link",
    "administrator.claimed",
    "application.register",
    "signup.policy",
    "invitation.create",
    "account.suspend",
    "account.unsuspend",
    "account.delete",
    "application.remove",
  ]) {
    await expect(entry(action).first(), action).toBeVisible();
  }
  await expect(entry("administrator.link").first()).toContainText("on the machine");
  await expect(entry("application.register").first()).toContainText(
    `by ${administrator}`,
  );
  await expect(entry("application.register").first()).toContainText("Field Notes");
  // The account deleted is named nowhere, not even where it was suspended.
  await expect(page.getByText(guest!)).toHaveCount(0);
  await expect(entry("account.suspend").first()).toContainText(
    "An account deleted since",
  );
});
