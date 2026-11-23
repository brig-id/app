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
  /** A setup link or an invitation, when the server asks for one. */
  link?: string;
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

/** Empty: signing in sends no username, the passkey names the account. */
export type BeginLoginRequest = Record<string, never>;

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
  /** Whether the account has a recovery code. Without one it is still in
   * its onboarding: identities and applications are closed to it. */
  recovery_code: boolean;
  /** Whether the account is an administrator of this server. */
  admin: boolean;
  /** Unix time of the latest passkey ceremony done in this session. */
  confirmed_at: number;
}

// -- /auth/server --

export type SignupPolicy = "open" | "invitation" | "closed";

export interface ServerInfo {
  /** Whether anyone can create an account here, without a link. */
  sign_up: boolean;
  /** Who may create an account. */
  policy: SignupPolicy;
  /** The program the server is (`seedling`), and its version. Absent from
   * a server older than the question. */
  edition?: string | null;
  version?: string | null;
}

// -- /account/identities --

export interface Identity {
  id: string;
  name: string;
  /** `icon:<style>:<name>` */
  logo: string;
  description: string | null;
  /** What the identity can share, claim name to value. An attribute
   * without a value is absent. */
  attributes: Partial<Record<string, string>>;
  created_at: string;
  updated_at: string;
}

export interface IdentityTemplate {
  /** The group it is shown in: `everyday`, `work`, `leisure`, `online`
   * (absent from a server older than core#121). */
  group?: string;
  key: string;
  name: string;
  logo: string;
  description: string;
  /** One of the identities the onboarding proposes to a new account. */
  starter: boolean;
}

export interface CreateIdentityRequest {
  template?: string;
  name?: string;
  logo?: string;
  description?: string;
  attributes?: Record<string, string>;
}

export interface UpdateIdentityRequest {
  name?: string;
  logo?: string;
  /** Empty clears it. */
  description?: string;
  /** The attributes to change: a value sets one, an empty value removes
   * it, the ones left out stay. */
  attributes?: Record<string, string>;
}

/** What an identity gave one application. Mirrors `ApplicationView` in
 * `brigid-api/src/routes/identities.rs`. Dates are Unix seconds. */
export interface IdentityApplication {
  client_id: string;
  /** The name the application is registered under. */
  name: string;
  linked_at: number;
  last_used_at: number;
  /** What the person accepted to share, with the value accepted. */
  shared: Array<{ name: string; value: string; since: number }>;
  /** What the person refused to share. */
  refused: string[];
}

// -- authorization requests of relying parties (ADR-005 §2) -------------------

/** What the linking page shows for a request. Mirrors `RequestView` in
 * `brigid-api/src/routes/authorize.rs`. */
export interface AuthorizationRequest {
  /** The site, by the name it was registered with. */
  client: {
    /** The name it was registered with, or the one its document declares. */
    name: string;
    /** A site that describes itself: the host of its `client_id`. Shown
     * first and always, since anyone can declare any name. */
    host?: string;
    /** Its logo, only for a site the server's operator accepted. */
    logo?: string;
  };
  signed_in: boolean;
  /** A passkey ceremony is needed before answering. */
  must_sign_in: boolean;
  /** The site asked for an answer without any page (`prompt=none`). */
  silent: boolean;
  /** The site asked for the choice to be shown even if one is remembered. */
  force_choice: boolean;
  /** The account has no recovery code yet: it finishes its onboarding
   * before it can present an identity anywhere. */
  needs_recovery_code: boolean;
  /** Empty until signed in. Names and logos are for the person only: the
   * site receives none of this. */
  identities: Identity[];
  /** The identity last presented to this site. */
  chosen: string | null;
  /** The attributes the site asks for. Empty when it asks for the
   * identifier only. */
  asked: Array<{ name: string; required: boolean }>;
  /** Per identity, what the person already decided about the attributes
   * asked for: `true` when they accepted the value the identity has now,
   * `false` when they refused. Absent: undecided. */
  decisions: Partial<Record<string, Partial<Record<string, boolean>>>>;
}

/** Where to send the browser next. */
export interface AuthorizationAnswer {
  redirect_to: string;
}

// -- administration (`brigid-api/src/routes/admin.rs`) ------------------------

/** An account as an administrator sees it. Nothing of its identities. */
export interface AdminAccount {
  id: string;
  /** The generated username: what the person's passkey manager shows. */
  username: string;
  created_at: string;
  admin: boolean;
  /** Unix seconds since when it is suspended. */
  suspended_at: number | null;
  /** Unix seconds. */
  last_sign_in_at: number | null;
  passkeys: number;
  recovery_code: boolean;
  /** The account of this session. */
  own: boolean;
}

export type Need = "required" | "optional";

export interface AdminApplication {
  client_id: string;
  name: string;
  redirect_uris: string[];
  confidential: boolean;
  /** What it may ask people to share: claim name to need. */
  attributes: Partial<Record<string, Need>>;
  /** Unix seconds. */
  created_at: number;
  /** It describes itself in a document it publishes: nobody registered it. */
  described?: boolean;
  /** For such an application: the host of its `client_id`. */
  host?: string;
}

/** Which websites that describe themselves the server accepts. Mirrors
 * `DescribedView` in `brigid-api/src/routes/admin.rs`. */
export type DescribedPolicy = "open" | "listed" | "registered";
export interface DescribedSettings {
  policy: DescribedPolicy;
  /** `client_id`s (document URLs) accepted under `listed`. */
  accepted: string[];
  /** `client_id`s never accepted. */
  refused: string[];
  /** The attributes such a website may ask for, at most. */
  attributes: string[];
}

export interface RegisteredApplication extends AdminApplication {
  /** Shown once: the server keeps only its hash. */
  client_secret: string | null;
}

export interface Invitation {
  id: string;
  uses_left: number;
  /** Unix seconds. */
  created_at: number;
  /** Unix seconds. */
  expires_at: number;
}

export interface NewInvitation extends Invitation {
  /** What goes in the address given to the people invited. Shown once. */
  link: string;
}

export interface SignupSettings {
  policy: SignupPolicy;
  invitations: Invitation[];
}

export interface AdminLogEntry {
  /** Unix seconds. */
  at: number;
  action: string;
  by: "machine" | "administrator" | "deleted";
  by_username: string | null;
  about_account: boolean;
  account_username: string | null;
  detail: string | null;
}
