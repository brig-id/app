import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_ORIGIN } from "../playwright.config";
import { answerReturnAddress, ask, registerApplication } from "./application";
import { administratorLink } from "./server";
import { addVirtualAuthenticator, skipIfNoVirtualAuthenticator } from "./webauthn";

// WCAG 2.2 AA, held by tests: axe on every page, in both languages and both
// themes (the theme follows the system's preference, which is set here). A
// violation fails the suite. What axe cannot judge (the order of focus, what
// a screen reader says) is the manual pass of each release.
const RULES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** Leaves the onboarding: the identities proposed are created on the way.
 * Refused for going too fast, the page says so and stays; pressed again. */
async function continueToIdentities(page: Page) {
  await expect(async () => {
    if (!/\/identities\/$/.test(page.url())) {
      await page.locator(".page > .cluster .button--primary").click({ timeout: 2000 });
    }
    await expect(page.locator(".identity-list > li")).toHaveCount(3, { timeout: 5000 });
  }).toPass({ timeout: 60_000 });
}

async function expectNoViolation(page: Page, what: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(RULES).analyze();
  const found = violations.map(
    (v) => `${what}: ${v.id} (${v.impact}) ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`,
  );
  expect(found).toEqual([]);
}

const CASES = [
  { locale: "en-GB", colorScheme: "dark" },
  { locale: "fr-FR", colorScheme: "dark" },
  { locale: "en-GB", colorScheme: "light" },
  { locale: "fr-FR", colorScheme: "light" },
] as const;

