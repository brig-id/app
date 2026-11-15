import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_ORIGIN } from "../playwright.config";
import { answerReturnAddress, ask, registerApplication } from "./application";
import { addVirtualAuthenticator, skipIfNoVirtualAuthenticator } from "./webauthn";

// WCAG 2.2 AA, held by tests: axe on every page, in both languages and both
// themes (the theme follows the system's preference, which is set here). A
// violation fails the suite. What axe cannot judge (the order of focus, what
// a screen reader says) is the manual pass of each release.
const RULES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

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
      for (const path of ["/", "/signup/", "/recover/", "/about/"]) {
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
      await expectNoViolation(page, "/welcome/");

      await page.locator(".check input").check();
      await page.locator(".page > .cluster .button--primary").click();
      await expect(page.locator(".identity-list > li")).toHaveCount(3, { timeout: 10_000 });
      await expectNoViolation(page, "/identities/");

      // The form, with a template applied, then a deletion being confirmed.
      await page.locator(".split .button--primary").click();
      await page.locator(".template").nth(4).click();
      await expectNoViolation(page, "/identities/ creating an identity");
      await page.locator("form .button:not(.button--primary)").click();
      await page.locator(".identity-list .button--danger").first().click();
      await expect(page.locator(".confirm")).toBeVisible();
      await expectNoViolation(page, "/identities/ confirming a deletion");

      await page.goto(`${E2E_ORIGIN}/passkeys/`, { waitUntil: "networkidle" });
      await expect(page.locator(".passkey-item")).toHaveCount(1, { timeout: 10_000 });
      await expectNoViolation(page, "/passkeys/");
      await page.locator(".passkey-item .button").first().click();
      await expectNoViolation(page, "/passkeys/ renaming a passkey");
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

      // The linking page: attributes the identity lacks, then one it has,
      // then ticked.
      await ask(page, clientId, "openid profile email");
      await page.locator(".choice input").last().check();
      await expect(page.locator(".asked-row--missing")).toHaveCount(2);
      await expectNoViolation(page, "/continue/ asked for what the identity lacks");
      await page.locator('input[data-add="email"]').fill("ada@work.example");
      await page.locator(".asked-add .button").last().click();
      const box = page.locator(".asked-choice input");
      await expect(box).toHaveCount(1);
      await expectNoViolation(page, "/continue/ with a value to accept");
      await box.check();
      await expectNoViolation(page, "/continue/ with a value accepted");
      await page.locator("form > .button--primary").click();
      await page.waitForURL(/application\.example/);

      // The identity's page: what it gave, the form, a withdrawal confirmed.
      await page.goto(`${E2E_ORIGIN}/identities/`, { waitUntil: "networkidle" });
      await page.locator(".identity-list > li a").last().click();
      await expect(page.locator(".shared-row")).toHaveCount(1, { timeout: 10_000 });
      await expectNoViolation(page, "/identities/details/");
      await page.locator("[data-application] .button--danger").click();
      await expect(page.locator(".confirm")).toBeVisible();
      await expectNoViolation(page, "/identities/details/ confirming a withdrawal");
      await page.locator("section.card .split .button").click();
      // The same address as another identity would be a warning: none here.
      await expect(page.locator("form .input")).toHaveCount(6);
      await expectNoViolation(page, "/identities/details/ editing what it can share");
    });
  });
}
