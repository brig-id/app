/**
 * Authenticated calls to brigid-api. Every call carries the bearer token and
 * the account id; a 401 means the session is over (expired, revoked, or the
 * account is gone), so the stored auth is cleared and the caller sends the
 * user to /login/ instead of leaving the app in a half-signed-in state.
 */
import type {
  CreateIdentityRequest,
  Identity,
  IdentityTemplate,
  LoginResponse,
  PasskeySummary,
  RecoveryCodeResponse,
  RecoveryStatus,
  RenamePasskeyRequest,
  SessionResponse,
  UpdateIdentityRequest,
} from "./api-types";
import { clearAuth, loadToken, loadUserId, storeAuth } from "./webauthn";

/** The session is over: sign in again. */
export class SessionEndedError extends Error {
  constructor() {
    super("Your session has ended. Please sign in again.");
    this.name = "SessionEndedError";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function credentials(): { token: string; userId: string } {
  const token = loadToken();
  const userId = loadUserId();
  if (!token || !userId) throw new SessionEndedError();
  return { token, userId };
}

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const { token } = credentials();
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server.");
  }
  if (response.status === 401) {
    clearAuth();
    throw new SessionEndedError();
  }
  const text = await response.text();
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const data = JSON.parse(text) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep the generic message
    }
    throw new ApiError(response.status, message);
  }
  return (text.length ? JSON.parse(text) : undefined) as T;
}

const uid = () => encodeURIComponent(credentials().userId);

// -- session ------------------------------------------------------------------

/** Throws SessionEndedError when the session is no longer valid. */
export async function checkSession(): Promise<SessionResponse> {
  return call<SessionResponse>("GET", `/auth/session?user_id=${uid()}`);
}

/** Swaps the token for a fresh one (the old one is revoked server-side). */
export async function refreshSession(): Promise<void> {
  const result = await call<LoginResponse>(
    "POST",
    `/auth/session/refresh?user_id=${uid()}`,
  );
  storeAuth(result.id_token, result.user_id);
}

// -- passkeys -----------------------------------------------------------------

export async function listPasskeys(): Promise<PasskeySummary[]> {
  return call<PasskeySummary[]>("GET", `/auth/passkeys?user_id=${uid()}`);
}

export async function renamePasskey(id: string, label: string): Promise<void> {
  await call<void>("PATCH", `/auth/passkeys/${encodeURIComponent(id)}`, {
    user_id: credentials().userId,
    label,
  } satisfies RenamePasskeyRequest);
}

// -- recovery code (ADR-004) --------------------------------------------------

export async function recoveryStatus(): Promise<RecoveryStatus> {
  return call<RecoveryStatus>("GET", `/account/recovery-code?user_id=${uid()}`);
}

/** A new code, replacing the previous one. Shown once. */
export async function createRecoveryCode(): Promise<string> {
  const r = await call<RecoveryCodeResponse>(
    "POST",
    `/account/recovery-code?user_id=${uid()}`,
  );
  return r.code;
}

// -- identities ---------------------------------------------------------------

export async function listIdentities(): Promise<Identity[]> {
  return call<Identity[]>("GET", `/account/identities?user_id=${uid()}`);
}

export async function listTemplates(): Promise<IdentityTemplate[]> {
  const response = await fetch("/account/identity-templates");
  if (!response.ok) throw new ApiError(response.status, "Unable to load templates.");
  return (await response.json()) as IdentityTemplate[];
}

export async function createIdentity(
  input: Omit<CreateIdentityRequest, "user_id">,
): Promise<Identity> {
  return call<Identity>("POST", "/account/identities", {
    ...input,
    user_id: credentials().userId,
  } satisfies CreateIdentityRequest);
}

export async function updateIdentity(
  id: string,
  patch: Omit<UpdateIdentityRequest, "user_id">,
): Promise<Identity> {
  return call<Identity>("PATCH", `/account/identities/${encodeURIComponent(id)}`, {
    ...patch,
    user_id: credentials().userId,
  } satisfies UpdateIdentityRequest);
}

export async function deleteIdentity(id: string): Promise<void> {
  await call<void>(
    "DELETE",
    `/account/identities/${encodeURIComponent(id)}?user_id=${uid()}`,
  );
}