for (const { locale, colorScheme } of CASES) {
  const language = locale.slice(0, 2);

  test.describe(`accessibility, in ${language}, ${colorScheme} theme`, () => {
    test.use({ locale, colorScheme });

    test.beforeEach(async () => {
      await new Promise((resolve) => setTimeout(resolve, 4000));
    });

    test("the sign-in pages", async ({ page }) => {
      // A page opened from a link is seen without it, then with one. Never
      // one right after the other: given a link, an open page starts again.
      for (const path of [
        "/",
        "/setup/",
        "/signup/",
        "/setup/#link=not-a-link",
        "/recover/",
        "/signup/#invitation=not-an-invitation",
        "/about/",
      ]) {
        await page.goto(path, { waitUntil: "networkidle" });
        await expect(page.locator("html")).toHaveAttribute("lang", language);
        await expectNoViolation(page, path);
      }

      // The states a page can be in, not only the one it opens with.
      await page.goto("/", { waitUntil: "networkidle" });
      await page.locator(".server-hint button").click();
      await page.locator("#server").fill("not a domain");
      await page.locator("form button[type=submit]").click();
      await expect(page.getByRole("alert")).toBeVisible();
      await expectNoViolation(page, "/ choosing another server, with an error");

      await page.goto("/continue/", { waitUntil: "networkidle" });
      await expect(page.getByRole("alert")).toBeVisible();
      await expectNoViolation(page, "/continue/ with a request that is not valid");
    });

    test("a browser that cannot use passkeys", async ({ page }) => {
      await page.addInitScript(() => {
        // @ts-expect-error - deliberately removing a browser API for the test
        delete window.PublicKeyCredential;
      });
      await page.goto("/signup/", { waitUntil: "networkidle" });
      await expect(page.locator(".passkey-unsupported")).toBeVisible();
      await expectNoViolation(page, "/signup/ without passkeys");
    });

    test("the account pages", async ({ page, context, browserName }) => {
      skipIfNoVirtualAuthenticator(browserName);
      await addVirtualAuthenticator(context, page);
      await page.goto("/signup/");
      await expect(async () => {
        await page.locator(".button--primary").click({ timeout: 2000 });
        await expect(page).toHaveURL(/\/welcome\//, { timeout: 4000 });
      }).toPass({ timeout: 40_000 });

      await expect(page.locator(".recovery-value")).toBeVisible({ timeout: 15_000 });
      // With the code, the first identities are proposed.
      await expect(page.locator(".starter")).toHaveCount(3, { timeout: 15_000 });
      await expectNoViolation(page, "/welcome/");

      await page.locator(".check input").check();
      await continueToIdentities(page);
      await expectNoViolation(page, "/identities/");

      // A new identity: the archetypes, then the form by hand.
      await page.goto(`${E2E_ORIGIN}/identities/new/`, { waitUntil: "networkidle" });
      await expect(page.locator(".archetype").first()).toBeVisible({ timeout: 10_000 });
      await expectNoViolation(page, "/identities/new/");
      await page.locator(".mode-pills button").nth(1).click();
      await expect(page.locator("form")).toBeVisible();
      await expectNoViolation(page, "/identities/new/ by hand");

      // Side by side.
      await page.goto(`${E2E_ORIGIN}/identities/compare/`, { waitUntil: "networkidle" });
      await expect(page.locator(".compare")).toBeVisible({ timeout: 10_000 });
      await expectNoViolation(page, "/identities/compare/");

      // One identity's page, its label being edited, then its deletion
      // being confirmed.
      await page.goto(`${E2E_ORIGIN}/identities/`, { waitUntil: "networkidle" });
      await page.locator(".identity-card-link").first().click();
      await expect(page.locator(".identity-hero")).toBeVisible({ timeout: 10_000 });
      await expectNoViolation(page, "/identities/details/");
      await page.locator(".identity-hero .button--danger").click();
      await expect(page.locator(".confirm")).toBeVisible();
      await expectNoViolation(page, "/identities/details/ confirming a deletion");

      await page.goto(`${E2E_ORIGIN}/passkeys/`, { waitUntil: "networkidle" });
      await expect(page.locator(".passkey-item")).toHaveCount(1, { timeout: 10_000 });
      await expectNoViolation(page, "/passkeys/");
      // Adding one: where it will be kept, then a place that has one already.
      await page.locator(".split .button--primary").click();
      await expect(page.locator(".places")).toBeVisible();
      await expectNoViolation(page, "/passkeys/ choosing where a passkey is kept");
      await expect(async () => {
        await page.locator('[data-place="client-device"]').click({ timeout: 2000 });
        await expect(page.locator(".callout--info")).toBeVisible({ timeout: 3000 });
      }).toPass({ timeout: 40_000, intervals: [3500] });
      await expectNoViolation(page, "/passkeys/ a place that already has one");
      await page.locator(".passkey-item .button").first().click();
      await expectNoViolation(page, "/passkeys/ renaming a passkey");

      await page.goto(`${E2E_ORIGIN}/account/`, { waitUntil: "networkidle" });
      await expect(page.locator(".button--danger")).toBeDisabled();
      await expectNoViolation(page, "/account/");
      await page.locator(".check input").check();
      await expectNoViolation(page, "/account/ ready to delete");
    });

    test("what an identity shares, and with whom", async ({ page, context, browserName }) => {
      skipIfNoVirtualAuthenticator(browserName);
      await addVirtualAuthenticator(context, page);
      await answerReturnAddress(page);
      const clientId = registerApplication(
        `Field Notes ${language} ${colorScheme}`,
        "--required",
        "email",
        "--optional",
        "given_name",
      );
      await page.goto("/signup/");
      await expect(async () => {
        await page.locator(".button--primary").click({ timeout: 2000 });
        await expect(page).toHaveURL(/\/welcome\//, { timeout: 4000 });
      }).toPass({ timeout: 40_000 });
      await expect(page.locator(".recovery-value")).toBeVisible({ timeout: 15_000 });
      await page.locator(".check input").check();
      await continueToIdentities(page);

      // The linking page: attributes the identity lacks, then one it has,
      // then ticked.
      await ask(page, clientId, "openid profile email");
      await page.locator(".choice input").last().check();
      await expect(page.locator(".asked-row--missing")).toHaveCount(2);
      await expectNoViolation(page, "/continue/ asked for what the identity lacks");
      // Refused for going too fast, the page says so and keeps the field:
      // pressed again, as a person would.
      const box = page.locator(".asked-choice input");
      await expect(async () => {
        if ((await box.count()) === 0) {
          await page.locator('input[data-add="email"]').fill("ada@work.example");
          await page.locator(".asked-add .button").last().click({ timeout: 2000 });
        }
        await expect(box).toHaveCount(1, { timeout: 3000 });
      }).toPass({ timeout: 40_000, intervals: [3500] });
      await expectNoViolation(page, "/continue/ with a value to accept");
      await box.check();
      await expectNoViolation(page, "/continue/ with a value accepted");
      await page.locator("form > .button--primary").click();
      await page.waitForURL(/application\.example/);

      // The identity's page: what it gave, the form, a withdrawal confirmed.
      await page.goto(`${E2E_ORIGIN}/identities/`, { waitUntil: "networkidle" });
      await page.locator(".identity-card-link").last().click();
      await expect(page.locator(".identity-hero")).toBeVisible({ timeout: 10_000 });
      await page.locator("#tab-usage").click();
      await expect(page.locator(".shared-row")).toHaveCount(1, { timeout: 10_000 });
      await expectNoViolation(page, "/identities/details/?tab=usage");
      await page.locator("[data-application] .button--danger").click();
      await expect(page.locator(".confirm")).toBeVisible();
      await expectNoViolation(page, "/identities/details/ confirming a withdrawal");
      await page.locator("#tab-info").click();
      await page.locator("section.card .split .button").click();
      // The same address as another identity would be a warning: none here.
      await expect(page.locator("form .input")).toHaveCount(6);
      await expectNoViolation(page, "/identities/details/ editing my information");
    });

    test("the administration", async ({ page, context, browser, browserName }) => {
      skipIfNoVirtualAuthenticator(browserName);
      // Someone else's account, for the administrator to have one to act on.
      const elsewhere = await browser.newContext();
      const someone = await elsewhere.newPage();
      await addVirtualAuthenticator(elsewhere, someone);
      await someone.goto("/signup/");
      await expect(async () => {
        await someone.locator(".button--primary").click({ timeout: 2000 });
        await expect(someone).toHaveURL(/\/welcome\//, { timeout: 4000 });
      }).toPass({ timeout: 40_000 });
      await elsewhere.close();

      await addVirtualAuthenticator(context, page);
      await page.goto("/signup/");
      await expect(async () => {
        await page.locator(".button--primary").click({ timeout: 2000 });
        await expect(page).toHaveURL(/\/welcome\//, { timeout: 4000 });
      }).toPass({ timeout: 40_000 });
      await expect(page.locator(".recovery-value")).toBeVisible({ timeout: 15_000 });
      await page.locator(".check input").check();
      await continueToIdentities(page);

      // Not an administrator: the page says so, and its link says what it is for.
      await page.goto(`${E2E_ORIGIN}/admin/`, { waitUntil: "networkidle" });
      await expect(page.locator("main .callout")).toBeVisible();
      await expectNoViolation(page, "/admin/ for someone who does not administer");
      await page.goto(`${E2E_ORIGIN}/admin/claim/`, { waitUntil: "networkidle" });
      await expectNoViolation(page, "/admin/claim/ without a link");
      // A link given to a page already open: the page starts again with it.
      await page.goto(administratorLink());
      await expect(page.locator("main button.button--primary")).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expectNoViolation(page, "/admin/claim/");
      await expect(async () => {
        const claim = page.locator("main button.button--primary");
        if ((await page.locator("main a.button").count()) === 0) {
          await claim.click({ timeout: 2000 });
        }
        await expect(page.locator("main a.button")).toBeVisible({ timeout: 4000 });
      }).toPass({ timeout: 40_000 });
      await expectNoViolation(page, "/admin/claim/ done");

      // The accounts, and one about to be suspended.
      await page.locator("main a.button").click();
      const others = page.locator("[data-account]").filter({ has: page.locator(".button--danger") });
      await expect(others.first()).toBeVisible({ timeout: 20_000 });
      await expectNoViolation(page, "/admin/");
      await others.first().locator(".button:not(.button--danger)").last().click();
      await expect(page.locator(".confirm")).toBeVisible();
      await expectNoViolation(page, "/admin/ confirming a suspension");

      // Applications: the form, the secret shown once, then what it may ask.
      await page.goto(`${E2E_ORIGIN}/admin/applications/`, { waitUntil: "networkidle" });
      const form = page.locator("main form");
      await expect(async () => {
        if (!(await form.isVisible())) {
          await page.locator(".split .button--primary").click({ timeout: 2000 });
        }
        await expect(form).toBeVisible({ timeout: 2000 });
      }).toPass({ timeout: 20_000 });
      await expectNoViolation(page, "/admin/applications/ registering");
      const name = `Garden ${language} ${colorScheme}`;
      await expect(async () => {
        if (await form.isVisible()) {
          await form.locator("input.input").fill(name);
          await form.locator("textarea").fill("https://garden.example/back");
          await form.locator('[data-attribute="email"] input').first().check();
          await form.locator("button[type=submit]").click({ timeout: 2000 });
        }
        await expect(page.locator('[data-value="client-secret"]')).toBeVisible({ timeout: 4000 });
      }).toPass({ timeout: 40_000 });
      await expectNoViolation(page, "/admin/applications/ with a secret shown once");
      const listed = page.locator(`[data-application="${name}"]`);
      await listed.locator(".button:not(.button--danger)").click();
      await expect(listed.locator('[data-attribute="email"]')).toBeVisible();
      await expectNoViolation(page, "/admin/applications/ changing what it may ask");

      // Who may sign up, with an invitation just made.
      await page.goto(`${E2E_ORIGIN}/admin/sign-up/`, { waitUntil: "networkidle" });
      await expect(page.locator(".policy input:checked")).toHaveCount(1, { timeout: 20_000 });
      await expect(async () => {
        if (!(await page.locator('[data-value="invitation"]').isVisible())) {
          await page.locator("main form button[type=submit]").click({ timeout: 2000 });
        }
        await expect(page.locator('[data-value="invitation"]')).toBeVisible({ timeout: 4000 });
      }).toPass({ timeout: 40_000 });
      await expectNoViolation(page, "/admin/sign-up/ with an invitation");

      await page.goto(`${E2E_ORIGIN}/admin/log/`, { waitUntil: "networkidle" });
      await expect(page.locator(".log-entry").first()).toBeVisible({ timeout: 20_000 });
      await expectNoViolation(page, "/admin/log/");
    });
  });
}
