/**
 * Calls to brigid-api from the signed-in pages. The account session is an
 * HttpOnly cookie the browser sends by itself (ADR-005): nothing here holds a
 * token or an account id. A 401 means the session is over (expired, signed
 * out, or the account is gone): the caller sends the person to the sign-in page.
 */
import type {
  AuthorizationAnswer,
  AuthorizationRequest,
  CreateIdentityRequest,
  Identity,
  IdentityTemplate,
  PasskeySummary,
  RecoveryCodeResponse,
  RecoveryStatus,
  RenamePasskeyRequest,
  ServerInfo,
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
  /** The HTTP status; 0 when the server could not be reached. */
  status: number;
  /** The server's own explanation, when it gave one (in English). */
  detail: string | null;
  constructor(status: number, message: string, detail: string | null = null) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.name = "ApiError";
  }
}

/** How many times a read refused for "too many requests" is asked again. */
const READ_RETRIES = 2;

/** How long to wait before asking again: what the server says, within
 * reason, or two seconds. */
function retryDelay(response: Response): number {
  const seconds = Number(response.headers.get("retry-after"));
  const wait = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 2000;
  return Math.min(wait, 5000);
}

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
  attempt = 0,
): Promise<T> {
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
  // A page reads several things at once, often right after a change: a read
  // that hits the rate limit is asked again after a pause, so that the page
  // never shows what was true before the change. A write is not repeated:
  // the person sees the refusal and decides.
  if (response.status === 429 && method === "GET" && attempt < READ_RETRIES) {
    await new Promise((resolve) => setTimeout(resolve, retryDelay(response)));
    return call<T>(method, path, body, attempt + 1);
  }
  const text = await response.text();
  if (!response.ok) {
    let detail: string | null = null;
    try {
      const data = JSON.parse(text) as { error?: string };
      if (data.error) detail = data.error;
    } catch {
      // no explanation given
    }
    throw new ApiError(
      response.status,
      detail ?? `Request failed (${response.status}).`,
      detail,
    );
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

// -- this server --------------------------------------------------------------

/** What differs from one server to another and the pages need to know. If
 * the server cannot be asked, sign-up is offered all the same: a server
 * that closed it refuses it in any case. */
export async function serverInfo(): Promise<ServerInfo> {
  try {
    return await call<ServerInfo>("GET", "/auth/server");
  } catch {
    return { sign_up: true };
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
  return call<IdentityTemplate[]>("GET", "/account/identity-templates");
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

// -- authorization requests of relying parties (ADR-005 §2) -------------------

const authorizationPath = (request: string) =>
  `/auth/authorize/${encodeURIComponent(request)}`;

/** The request a site sent, or `null` when it is unknown, expired or
 * already answered. Works signed out: the site's name is then all it says. */
export async function authorizationRequest(
  request: string,
): Promise<AuthorizationRequest | null> {
  try {
    return await call<AuthorizationRequest>("GET", authorizationPath(request));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Continue to the site as `identityId`. Returns where to send the browser.
 * Throws SessionEndedError when a passkey ceremony is needed first. */
export async function approveAuthorization(
  request: string,
  identityId: string,
): Promise<string> {
  const answer = await call<AuthorizationAnswer>(
    "POST",
    `${authorizationPath(request)}/approve`,
    { identity_id: identityId },
  );
  return answer.redirect_to;
}

/** Go back to the site without signing in. */
export async function denyAuthorization(request: string): Promise<string> {
  const answer = await call<AuthorizationAnswer>(
    "POST",
    `${authorizationPath(request)}/deny`,
  );
  return answer.redirect_to;
}

/** The answer to a request that asked for no page at all. */
export async function answerSilently(request: string): Promise<string> {
  const answer = await call<AuthorizationAnswer>(
    "POST",
    `${authorizationPath(request)}/silent`,
  );
  return answer.redirect_to;
}
