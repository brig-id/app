/**
 * Calls to the administration (`/admin/…`). Reading needs an administrator's
 * session. Every change also needs a passkey ceremony done in that session a
 * few minutes ago at most: when the server asks for it, `confirmed` runs the
 * ceremony and sends the change again, once.
 */
import { linkAddress } from "./links";
import { ApiError, call } from "./api";
import type {
  AdminAccount,
  AdminApplication,
  AdminLogEntry,
  DescribedPolicy,
  DescribedSettings,
  LimitsSettings,
  Need,
  NewInvitation,
  RegisteredApplication,
  SignupPolicy,
  SignupSettings,
} from "./api-types";
import { confirmPresence } from "./webauthn";

/** Runs `change`; if the server asks for a recent passkey ceremony, does it
 * and runs `change` again. A ceremony the person cancels fails the change:
 * nothing was done. */
export async function confirmed<T>(change: () => Promise<T>): Promise<T> {
  try {
    return await change();
  } catch (err) {
    if (!(err instanceof ApiError) || err.code !== "confirmation_required") {
      throw err;
    }
  }
  await confirmPresence();
  return change();
}

const id = encodeURIComponent;

// -- becoming an administrator --------------------------------------------------

/** Presents a link made on the machine: this account becomes administrator. */
export async function claimAdministrator(link: string): Promise<void> {
  await call<void>("POST", "/admin/claim", { link });
}

// -- accounts -------------------------------------------------------------------

export async function listAccounts(): Promise<AdminAccount[]> {
  return call<AdminAccount[]>("GET", "/admin/accounts");
}

export async function suspendAccount(account: string): Promise<void> {
  await confirmed(() =>
    call<void>("POST", `/admin/accounts/${id(account)}/suspend`),
  );
}

export async function unsuspendAccount(account: string): Promise<void> {
  await confirmed(() =>
    call<void>("POST", `/admin/accounts/${id(account)}/unsuspend`),
  );
}

export async function setAdministrator(
  account: string,
  admin: boolean,
): Promise<void> {
  await confirmed(() =>
    call<void>("PUT", `/admin/accounts/${id(account)}/administrator`, {
      admin,
    }),
  );
}

export async function removeAccount(account: string): Promise<void> {
  await confirmed(() => call<void>("DELETE", `/admin/accounts/${id(account)}`));
}

// -- applications ---------------------------------------------------------------

export async function listApplications(): Promise<AdminApplication[]> {
  return call<AdminApplication[]>("GET", "/admin/applications");
}

export async function registerApplication(input: {
  name: string;
  redirect_uris: string[];
  confidential: boolean;
  attributes: Partial<Record<string, Need>>;
}): Promise<RegisteredApplication> {
  return confirmed(() =>
    call<RegisteredApplication>("POST", "/admin/applications", input),
  );
}

export async function setApplicationAttributes(
  clientId: string,
  attributes: Partial<Record<string, Need>>,
): Promise<void> {
  await confirmed(() =>
    call<void>(
      "PUT",
      `/admin/applications/${id(clientId)}/attributes`,
      attributes,
    ),
  );
}

export async function removeApplication(clientId: string): Promise<void> {
  await confirmed(() =>
    call<void>("DELETE", `/admin/applications/${id(clientId)}`),
  );
}

// -- websites that describe themselves ----------------------------------------------

export async function describedSettings(): Promise<DescribedSettings> {
  return call<DescribedSettings>("GET", "/admin/described");
}

export async function setDescribed(change: {
  policy?: DescribedPolicy;
  attributes?: string[];
}): Promise<void> {
  await confirmed(() => call<void>("PUT", "/admin/described", change));
}

/** Puts a website (its document's URL) on a list, or on none. */
export async function listWebsite(
  clientId: string,
  list: "accepted" | "refused" | null,
): Promise<void> {
  await confirmed(() =>
    call<void>("PUT", "/admin/described/list", { client_id: clientId, list }),
  );
}

// -- who may sign up --------------------------------------------------------------

export async function signupSettings(): Promise<SignupSettings> {
  return call<SignupSettings>("GET", "/admin/sign-up");
}

export async function setSignupPolicy(policy: SignupPolicy): Promise<void> {
  await confirmed(() => call<void>("PUT", "/admin/sign-up", { policy }));
}

export async function invite(
  uses: number,
  days: number,
): Promise<NewInvitation> {
  return confirmed(() =>
    call<NewInvitation>("POST", "/admin/invitations", { uses, days }),
  );
}

export async function revokeInvitation(invitation: string): Promise<void> {
  await confirmed(() =>
    call<void>("DELETE", `/admin/invitations/${id(invitation)}`),
  );
}

// -- limits -----------------------------------------------------------------------

/** The limits, or `null` from a server older than them: it has no
 * `/admin/limits`, and answers with a 404, or with the page of that name. */
export async function limitsSettings(): Promise<LimitsSettings | null> {
  let settings: LimitsSettings;
  try {
    settings = await call<LimitsSettings>("GET", "/admin/limits");
  } catch (err) {
    if (err instanceof SyntaxError) return null;
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
  return Array.isArray(settings?.limits) ? settings : null;
}

/** Sets the limits named in `changes`, and only them. Answers with all the
 * limits, as the server now holds them. */
export async function setLimits(
  changes: Record<string, number>,
): Promise<LimitsSettings> {
  return confirmed(() => call<LimitsSettings>("PUT", "/admin/limits", changes));
}

// -- the log ----------------------------------------------------------------------

export async function adminLog(): Promise<AdminLogEntry[]> {
  return call<AdminLogEntry[]>("GET", "/admin/log");
}

/** The address to give the people invited. */
export function invitationAddress(origin: string, link: string): string {
  return linkAddress(origin, "/signup/", "invitation", link);
}
