import { fromBase64, toBase64 } from "helpers4/string";
import { aaguidFromAuthenticatorData, providerName } from "./aaguid";
import type {
  BeginLoginRequest,
  BeginRecoveryRequest,
  BeginLoginResponse,
  BeginRegisterRequest,
  BeginRegisterResponse,
  FinishLoginRequest,
  FinishRegisterRequest,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialJSON,
  RegisterPublicKeyCredentialJSON,
} from "./api-types";

/**
 * Why passkeys can or can't work here (app#13):
 * - `insecure-context`: the page isn't served over HTTPS (or localhost), so
 *   browsers hide the WebAuthn API even when they support it;
 * - `no-webauthn`: the browser has no WebAuthn API at all (too old);
 * - `supported`: the API is there. A device without its own authenticator
 *   can still use a phone or a security key, so that is not a blocker.
 */
export type PasskeySupport = "supported" | "insecure-context" | "no-webauthn";

export function passkeySupport(): PasskeySupport {
  if (typeof window === "undefined") return "no-webauthn";
  if (window.isSecureContext === false) return "insecure-context";
  return "PublicKeyCredential" in window ? "supported" : "no-webauthn";
}

export type WebAuthnErrorKind = "network" | "browser" | "api";

export class WebAuthnError extends Error {
  kind: WebAuthnErrorKind;
  /** The HTTP status of an `api` error. */
  status: number | null;
  /** The server's own explanation, when it gave one (in English). */
  detail: string | null;
  /** The server's name for a refusal the interface acts on. */
  code: string | null;

  constructor(
    kind: WebAuthnErrorKind,
    message: string,
    status: number | null = null,
    detail: string | null = null,
    code: string | null = null,
  ) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.detail = detail;
    this.code = code;
    this.name = "WebAuthnError";
  }
}

// WebAuthn exchanges binary fields as unpadded base64url (helpers4 accepts
// both alphabets and optional padding on decode).
function base64UrlToBuffer(value: string): ArrayBuffer {
  const bytes = fromBase64(value, { output: "bytes" });
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  return toBase64(new Uint8Array(buffer), { urlSafe: true });
}

async function apiRequest<T>(
  path: string,
  body: unknown,
  method: "POST" | "DELETE" = "POST",
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      // The ceremonies' finish responses set the session cookie, and adding
      // a passkey needs it: same-origin, said explicitly.
      credentials: "same-origin",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new WebAuthnError("network", "Unable to reach the server.");
  }

  if (!response.ok) {
    let detail: string | null = null;
    let code: string | null = null;
    try {
      const data = JSON.parse(await response.text()) as {
        error?: string;
        code?: string;
      };
      if (data.error) detail = data.error;
      if (data.code) code = data.code;
    } catch {
      // no explanation given
    }
    throw new WebAuthnError(
      "api",
      detail ?? `Request failed with status ${response.status}`,
      response.status,
      detail,
      code,
    );
  }

  const text = await response.text();
  if (text.length === 0) return undefined as T;
  return JSON.parse(text) as T;
}

/**
 * Where a new passkey is to be kept. A password manager, a device or a
 * security key keeps one passkey for an account: a second passkey goes
 * somewhere else, and the browser is told where the person means, so that it
 * does not propose the place that already has one.
 *
 * These are the `hints` of WebAuthn. A browser that does not know them
 * ignores them and asks in its own way.
 */
export type PasskeyPlace = "client-device" | "hybrid" | "security-key";

/** The refusal of a place that already holds a passkey for the account
 * (`WebAuthnError.code`). */
export const PASSKEY_EXISTS = "passkey_exists";

interface CreatedPasskey {
  credential: RegisterPublicKeyCredentialJSON;
  /** The provider's name from its AAGUID, when known (a default passkey name). */
  provider: string | null;
}

/** Runs the browser-side `navigator.credentials.create()` ceremony and shapes
 * the result for the `/finish` endpoints of signup, adding a passkey and
 * recovery. */
