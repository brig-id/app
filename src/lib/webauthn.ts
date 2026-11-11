import { fromBase64, toBase64 } from "helpers4/string";
import { aaguidFromAuthenticatorData, providerName } from "./aaguid";
import type {
  BeginAddCredentialRequest,
  BeginLoginRequest,
  BeginRecoveryRequest,
  BeginLoginResponse,
  BeginRegisterRequest,
  BeginRegisterResponse,
  FinishLoginRequest,
  FinishRegisterRequest,
  LoginResponse,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialJSON,
  RegisterPublicKeyCredentialJSON,
} from "./api-types";

/** Feature-detects WebAuthn/passkey support in the current browser. */
export function isPasskeySupported(): boolean {
  return passkeySupport() === "supported";
}

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

/** True when this device has a built-in authenticator (Touch ID, Windows
 * Hello, Android screen lock…). False only means "use a phone or a key". */
export async function hasPlatformAuthenticator(): Promise<boolean> {
  const pkc = (
    globalThis as {
      PublicKeyCredential?: {
        isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
      };
    }
  ).PublicKeyCredential;
  if (!pkc?.isUserVerifyingPlatformAuthenticatorAvailable) return false;
  try {
    return await pkc.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export type WebAuthnErrorKind = "network" | "browser" | "api";

export class WebAuthnError extends Error {
  kind: WebAuthnErrorKind;

  constructor(kind: WebAuthnErrorKind, message: string) {
    super(message);
    this.kind = kind;
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new WebAuthnError("network", "Unable to reach the server.");
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = JSON.parse(await response.text()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore — keep the generic message
    }
    throw new WebAuthnError("api", message);
  }

  const text = await response.text();
  if (text.length === 0) return undefined as T;
  return JSON.parse(text) as T;
}

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
      } as PublicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;
  } catch {
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

/** True when the browser can offer passkeys as autofill (conditional UI). */
export async function isAutofillSupported(): Promise<boolean> {
  const pkc = (
    globalThis as {
      PublicKeyCredential?: { isConditionalMediationAvailable?: () => Promise<boolean> };
    }
  ).PublicKeyCredential;
  if (!pkc?.isConditionalMediationAvailable) return false;
  try {
    return await pkc.isConditionalMediationAvailable();
  } catch {
    return false;
  }
}

/**
 * Creates an account: one passkey, no username (the server generates a
 * hidden one, ADR-003), and signs it in with the same ceremony. The passkey
 * is named after its provider when the AAGUID is known.
 */
export async function signUp(clientId: string): Promise<LoginResponse> {
  const begin = await apiRequest<BeginRegisterResponse>(
    "/auth/register/begin",
    { client_id: clientId } satisfies BeginRegisterRequest,
  );
  const { credential, provider } = await createPasskey(begin.challenge.publicKey);
  return apiRequest<LoginResponse>("/auth/register/finish", {
    session_id: begin.session_id,
    credential,
    ...(provider ? { label: provider } : {}),
  } satisfies FinishRegisterRequest);
}

/**
 * Recovers an account with its recovery code (ADR-004): enrols a new passkey
 * for the account the code names, consumes the code, and signs in.
 */
export async function recover(
  code: string,
  clientId: string,
): Promise<LoginResponse> {
  const begin = await apiRequest<BeginRegisterResponse>(
    "/auth/recovery/begin",
    { code, client_id: clientId } satisfies BeginRecoveryRequest,
  );
  const { credential, provider } = await createPasskey(begin.challenge.publicKey);
  return apiRequest<LoginResponse>("/auth/recovery/finish", {
    session_id: begin.session_id,
    credential,
    ...(provider ? { label: provider } : {}),
  } satisfies FinishRegisterRequest);
}

/** Adds a second (or further) passkey to the already-authenticated identity
 * behind `token`/`userId`, instead of registering an unrelated identity. */
export async function addCredential(
  userId: string,
  token: string,
): Promise<void> {
  let beginResponse: Response;
  try {
    beginResponse = await fetch("/auth/passkeys/add/begin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
      } satisfies BeginAddCredentialRequest),
    });
  } catch {
    throw new WebAuthnError("network", "Unable to reach the server.");
  }
  if (!beginResponse.ok) {
    throw new WebAuthnError(
      "api",
      `Failed to start passkey registration (status ${beginResponse.status}).`,
    );
  }
  const begin = (await beginResponse.json()) as BeginRegisterResponse;

  const { credential, provider } = await createPasskey(begin.challenge.publicKey);

  await apiRequest<void>("/auth/passkeys/add/finish", {
    session_id: begin.session_id,
    credential,
    ...(provider ? { label: provider } : {}),
  } satisfies FinishRegisterRequest);
}

/**
 * Passkey sign-in. With a `username`, the server names the allowed passkeys.
 * Without one (`null`), it is username-less: the authenticator picks the
 * passkey and the server learns the user from it. `conditional` runs it as
 * passkey autofill on the username field; `signal` aborts it (a conditional
 * request stays pending until the user picks a passkey or it is aborted).
 */
export async function login(
  username: string | null,
  clientId: string,
  opts: { conditional?: boolean; signal?: AbortSignal } = {},
): Promise<LoginResponse> {
  const begin = await apiRequest<BeginLoginResponse>("/auth/login/begin", {
    ...(username ? { username } : {}),
    client_id: clientId,
  } satisfies BeginLoginRequest);

  const options = begin.challenge.publicKey;
  let credential: PublicKeyCredential | null;
  try {
    credential = (await navigator.credentials.get({
      ...(opts.conditional ? { mediation: "conditional" } : {}),
      ...(opts.signal ? { signal: opts.signal } : {}),
      publicKey: {
        ...options,
        challenge: base64UrlToBuffer(options.challenge),
        allowCredentials: options.allowCredentials?.map((cred) => ({
          type: cred.type,
          id: base64UrlToBuffer(cred.id),
          transports: cred.transports as AuthenticatorTransport[] | undefined,
        })),
      } as PublicKeyCredentialRequestOptions,
    } as CredentialRequestOptions)) as PublicKeyCredential | null;
  } catch {
    throw new WebAuthnError("browser", "Passkey sign-in was cancelled or failed.");
  }
  if (!credential) {
    throw new WebAuthnError("browser", "No passkey was selected.");
  }

  const response = credential.response as AuthenticatorAssertionResponse;
  const finishCredential: PublicKeyCredentialJSON = {
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

  return apiRequest<LoginResponse>("/auth/login/finish", {
    session_id: begin.session_id,
    credential: finishCredential,
  } satisfies FinishLoginRequest);
}

export async function deletePasskey(
  passkeyId: string,
  userId: string,
  token: string,
): Promise<void> {
  const response = await fetch(`/auth/passkeys/${passkeyId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  }).catch(() => {
    throw new WebAuthnError("network", "Unable to reach the server.");
  });

  if (!response.ok) {
    throw new WebAuthnError(
      "api",
      `Failed to delete passkey (status ${response.status}).`,
    );
  }
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

const TOKEN_KEY = "brigid.token";
const USER_ID_KEY = "brigid.user_id";

export function storeAuth(token: string, userId: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_ID_KEY, userId);
}

export function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function loadUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}
