import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_ORIGIN } from "../playwright.config";
import { addVirtualAuthenticator, skipIfNoVirtualAuthenticator } from "./webauthn";

// WCAG 2.2 AA, held by tests: axe on every page, in both languages. A
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

for (const locale of ["en-GB", "fr-FR"]) {
  const language = locale.slice(0, 2);

  test.describe(`accessibility, in ${language}`, () => {
    test.use({ locale });

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
  });
}