async function createPasskey(
  options: PublicKeyCredentialCreationOptionsJSON,
  place?: PasskeyPlace,
): Promise<CreatedPasskey> {
  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.create({
      publicKey: {
        ...options,
        challenge: base64UrlToBuffer(options.challenge),
        user: {
          ...options.user,
          id: base64UrlToBuffer(options.user.id),
        },
        excludeCredentials: options.excludeCredentials?.map((cred) => ({
          type: cred.type,
          id: base64UrlToBuffer(cred.id),
          transports: cred.transports as AuthenticatorTransport[] | undefined,
        })),
        ...(place ? { hints: [place] } : {}),
      } as PublicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;
  } catch (err) {
    // The place chosen holds one of the passkeys the server said the account
    // already has: it keeps one per account, and says so with this error.
    if ((err as { name?: unknown } | null)?.name === "InvalidStateError") {
      throw new WebAuthnError(
        "browser",
        "This place already holds a passkey for this account.",
        null,
        null,
        PASSKEY_EXISTS,
      );
    }
    throw new WebAuthnError("browser", "Passkey creation was cancelled or failed.");
  }
  if (!credential) {
    throw new WebAuthnError("browser", "No passkey was created.");
  }

  const response = credential.response as AuthenticatorAttestationResponse;
  let aaguid: string | null = null;
  try {
    aaguid = aaguidFromAuthenticatorData(response.getAuthenticatorData());
  } catch {
    // getAuthenticatorData() is missing in old browsers: no default name.
  }
  return {
    credential: {
      id: credential.id,
      rawId: bufferToBase64Url(credential.rawId),
      type: "public-key",
      response: {
        attestationObject: bufferToBase64Url(response.attestationObject),
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      },
      clientExtensionResults: credential.getClientExtensionResults() as unknown as Record<
        string,
        unknown
      >,
    },
    provider: providerName(aaguid),
  };
}

/**
 * Creates an account: one passkey, no username (the server generates a
 * hidden one, ADR-003), and opens its session (an HttpOnly cookie) with the same ceremony. The passkey
 * is named after its provider when the AAGUID is known.
 */
export async function signUp(link?: string): Promise<void> {
  const begin = await apiRequest<BeginRegisterResponse>(
    "/auth/register/begin",
    (link ? { link } : {}) satisfies BeginRegisterRequest,
  );
  const { credential, provider } = await createPasskey(begin.challenge.publicKey);
  await apiRequest<void>("/auth/register/finish", {
    session_id: begin.session_id,
    credential,
    ...(provider ? { label: provider } : {}),
  } satisfies FinishRegisterRequest);
}

/**
 * Recovers an account with its recovery code (ADR-004): enrols a new passkey
 * for the account the code names, consumes the code, and opens a session.
 */
export async function recover(code: string): Promise<void> {
  const begin = await apiRequest<BeginRegisterResponse>(
    "/auth/recovery/begin",
    { code } satisfies BeginRecoveryRequest,
  );
  const { credential, provider } = await createPasskey(begin.challenge.publicKey);
  await apiRequest<void>("/auth/recovery/finish", {
    session_id: begin.session_id,
    credential,
    ...(provider ? { label: provider } : {}),
  } satisfies FinishRegisterRequest);
}

/** Adds one more passkey to the signed-in account (the session cookie says
 * which), named after its provider when known. `place` is where the person
 * means to keep it; without it the browser proposes. */
export async function addCredential(place?: PasskeyPlace): Promise<void> {
  const begin = await apiRequest<BeginRegisterResponse>(
    "/auth/passkeys/add/begin",
    undefined,
  );
  const { credential, provider } = await createPasskey(
    begin.challenge.publicKey,
    place,
  );
  await apiRequest<void>("/auth/passkeys/add/finish", {
    session_id: begin.session_id,
    credential,
    ...(provider ? { label: provider } : {}),
  } satisfies FinishRegisterRequest);
}


/**
 * Signs in with a passkey, and nothing else: no username is sent. The
 * authenticator offers the passkeys it holds for this server, and the server
 * learns the account from the one that answers.
 */
export async function login(): Promise<void> {
  const begin = await apiRequest<BeginLoginResponse>(
    "/auth/login/begin",
    {} satisfies BeginLoginRequest,
  );
  await apiRequest<void>("/auth/login/finish", {
    session_id: begin.session_id,
    credential: await usePasskey(begin.challenge.publicKey),
  } satisfies FinishLoginRequest);
}

/**
 * Deletes the signed-in account, with a passkey ceremony done for that
 * purpose: the session alone is not enough. Nothing is deleted if the
 * ceremony is cancelled.
 */
export async function deleteAccount(): Promise<void> {
  const begin = await apiRequest<BeginLoginResponse>(
    "/account/delete/begin",
    undefined,
  );
  await apiRequest<void>("/account/delete/finish", {
    session_id: begin.session_id,
    credential: await usePasskey(begin.challenge.publicKey),
  } satisfies FinishLoginRequest);
}

/**
 * Confirms, in the open session, that the person is there: a passkey
 * ceremony the server asks for before an administrative change. It opens no
 * session and changes nothing by itself.
 */
export async function confirmPresence(): Promise<void> {
  const begin = await apiRequest<BeginLoginResponse>(
    "/auth/confirm/begin",
    undefined,
  );
  await apiRequest<void>("/auth/confirm/finish", {
    session_id: begin.session_id,
    credential: await usePasskey(begin.challenge.publicKey),
  } satisfies FinishLoginRequest);
}

/** Asks the authenticator to answer a challenge with one of its passkeys. */
async function usePasskey(
  options: BeginLoginResponse["challenge"]["publicKey"],
): Promise<PublicKeyCredentialJSON> {
  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.get({
      publicKey: {
        ...options,
        challenge: base64UrlToBuffer(options.challenge),
        allowCredentials: options.allowCredentials?.map((cred) => ({
          type: cred.type,
          id: base64UrlToBuffer(cred.id),
          transports: cred.transports as AuthenticatorTransport[] | undefined,
        })),
      } as PublicKeyCredentialRequestOptions,
    })) as PublicKeyCredential | null;
  } catch {
    throw new WebAuthnError("browser", "The passkey was not used: cancelled, or it failed.");
  }
  if (!credential) {
    throw new WebAuthnError("browser", "No passkey was selected.");
  }

  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: "public-key",
    response: {
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      signature: bufferToBase64Url(response.signature),
      userHandle: response.userHandle
        ? bufferToBase64Url(response.userHandle)
        : undefined,
    },
    clientExtensionResults: credential.getClientExtensionResults() as unknown as Record<
      string,
      unknown
    >,
  };
}

const DELETED_KEY = "brigid.deleted";

/** Marks the next sign-in page as following the deletion of the account
 * (read once). */
export function markDeleted(): void {
  sessionStorage.setItem(DELETED_KEY, "1");
}

/** Whether the account was just deleted from this tab; clears the mark. */
export function takeDeletedFlag(): boolean {
  const deleted = sessionStorage.getItem(DELETED_KEY) === "1";
  sessionStorage.removeItem(DELETED_KEY);
  return deleted;
}

const RECOVERED_KEY = "brigid.recovered";

/** Marks the next onboarding page as following a recovery (read once). */
export function markRecovered(): void {
  sessionStorage.setItem(RECOVERED_KEY, "1");
}

/** Whether this onboarding follows a recovery; clears the mark. */
export function takeRecoveredFlag(): boolean {
  const recovered = sessionStorage.getItem(RECOVERED_KEY) === "1";
  sessionStorage.removeItem(RECOVERED_KEY);
  return recovered;
}
