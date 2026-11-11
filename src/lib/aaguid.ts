/**
 * The passkey provider behind an AAGUID, to pre-fill a new passkey's name
 * (ADR-003, app#36). The AAGUID is in the authenticator data the browser
 * returns at creation; the server can't read it when attestation is `none`.
 *
 * A short list of common providers, checked against the community list
 * (github.com/passkeydeveloper/passkey-authenticator-aaguids, aaguid.json,
 * 2026-11-11). An unknown or all-zero AAGUID gives no name: the user names
 * the passkey on the onboarding page.
 */
const PROVIDERS: Readonly<Record<string, string>> = {
  "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4": "Google Password Manager",
  "adce0002-35bc-c60a-648b-0b25f1f05503": "Chrome on Mac",
  "08987058-cadc-4b81-b6e1-30de50dcbe96": "Windows Hello",
  "9ddd1817-af5a-4672-a2b9-3e3dd95000a9": "Windows Hello",
  "6028b017-b1d4-4c02-b4b3-afcdafc96bb2": "Windows Hello",
  "fbfc3007-154e-4ecc-8c0b-6e020557d7bd": "Apple Passwords",
  "dd4ec289-e01d-41c9-bb89-70fa845d4bf2": "iCloud Keychain (Managed)",
  "bada5566-a7aa-401f-bd96-45619a55120d": "1Password",
  "d548826e-79b4-db40-a3d8-11116f7e8349": "Bitwarden",
  "531126d6-e717-415c-9320-3d9aa6981239": "Dashlane",
  "50726f74-6f6e-5061-7373-50726f746f6e": "Proton Pass",
  "fdb141b2-5d84-443e-8a35-4698c205a502": "KeePassXC",
  "53414d53-554e-4700-0000-000000000000": "Samsung Pass",
  "b84e4048-15dc-4dd0-8640-f4f60813c8af": "NordPass",
  "0ea242b4-43c4-4a1b-8b17-dd6d0b6baec6": "Keeper",
  "b78a0a55-6ef8-d246-a042-ba0f6d55050c": "LastPass",
  "d3452668-01fd-4c12-926c-83a4204853aa": "Microsoft Password Manager",
};

/** Flag of authenticator data: attested credential data (with the AAGUID) follows. */
const ATTESTED_CREDENTIAL_DATA = 0x40;

/**
 * The AAGUID in WebAuthn authenticator data, as a lowercase UUID, or `null`
 * when there is none: `rpIdHash` (32 bytes), flags (1), sign count (4), then,
 * when the AT flag is set, the 16-byte AAGUID.
 */
export function aaguidFromAuthenticatorData(data: ArrayBuffer): string | null {
  const bytes = new Uint8Array(data);
  if (bytes.length < 53 || !((bytes[32] ?? 0) & ATTESTED_CREDENTIAL_DATA)) {
    return null;
  }
  const hex = Array.from(bytes.slice(37, 53), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** The provider's name, or `null` for an unknown or all-zero AAGUID. */
export function providerName(aaguid: string | null): string | null {
  if (!aaguid) return null;
  return PROVIDERS[aaguid.toLowerCase()] ?? null;
}
