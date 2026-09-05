import { test, type BrowserContext, type Page } from "@playwright/test";

/**
 * Adds a CDP virtual authenticator to `page`'s context so
 * `navigator.credentials.create()`/`.get()` resolve without real hardware
 * or a user gesture. Chromium (CDP) only — see `skipIfNoVirtualAuthenticator`.
 *
 * `transport` defaults to `"internal"` (a platform authenticator, e.g. a
 * laptop's built-in key). Chrome allows only one `"internal"` authenticator
 * per browser context — pass `"usb"` to simulate a second, distinct
 * physical key alongside it (e.g. to test adding a passkey while excluding
 * the identity's existing credential).
 */
export async function addVirtualAuthenticator(
  context: BrowserContext,
  page: Page,
  transport: "internal" | "usb" = "internal",
): Promise<void> {
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable", { enableUI: false });
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport,
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

/**
 * No Firefox equivalent exists in Playwright for the CDP `WebAuthn` domain
 * used above, so passkey-dependent specs call this first and skip
 * themselves under the `firefox` project rather than failing or (worse)
 * silently not running with no visible reason.
 */
export function skipIfNoVirtualAuthenticator(browserName: string): void {
  test.skip(
    browserName !== "chromium",
    "WebAuthn virtual authenticator requires Chrome DevTools Protocol — not available for Firefox in Playwright",
  );
}

export function uniqueUsername(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}
