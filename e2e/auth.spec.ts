import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { E2E_ORIGIN } from "../playwright.config";
import { addVirtualAuthenticator, skipIfNoVirtualAuthenticator } from "./webauthn";

// The passkey ceremonies are rate-limited by the server (one every 3 s, in
// bursts of 5, per address), and every test hits the same server from the
// same address. A gap between tests lets the bucket refill.
test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
});

// Right after a navigation inside the app the handler of a freshly shown
// button can be wired a beat after the button is clickable, and a 429 can
// bounce a ceremony: click until `check` passes, waiting one refill between
// attempts.
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

/** Fills `field` and clicks `button` until `check` passes: a field filled
 * before the page wires it keeps an empty value, so each attempt fills again. */
async function fillAndClickUntil(
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
async function signUp(page: Page) {
  await page.goto("/signup/");
  await clickUntil(page, page.getByRole("button", { name: "Create my account" }), () =>
    expect(page).toHaveURL(/\/welcome\/?/, { timeout: 5000 }),
  );
}

/** Onboarding: reads the recovery code shown, confirms it, continues. */
async function finishOnboarding(page: Page): Promise<string> {
  const code = page.getByRole("group", { name: "Your recovery code" }).locator("code");
  // The page creates the code by itself. When that request falls on the rate
  // limit, it says so and offers the button: clicked here as a person would.
  const create = page.getByRole("button", { name: "Create a recovery code" });
  await expect(async () => {
    if (await create.isVisible()) await create.click();
    await expect(code).toHaveText(/^([A-Z2-7]{4}-){9}[A-Z2-7]{4}$/, { timeout: 4000 });
  }).toPass({ timeout: 40_000 });
  const value = (await code.textContent()) ?? "";
  const next = page.getByRole("button", { name: "Continue to my identities" });
  await expect(next).toBeDisabled();
  await page.getByLabel("I kept my recovery code").check();
  await next.click();
  await expect(page).toHaveURL(/\/identities\/?$/);
  return value;
}

async function signIn(page: Page) {
  await page.goto("/");
  await clickUntil(page, page.getByRole("button", { name: "Use my passkey" }), () =>
    expect(page).toHaveURL(/\/identities\/?$/, { timeout: 5000 }),
  );
}

async function signOut(page: Page) {
  await clickUntil(page, page.getByRole("button", { name: "Sign out" }), () =>
    expect(page).toHaveURL(`${E2E_ORIGIN}/`, { timeout: 2000 }),
  );
}

/** The session cookie: HttpOnly, so scripts can't read it, and nothing of
 * the session in web storage. */
async function sessionCookie(context: BrowserContext, page: Page) {
  const cookie = (await context.cookies()).find((c) =>
    /^(__Host-)?brigid_session$/.test(c.name),
  );
  const stored = await page.evaluate(() =>
    JSON.stringify({ ...localStorage, ...sessionStorage }),
  );
  expect(stored).not.toMatch(/brigid\.(token|user_id)|eyJ/);
  return cookie;
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

/** The identities page with its list loaded. The account routes are
 * rate-limited too (60 a minute), and a whole run can reach that limit: the
 * page then says so, and loading it again a little later succeeds. */
async function waitForIdentities(page: Page, count: number) {
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

test.describe("sign-up and onboarding", () => {
  test("an account is a passkey: onboarding names it and gives a recovery code", async ({
    page,
    context,
    browserName,
  }) => {
    skipIfNoVirtualAuthenticator(browserName);
    await addVirtualAuthenticator(context, page);
    await signUp(page);
    await expect(page.getByRole("textbox", { name: "Username" })).toHaveCount(0);

    await expect(page.getByRole("heading", { name: "Welcome to brig·id" })).toBeVisible();
    await expect(page).toHaveTitle("Welcome · brig·id");
    // The passkey is loaded once its name can be saved.
    await expect(page.getByRole("button", { name: "Save the name" })).toBeEnabled();
    await page.getByLabel("Name").fill("Laptop");
    await page.getByRole("button", { name: "Save the name" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();

    await finishOnboarding(page);
    await waitForIdentities(page, 3);

    await waitForPasskeyList(page, 1);
    await expect(page.locator(".passkey-item")).toContainText("Laptop");
    const cookie = await sessionCookie(context, page);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Strict");
    expect(await page.evaluate(() => document.cookie)).not.toContain("brigid_session");
  });

  test("a server that closed sign-up says so, and offers no way to it", async ({ page }) => {
    await page.route("**/auth/server", (route) =>
      route.fulfill({ json: { sign_up: false } }),
    );
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Lost your passkeys?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveCount(0);
    await page.goto("/signup/");
    await expect(page.getByText(/does not accept new accounts/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Create my account" })).toHaveCount(0);
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
    expect(await sessionCookie(context, page)).toBeUndefined();
    // Signed out for the server too: an account page sends back to sign-in.
    await page.goto("/identities/");
    await expect(page).toHaveURL(`${E2E_ORIGIN}/`);

    await signIn(page);
    expect(await sessionCookie(context, page)).toBeTruthy();
    // Signed in: the sign-in page leads home.
    await page.goto("/");
    await expect(page).toHaveURL(/\/identities\/?$/);
  });

  test("another server leads to its own sign-in page", async ({ page }) => {
    await page.route("https://id.example.org/**", (route) =>
      route.fulfill({ status: 200, body: "other server" }),
    );
    await page.goto("/");
    await clickUntil(page, page.getByRole("button", { name: "Another server" }), () =>
      expect(page.getByLabel("Server")).toBeVisible({ timeout: 2000 }),
    );
    await page.getByLabel("Server").fill("not a domain");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("alert")).toContainText("server’s domain");
    await page.getByLabel("Server").fill("https://id.example.org/somewhere");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("https://id.example.org/");
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
    await fillAndClickUntil(
      other,
      other.getByLabel("Recovery code"),
      code.toLowerCase(),
      other.getByRole("button", { name: "Recover" }),
      () => expect(other).toHaveURL(/\/welcome\/?$/, { timeout: 5000 }),
    );
    await expect(other.getByRole("heading", { name: "Your account is back" })).toBeVisible();
    const newCode = await finishOnboarding(other);
    expect(newCode).not.toBe(code);
    await waitForPasskeyList(other, 2);

    // The old code is used up.
    const third = await device.newPage();
    await third.goto("/recover/");
    await fillAndClickUntil(
      third,
      third.getByLabel("Recovery code"),
      code,
      third.getByRole("button", { name: "Recover" }),
      () =>
        expect(third.getByRole("alert")).toContainText("opens no account", {
          timeout: 5000,
        }),
    );
    await expect(third).toHaveURL(/\/recover\/?$/);
    await device.close();
  });

  test("a typo is reported before anything is sent", async ({ page }) => {
    const sent: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/auth/recovery/")) sent.push(request.url());
    });
    await page.goto("/recover/");
    await fillAndClickUntil(
      page,
      page.getByLabel("Recovery code"),
      "AAAA-BBBB",
      page.getByRole("button", { name: "Recover" }),
      () => expect(page.getByRole("alert")).toContainText("40 characters", { timeout: 3000 }),
    );
    expect(sent).toEqual([]);
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
    await expect(page.getByText(/Your only passkey/)).toBeVisible();

    // A second, distinct authenticator (Chrome allows one "internal" per
    // context): the server excludes the account's existing credential.
    await addVirtualAuthenticator(context, page, "usb");
    await clickUntil(page, page.getByRole("button", { name: "Add a passkey" }), () =>
      expect(page.locator(".passkey-item")).toHaveCount(2, { timeout: 2000 }),
    );
    await clickUntil(
      page,
      page.locator(".passkey-item").first().getByRole("button", { name: "Remove" }),
      () => expect(page.locator(".passkey-item")).toHaveCount(1, { timeout: 2000 }),
    );

    // The recovery code can be renewed from here, after being asked.
    await expect(page.getByText(/You have a recovery code, created on/)).toBeVisible();
    await page.getByRole("button", { name: "Create a new code" }).click();
    await expect(page.getByText(/The current one will stop working/)).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Create a new code" })).toBeVisible();
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
    await waitForIdentities(page, 3);
    const names = page.locator(".identity-name");
    await expect(names).toHaveText(["Public", "Personal", "Work"]);

    await page.getByRole("button", { name: "New identity" }).click();
    await page
      .getByRole("group", { name: "Start from" })
      .getByRole("button", { name: "Family" })
      .click();
    await expect(page.getByLabel("Name")).toHaveValue("Family");
    await page.getByLabel("Name").fill("Les Dupont");
    // Rate-limited like the list: the form is still there to send again.
    await clickUntil(page, page.getByRole("button", { name: "Create", exact: true }), () =>
      expect(cards).toHaveCount(4, { timeout: 3000 }),
    );
    await expect(names.last()).toHaveText("Les Dupont");

    await page.getByRole("button", { name: "Edit Les Dupont" }).click();
    await page.getByLabel("Name").fill("Famille");
    await clickUntil(page, page.getByRole("button", { name: "Save", exact: true }), () =>
      expect(names.last()).toHaveText("Famille", { timeout: 3000 }),
    );

    // Deleting asks first, in the page.
    await page.getByRole("button", { name: "Delete Famille" }).click();
    await expect(page.getByText(/This cannot be undone/)).toBeVisible();
    await clickUntil(page, page.getByRole("button", { name: "Yes, delete" }), () =>
      expect(cards).toHaveCount(3, { timeout: 3000 }),
    );
  });
});

// No passkey involved from here on: these run on both browsers and never
// touch the rate-limited ceremonies.
test.describe("browsers that can't use passkeys", () => {
  for (const path of ["/signup/", "/", "/recover/"]) {
    test(`${path} explains a browser without WebAuthn`, async ({ page }) => {
      await page.addInitScript(() => {
        // @ts-expect-error - deliberately removing a browser API for the test
        delete window.PublicKeyCredential;
      });
      await page.goto(path);
      await expect(page.locator(".passkey-unsupported")).toBeVisible();
      await expect(page.getByText(/This browser can’t use passkeys/)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Use my passkey|Create my account|Recover/ }),
      ).toHaveCount(0);
    });
  }

  // A page not served over HTTPS hides WebAuthn even in a browser that
  // supports it. The test server is a secure context (localhost), so the
  // flag is overridden before any script of the page runs.
  test("an insecure page says to use https", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "isSecureContext", { get: () => false });
    });
    await page.goto("/");
    await expect(page.locator(".passkey-unsupported")).toBeVisible();
    await expect(page.getByText(/Passkeys only work on secure pages/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Use my passkey" })).toHaveCount(0);
  });
});

