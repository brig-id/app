import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { clickUntil, signUp, waitForIdentities } from "./account";
import { answerReturnAddress, ask, registerApplication } from "./application";
import { addVirtualAuthenticator, skipIfNoVirtualAuthenticator } from "./webauthn";

// The two ends of an account's life: the onboarding, where the first
// identities are the person's choice, and leaving, with one's data.

test.beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
});

test("onboarding proposes identities; the export holds them; deleting leaves nothing", async ({
  page,
  context,
  browserName,
}) => {
  skipIfNoVirtualAuthenticator(browserName);
  await addVirtualAuthenticator(context, page);
  await answerReturnAddress(page);
  const clientId = registerApplication("Reading Club");

  // -- onboarding: three identities proposed, ticked; the person decides ------
  await signUp(page);
  const proposed = page.getByRole("region", { name: "Your first identities" });
  await expect(proposed.getByRole("checkbox")).toHaveCount(3, {
    timeout: 15_000,
  });
  for (const name of ["Public", "Personal", "Work"]) {
    await expect(
      proposed.getByRole("checkbox", { name: `Create “${name}”` }),
    ).toBeChecked();
  }
  // One is not wanted, one gets another name.
  await proposed.getByRole("checkbox", { name: "Create “Public”" }).uncheck();
  await proposed.getByRole("textbox").nth(2).fill("Job");
  // Nothing exists until the person continues, and that waits for the code.
  const next = page.getByRole("button", { name: "Continue to my identities" });
  await expect(next).toBeDisabled();
  await page.getByLabel("I kept my recovery code").check();
  await clickUntil(page, next, () =>
    expect(page).toHaveURL(/\/identities\/?$/, { timeout: 5000 }),
  );
  await waitForIdentities(page, 2);
  await expect(page.locator(".identity-name")).toHaveText(["Personal", "Job"]);

  // Coming back to the onboarding proposes nothing more.
  await page.goto("/welcome/");
  await expect(page.locator(".recovery-status, #recovery-title").first()).toBeVisible();
  await expect(proposed).toHaveCount(0);

  // -- one identity signs in to an application ---------------------------------
  await ask(page, clientId, "openid");
  await page.getByRole("radio", { name: "Job" }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL(/application\.example/);

  // -- the export: made in the browser, readable --------------------------------
  await page.goto("/account/");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(
    /^brigid-export-brigid\.localhost-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const exported = JSON.parse(await readFile(await file.path(), "utf8")) as {
    format: string;
    version: number;
    server: string;
    identities: Array<{
      name: string;
      attributes: Record<string, string>;
      applications: Array<{ name: string; shared: unknown[] }>;
    }>;
  };
  expect(exported.format).toBe("brigid-export");
  expect(exported.version).toBe(1);
  expect(exported.server).toBe("brigid.localhost");
  expect(exported.identities.map((i) => i.name)).toEqual(["Personal", "Job"]);
  expect(exported.identities[0]!.applications).toEqual([]);
  expect(exported.identities[1]!.applications).toMatchObject([
    { name: "Reading Club", shared: [] },
  ]);
  await expect(page.getByRole("status")).toContainText("Downloaded: brigid-export-");

  // -- leaving: said plainly, confirmed, and done with the passkey ---------------
  const remove = page.getByRole("button", {
    name: "Delete my account with my passkey",
  });
  await expect(page.getByText(/each one keeps what it received/)).toBeVisible();
  await expect(remove).toBeDisabled();
  await page.getByLabel("I understand that this cannot be undone").check();
  await clickUntil(page, remove, () =>
    expect(page).toHaveURL(/brigid\.localhost:8080\/$/, { timeout: 5000 }),
  );
  await expect(page.getByRole("status")).toContainText(
    "Your account and everything about it were deleted",
  );

  // Nothing is left to come back to: no session, and the passkey opens nothing.
  await page.goto("/identities/");
  await expect(page).toHaveURL(/brigid\.localhost:8080\/$/);
  await page.getByRole("button", { name: "Use my passkey" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/brigid\.localhost:8080\/$/);
});
