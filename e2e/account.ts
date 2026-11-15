import { expect, type Locator, type Page } from "@playwright/test";

// What several suites do with an account: create it, get through the
// onboarding, wait for a list. Each helper does what a person would do when
// the server's rate limit answers "later": wait, and try again.

// Right after a navigation inside the app the handler of a freshly shown
// button can be wired a beat after the button is clickable, and a 429 can
// bounce a ceremony: click until `check` passes, waiting one refill between
// attempts.
export async function clickUntil(
  page: Page,
  button: Locator,
  check: () => Promise<void>,
  attempts = 5,
) {
  for (let i = 0; i < attempts; i++) {
    await button.click({ timeout: 2000 }).catch(() => {});
    try {
      await check();
      return;
    } catch {
      await page.waitForTimeout(3500);
    }
  }
  await check();
}

/** Fills `field` and clicks `button` until `check` passes: a field filled
 * before the page wires it keeps an empty value, so each attempt fills again. */
export async function fillAndClickUntil(
  page: Page,
  field: Locator,
  value: string,
  button: Locator,
  check: () => Promise<void>,
  attempts = 5,
) {
  for (let i = 0; i < attempts; i++) {
    await field.fill("");
    await field.fill(value);
    await button.click({ timeout: 2000 }).catch(() => {});
    try {
      await check();
      return;
    } catch {
      await page.waitForTimeout(3500);
    }
  }
  await check();
}

/** Sign-up: one button, no username; lands on the onboarding page. */
export async function signUp(page: Page) {
  await page.goto("/signup/");
  await clickUntil(
    page,
    page.getByRole("button", { name: "Create my account" }),
    () => expect(page).toHaveURL(/\/welcome\/?/, { timeout: 5000 }),
  );
}

/** Onboarding: reads the recovery code shown, confirms it, continues. */
export async function finishOnboarding(page: Page): Promise<string> {
  const code = page
    .getByRole("group", { name: "Your recovery code" })
    .locator("code");
  // The page reads the state of the code, then creates one by itself. In a
  // long run either request can fall on the rate limit of the account
  // routes: the page then says so. A person would press the button it
  // offers, or load the page again; so does this.
  const create = page.getByRole("button", { name: "Create a recovery code" });
  const shown = /^([A-Z2-7]{4}-){9}[A-Z2-7]{4}$/;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await expect(code).toHaveText(shown, { timeout: 5000 });
      break;
    } catch {
      if (await create.isVisible()) {
        await create.click();
      } else {
        await page.waitForTimeout(3000);
        await page.reload();
      }
    }
  }
  await expect(code).toHaveText(shown);
  const value = (await code.textContent()) ?? "";
  const next = page.getByRole("button", { name: "Continue to my identities" });
  await expect(next).toBeDisabled();
  await page.getByLabel("I kept my recovery code").check();
  await next.click();
  await expect(page).toHaveURL(/\/identities\/?$/);
  return value;
}

/** The identities page with its list loaded. The account routes are
 * rate-limited too (60 a minute), and a whole run can reach that limit: the
 * page then says so, and loading it again a little later succeeds. */
export async function waitForIdentities(page: Page, count: number) {
  const cards = page.locator(".identity-list > li");
  for (let i = 0; i < 5; i++) {
    try {
      await expect(cards).toHaveCount(count, { timeout: 4000 });
      return;
    } catch {
      await page.waitForTimeout(3500);
      await page.reload();
    }
  }
  await expect(cards).toHaveCount(count);
}