test.describe("languages", () => {
  test("a browser in French gets French, before anything is clicked", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: E2E_ORIGIN,
      ignoreHTTPSErrors: true,
      locale: "fr-FR",
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("heading", { name: "Se connecter" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Utiliser ma clé d’accès" })).toBeVisible();
    await expect(page).toHaveTitle("Se connecter · brig·id");
    await context.close();
  });

  test("the switch changes the language and is remembered", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await clickUntil(page, page.getByRole("button", { name: "Français" }), () =>
      expect(page.locator("html")).toHaveAttribute("lang", "fr", { timeout: 2000 }),
    );
    await expect(page.getByRole("heading", { name: "Se connecter" })).toBeVisible();
    await expect(page).toHaveTitle("Se connecter · brig·id");

    await page.goto("/recover/");
    await expect(page.getByRole("heading", { name: "Récupérer votre compte" })).toBeVisible();
    await expect(page.getByRole("button", { name: "English" })).toBeVisible();
  });
});

test.describe("nothing external", () => {
  test("the pages load nothing from another origin, and nothing is refused", async ({
    page,
  }) => {
    const elsewhere: string[] = [];
    const refused: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith(`${E2E_ORIGIN}/`) && !url.startsWith("data:")) elsewhere.push(url);
    });
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text())) refused.push(message.text());
    });
    for (const path of ["/", "/signup/", "/recover/", "/about/", "/continue/"]) {
      await page.goto(path, { waitUntil: "networkidle" });
    }
    await expect(page.getByRole("alert")).toContainText("not valid");
    expect(elsewhere).toEqual([]);
    expect(refused).toEqual([]);
  });
});
