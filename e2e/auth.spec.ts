import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { E2E_ORIGIN } from "../playwright.config";
import { addVirtualAuthenticator, skipIfNoVirtualAuthenticator } from "./webauthn";

// `/auth/*` ceremonies are rate-limited server-side (1 token/3 s, burst 5, per
// IP: brigid-api's GovernorLayer), and every test hits the same `leaf` from
// the same loopback IP. A gap between tests lets the bucket refill.
test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
});

// Right after a client-side Qwik City navigation the click handler of a
// freshly shown button can be wired a beat after the button is clickable, and
// a 429 can bounce a ceremony: retry the click until `check` passes, backing
// off one refill tick between attempts.
async function clickUntil(
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

/** Signup: one button, no username; lands on the onboarding page. */
async function signUp(page: Page) {
  await page.goto("/register/");
  await clickUntil(page, page.getByRole("button", { name: "Create account" }), () =>
    expect(page).toHaveURL(/\/welcome\/?/, { timeout: 5000 }),
  );
}

/** Onboarding: reads the recovery code shown, confirms it, continues. */
async function finishOnboarding(page: Page): Promise<string> {
  const code = page.getByLabel("Your recovery code");
  await expect(code).toHaveText(/^([A-Z2-7]{4}-){9}[A-Z2-7]{4}$/, { timeout: 10000 });
  const value = (await code.textContent()) ?? "";
  const next = page.getByRole("button", { name: "Continue to my identities" });
  await expect(next).toBeDisabled();
  await page.getByLabel("I saved my recovery code").check();
  await next.click();
  await expect(page).toHaveURL(/\/identities\/?$/);
  return value;
}

async function signIn(page: Page) {
  await page.goto("/login/");
  await clickUntil(page, page.getByRole("button", { name: "Use my passkey" }), () =>
    expect(page).toHaveURL(/\/identities\/?$/, { timeout: 5000 }),
  );
}

async function signOut(page: Page) {
  await clickUntil(page, page.getByRole("button", { name: "Sign out" }), () =>
    expect(page).toHaveURL(/\/login\/?$/, { timeout: 2000 }),
  );
}

async function waitForPasskeyList(page: Page, count: number) {
  if (!/\/passkeys\/?$/.test(page.url())) await page.goto("/passkeys/");
  for (let i = 0; i < 5; i++) {
    try {
      await expect(page.locator(".passkey-item")).toHaveCount(count, { timeout: 3000 });
      return;
    } catch {
      await page.waitForTimeout(3500);
      await page.reload();
    }
  }
  await expect(page.locator(".passkey-item")).toHaveCount(count);
}

test.describe("signup and onboarding", () => {
  test("an account is a passkey: onboarding names it and gives a recovery code", async ({
    page,
    context,
    browserName,
  }) => {
    skipIfNoVirtualAuthenticator(browserName);
    await addVirtualAuthenticator(context, page);
    await expect(page.getByRole("textbox", { name: "Username" })).toHaveCount(0);
    await signUp(page);

    await expect(page.getByRole("heading", { name: "Welcome to brig·id" })).toBeVisible();
    // The passkey is loaded once its name can be saved.
    await expect(page.getByRole("button", { name: "Save the name" })).toBeEnabled();
    const name = page.getByLabel("Name");
    await name.fill("Laptop");
    await page.getByRole("button", { name: "Save the name" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    await finishOnboarding(page);
    await expect(page.locator(".identity-list > li")).toHaveCount(3, { timeout: 10000 });

    await waitForPasskeyList(page, 1);
    await expect(page.locator(".passkey-item")).toContainText("Laptop");
    expect(await page.evaluate(() => localStorage.getItem("brigid.token"))).toBeTruthy();
  });
});

test.describe("sign in", () => {
  test("signs in with the passkey alone, and signs out", async ({
    page,
    context,
    browserName,
  }) => {
    skipIfNoVirtualAuthenticator(browserName);
    await addVirtualAuthenticator(context, page);
    await signUp(page);
    await finishOnboarding(page);
    await signOut(page);
    expect(await page.evaluate(() => localStorage.getItem("brigid.token"))).toBeNull();

    await signIn(page);
    expect(await page.evaluate(() => localStorage.getItem("brigid.token"))).toBeTruthy();
  });

  test("another server leads to its own sign-in page", async ({ page }) => {
    await page.route("https://id.example.org/**", (route) =>
      route.fulfill({ status: 200, body: "other server" }),
    );
    await page.goto("/login/");
    await clickUntil(page, page.getByRole("button", { name: "Another server" }), () =>
      expect(page.getByLabel("Server")).toBeVisible({ timeout: 2000 }),
    );
    await page.getByLabel("Server").fill("not a domain");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("alert")).toContainText("server's domain");
    await page.getByLabel("Server").fill("https://id.example.org/somewhere");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("https://id.example.org/login/");
  });
});

test.describe("recovery", () => {
  test("the recovery code adds a passkey on a new device, once", async ({
    page,
    context,
    browser,
    browserName,
  }) => {
    skipIfNoVirtualAuthenticator(browserName);
    await addVirtualAuthenticator(context, page);
    await signUp(page);
    const code = await finishOnboarding(page);

    // Another device, with none of the account's passkeys.
    const device: BrowserContext = await browser.newContext({
      baseURL: E2E_ORIGIN,
      ignoreHTTPSErrors: true,
    });
    const other = await device.newPage();
    await addVirtualAuthenticator(device, other);
    await other.goto("/recover/");
    await other.getByLabel("Recovery code").fill(code.toLowerCase());
    await clickUntil(other, other.getByRole("button", { name: "Recover" }), () =>
      expect(other).toHaveURL(/\/welcome\/?$/, { timeout: 5000 }),
    );
    await expect(other.getByRole("heading", { name: "Your account is back" })).toBeVisible();
    const newCode = await finishOnboarding(other);
    expect(newCode).not.toBe(code);
    await waitForPasskeyList(other, 2);

    // The old code is used up.
    const third = await device.newPage();
    await third.goto("/recover/");
    await third.getByLabel("Recovery code").fill(code);
    await third.getByRole("button", { name: "Recover" }).click();
    await expect(third.getByRole("alert")).toBeVisible({ timeout: 10000 });
    await expect(third).toHaveURL(/\/recover\/?$/);
    await device.close();
  });

  test("a typo is reported before any account is touched", async ({ page }) => {
    await page.goto("/recover/");
    await page.getByLabel("Recovery code").fill("AAAA-BBBB");
    await clickUntil(page, page.getByRole("button", { name: "Recover" }), () =>
      expect(page.getByRole("alert")).toContainText("40 characters", { timeout: 3000 }),
    );
  });
});

test.describe("passkeys page", () => {
  test("adding and removing passkeys; the last one stays", async ({
    page,
    context,
    browserName,
  }) => {
    skipIfNoVirtualAuthenticator(browserName);
    await addVirtualAuthenticator(context, page);
    await signUp(page);
    await finishOnboarding(page);
    await waitForPasskeyList(page, 1);
    await expect(
      page.locator(".passkey-item").first().getByRole("button", { name: "Remove" }),
    ).toBeDisabled();

    // A second, distinct authenticator (Chrome allows one "internal" per
    // context): the backend excludes the account's existing credential.
    await addVirtualAuthenticator(context, page, "usb");
    await clickUntil(page, page.getByRole("button", { name: "Add a passkey" }), () =>
      expect(page.locator(".passkey-item")).toHaveCount(2, { timeout: 2000 }),
    );
    await clickUntil(
      page,
      page.locator(".passkey-item").first().getByRole("button", { name: "Remove" }),
      () => expect(page.locator(".passkey-item")).toHaveCount(1, { timeout: 2000 }),
    );

    // The recovery code can be renewed from here.
    await expect(page.getByText(/You have a recovery code, created on/)).toBeVisible();
  });
});

test.describe("identities page", () => {
  test("a new account starts with the default identities, and they can be managed", async ({
    page,
    context,
    browserName,
  }) => {
    skipIfNoVirtualAuthenticator(browserName);
    await addVirtualAuthenticator(context, page);
    await signUp(page);
    await finishOnboarding(page);

    const cards = page.locator(".identity-list > li");
    await expect(cards).toHaveCount(3, { timeout: 10000 });
    for (const name of ["Public", "Personal", "Work"]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }

    await page.getByRole("button", { name: "New identity" }).click();
    await page.getByLabel("Start from").selectOption("family");
    await page.getByLabel("Name").fill("Les Dupont");
    await page.getByRole("button", { name: "Create" }).click();
    await expect(cards).toHaveCount(4);
    await expect(page.getByText("Les Dupont", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Edit Les Dupont" }).click();
    await page.getByLabel("Name").fill("Famille");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Famille", { exact: true })).toBeVisible();

    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Delete Famille" }).click();
    await expect(cards).toHaveCount(3);
  });
});

// No navigator.credentials involved: these run on both projects and never
// touch the rate-limited ceremonies.
test.describe("browsers that can't use passkeys", () => {
  for (const path of ["/register/", "/login/", "/recover/"]) {
    test(`${path} explains a browser without WebAuthn`, async ({ page }) => {
      await page.addInitScript(() => {
        // @ts-expect-error - deliberately removing a browser API for the test
        delete window.PublicKeyCredential;
      });
      await page.goto(path);
      await expect(page.locator(".auth-unsupported")).toBeVisible();
      await expect(page.getByText(/This browser can't use passkeys/)).toBeVisible();
      await expect(page.getByRole("button", { name: /Use my passkey|Create account|Recover/ })).toHaveCount(0);
    });
  }

  // app#13: a page not served over HTTPS hides WebAuthn even in a browser
  // that supports it. The test server is a secure context (localhost), so
  // the flag is overridden before any page script runs.
  test("an insecure page says to use https", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "isSecureContext", { get: () => false });
    });
    await page.goto("/login/");
    await expect(page.locator(".auth-unsupported")).toBeVisible();
    await expect(page.getByText(/Passkeys only work on secure pages/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Use my passkey" })).toHaveCount(0);
  });
});
