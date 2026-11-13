/**
 * Mirrors the Rust structs in `brigid-api/src/routes/auth.rs`.
 * Field names match the wire format exactly (serde defaults to snake_case
 * unless a struct carries `#[serde(rename_all = "camelCase")]`, as the
 * webauthn-rs proto types do for the WebAuthn challenge/credential payloads).
 */

// -- WebAuthn browser payloads (standard W3C JSON shapes, base64url-encoded) --

export interface PublicKeyCredentialCreationOptionsJSON {
  rp: { id?: string; name: string };
  user: { id: string; name: string; displayName: string };
  challenge: string;
  pubKeyCredParams: Array<{ type: "public-key"; alg: number }>;
  timeout?: number;
  excludeCredentials?: Array<{
    id: string;
    type: "public-key";
    transports?: string[];
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    requireResidentKey?: boolean;
    userVerification?: string;
  };
  attestation?: string;
}

export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: Array<{
    id: string;
    type: "public-key";
    transports?: string[];
  }>;
  userVerification?: string;
}

export interface RegisterPublicKeyCredentialJSON {
  id: string;
  rawId: string;
  type: "public-key";
  response: {
    attestationObject: string;
    clientDataJSON: string;
    transports?: string[];
  };
  clientExtensionResults: Record<string, unknown>;
}

export interface PublicKeyCredentialJSON {
  id: string;
  rawId: string;
  type: "public-key";
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle?: string;
  };
  clientExtensionResults: Record<string, unknown>;
}

// -- /auth/register --

export interface BeginRegisterRequest {
  /** `username@server`. Absent: the server generates a hidden username. */
  username?: string;
}

export interface BeginRegisterResponse {
  session_id: string;
  challenge: { publicKey: PublicKeyCredentialCreationOptionsJSON };
}

export interface FinishRegisterRequest {
  session_id: string;
  credential: RegisterPublicKeyCredentialJSON;
  /** Optional human-readable passkey name. */
  label?: string;
}

// -- /auth/login --

export interface BeginLoginRequest {
  /** Absent: username-less login (discoverable credential). */
  username?: string;
}

export interface BeginLoginResponse {
  session_id: string;
  challenge: {
    publicKey: PublicKeyCredentialRequestOptionsJSON;
    mediation?: string;
  };
}

export interface FinishLoginRequest {
  session_id: string;
  credential: PublicKeyCredentialJSON;
}

// -- /auth/passkeys --

export interface PasskeySummary {
  id: string;
  label: string | null;
}

export interface RenamePasskeyRequest {
  /** Empty removes the label. */
  label: string;
}

// -- recovery (ADR-004) --

export interface BeginRecoveryRequest {
  code: string;
}

export interface RecoveryCodeResponse {
  /** Shown once; the server keeps only a verifier. */
  code: string;
}

export interface RecoveryStatus {
  /** When the current code was created; null when there is none. */
  code_created_at: string | null;
  /** When a code last recovered the account. */
  last_used_at: string | null;
}

// -- /auth/session --

export interface SessionResponse {
  /** Unix time the session ends if unused (each request pushes it back). */
  idle_expires_at: number;
  /** Unix time the session ends in any case. */
  expires_at: number;
}

// -- /auth/server --

export interface ServerInfo {
  /** Whether this server accepts new accounts. */
  sign_up: boolean;
}

// -- /account/identities --

export interface Identity {
  id: string;
  name: string;
  /** `icon:<style>:<name>` */
  logo: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdentityTemplate {
  key: string;
  name: string;
  logo: string;
  description: string;
}

export interface CreateIdentityRequest {
  template?: string;
  name?: string;
  logo?: string;
  description?: string;
}

export interface UpdateIdentityRequest {
  name?: string;
  logo?: string;
  /** Empty clears it. */
  description?: string;
}

// -- errors --

export interface ApiErrorBody {
  error: string;
}

// -- authorization requests of relying parties (ADR-005 §2) -------------------

/** What the linking page shows for a request. Mirrors `RequestView` in
 * `brigid-api/src/routes/authorize.rs`. */
export interface AuthorizationRequest {
  /** The site, by the name it was registered with. */
  client: { name: string };
  signed_in: boolean;
  /** A passkey ceremony is needed before answering. */
  must_sign_in: boolean;
  /** The site asked for an answer without any page (`prompt=none`). */
  silent: boolean;
  /** The site asked for the choice to be shown even if one is remembered. */
  force_choice: boolean;
  /** Empty until signed in. Names and logos are for the person only: the
   * site receives none of this. */
  identities: Identity[];
  /** The identity last presented to this site. */
  chosen: string | null;
}

/** Where to send the browser next. */
export interface AuthorizationAnswer {
  redirect_to: string;
}
