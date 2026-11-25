import { expect, test } from "@playwright/test";
import { clickUntil, finishOnboarding, signUp, waitForIdentities } from "./account";
import { administratorLink } from "./server";
import { addVirtualAuthenticator, skipIfNoVirtualAuthenticator } from "./webauthn";

// The limits of the server, changed by an administrator, and what a person
// is told when they reach one.

test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
});

/** A change refused for going too fast is said and not made: pressed again,
 * as a person would, until `check` holds. */
async function until(check: () => Promise<void>, press: () => Promise<void>) {
  await expect(async () => {
    await press();
    await check();
  }).toPass({ timeout: 40_000, intervals: [3500] });
}

test("an administrator lowers a limit, a person reaching it is told so, and it goes back to its default", async ({
  page,
  context,
  browserName,
}) => {
  skipIfNoVirtualAuthenticator(browserName);
  test.setTimeout(180_000);
  page.setDefaultTimeout(15_000);
  await addVirtualAuthenticator(context, page);

  await signUp(page);
  await finishOnboarding(page);
  await waitForIdentities(page, 3);

  // The operator makes this account an administrator, from the machine.
  await page.goto(administratorLink());
  await until(
    () =>
      expect(page.getByText("Your account now administers this server.")).toBeVisible({
        timeout: 5000,
      }),
    async () => {
      const button = page.getByRole("button", { name: "Become an administrator" });
      if (await button.isVisible()) await button.click({ timeout: 2000 });
    },
  );

  // The limits came with brig-id/core `feat/backup-and-limits`: a server
  // built on an older core has no `/admin/limits`, and this test waits for
  // one that has (the page then says the server is older than it).
  const probe = await page.request.get("/admin/limits");
  test.skip(
    probe.status() === 404 || !(probe.headers()["content-type"] ?? "").includes("json"),
    "the server has no /admin/limits yet (needs brig-id/core feat/backup-and-limits)",
  );

  await page.getByRole("link", { name: "Open the administration" }).click();
  await page.getByRole("link", { name: "Limits", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/limits\/$/);
  const identities = page.getByRole("spinbutton", { name: "Identities per account" });
  await expect(identities).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("spinbutton", { name: "Passkeys per account" })).toBeVisible();
  await expect(
    page.getByRole("spinbutton", { name: "New accounts per day from one network address" }),
  ).toBeVisible();
  const card = page.locator('[data-limit="identities_per_account"]');
  await expect(card).toContainText(/Default: \d+ · Maximum: \d+/);

  // A value the server would not take is said, and nothing is sent.
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "PUT" && r.url().endsWith("/admin/limits")) sent.push(r.url());
  });
  await identities.fill("0");
  await expect(card.getByText(/^A whole number from 1 to \d+\.$/)).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/Nothing was saved/)).toBeVisible();
  expect(sent).toEqual([]);

  // Three: the identities the account already has.
  await until(
    () => expect(page.getByText("Saved.", { exact: true })).toBeVisible({ timeout: 5000 }),
    async () => {
      await identities.fill("3");
      await page.getByRole("button", { name: "Save", exact: true }).click({ timeout: 2000 });
    },
  );
  await page.reload();
  await expect(identities).toHaveValue("3", { timeout: 20_000 });

  // A fourth identity is refused, and the person is told why.
  await page.goto("/identities/new/");
  const archetype = page.locator(".archetype").first();
  await expect(archetype).toBeVisible({ timeout: 10_000 });
  const reached = page.getByText("This server allows at most 3 identities per account.");
  await clickUntil(page, archetype, () => expect(reached).toBeVisible({ timeout: 3000 }));
  await expect(page).toHaveURL(/\/identities\/new\/$/);

  // Back to the default, so that the other suites find the server as it was.
  await page.goto("/admin/limits/");
  await expect(identities).toHaveValue("3", { timeout: 20_000 });
  await card.getByRole("button", { name: "Back to the default" }).click();
  await expect(identities).not.toHaveValue("3");
  await until(
    () => expect(page.getByText("Saved.", { exact: true })).toBeVisible({ timeout: 5000 }),
    () => page.getByRole("button", { name: "Save", exact: true }).click({ timeout: 2000 }),
  );
  await expect(card.getByRole("button", { name: "Back to the default" })).toBeDisabled();

  // And it is in the log.
  await page.getByRole("link", { name: "Log", exact: true }).click();
  await expect(page.locator('[data-action^="limit"]').first()).toBeVisible({ timeout: 20_000 });
});
