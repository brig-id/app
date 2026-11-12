/**
 * Calls to brigid-api from the signed-in pages. The account session is an
 * HttpOnly cookie the browser sends by itself (ADR-005): nothing here holds a
 * token or an account id. A 401 means the session is over (expired, signed
 * out, or the account is gone): the caller sends the user to /login/.
 */
import type {
  CreateIdentityRequest,
  Identity,
  IdentityTemplate,
  PasskeySummary,
  RecoveryCodeResponse,
  RecoveryStatus,
  RenamePasskeyRequest,
  SessionResponse,
  UpdateIdentityRequest,
} from "./api-types";

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

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      // Same-origin requests carry the session cookie by default; said
      // explicitly so a later change of fetch defaults can't drop it.
      credentials: "same-origin",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server.");
  }
  if (response.status === 401) throw new SessionEndedError();
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

// -- session ------------------------------------------------------------------

/** Throws SessionEndedError when there is no live session. */
export async function checkSession(): Promise<SessionResponse> {
  return call<SessionResponse>("GET", "/auth/session");
}

/** Ends the session (the server also clears the cookie). */
export async function signOut(): Promise<void> {
  try {
    await call<void>("POST", "/auth/logout");
  } catch (err) {
    // Already signed out is fine.
    if (!(err instanceof SessionEndedError)) throw err;
  }
}

// -- passkeys -----------------------------------------------------------------

export async function listPasskeys(): Promise<PasskeySummary[]> {
  return call<PasskeySummary[]>("GET", "/auth/passkeys");
}

export async function renamePasskey(id: string, label: string): Promise<void> {
  await call<void>("PATCH", `/auth/passkeys/${encodeURIComponent(id)}`, {
    label,
  } satisfies RenamePasskeyRequest);
}

export async function deletePasskey(id: string): Promise<void> {
  await call<void>("DELETE", `/auth/passkeys/${encodeURIComponent(id)}`);
}

// -- recovery code (ADR-004) --------------------------------------------------

export async function recoveryStatus(): Promise<RecoveryStatus> {
  return call<RecoveryStatus>("GET", "/account/recovery-code");
}

/** A new code, replacing the previous one. Shown once. */
export async function createRecoveryCode(): Promise<string> {
  const r = await call<RecoveryCodeResponse>("POST", "/account/recovery-code");
  return r.code;
}

// -- identities ---------------------------------------------------------------

export async function listIdentities(): Promise<Identity[]> {
  return call<Identity[]>("GET", "/account/identities");
}

export async function listTemplates(): Promise<IdentityTemplate[]> {
  const response = await fetch("/account/identity-templates");
  if (!response.ok) throw new ApiError(response.status, "Unable to load templates.");
  return (await response.json()) as IdentityTemplate[];
}

export async function createIdentity(input: CreateIdentityRequest): Promise<Identity> {
  return call<Identity>("POST", "/account/identities", input);
}

export async function updateIdentity(
  id: string,
  patch: UpdateIdentityRequest,
): Promise<Identity> {
  return call<Identity>("PATCH", `/account/identities/${encodeURIComponent(id)}`, patch);
}

export async function deleteIdentity(id: string): Promise<void> {
  await call<void>("DELETE", `/account/identities/${encodeURIComponent(id)}`);
}
