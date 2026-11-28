/**
 * Attributes: what an identity can share with an application, as plain data
 * so that the rules are tested without a browser.
 *
 * An attribute is not a label. The name, the icon and the description of an
 * identity are for the person; an attribute goes to an application once the
 * person accepted to share it, with the value they saw.
 */
import type { MessageId } from "~/i18n/messages";
import type { AuthorizationRequest, Identity } from "./api-types";

/** Every attribute, in the order they are shown in. Mirrors `Attribute` in
 * `brigid-identity/src/attributes.rs`. */
export const ATTRIBUTES = [
  "given_name",
  "family_name",
  "preferred_username",
  "email",
  "locale",
  "zoneinfo",
] as const;

export type AttributeName = (typeof ATTRIBUTES)[number];
export type Attributes = Partial<Record<AttributeName, string>>;

export function isAttribute(name: string): name is AttributeName {
  return (ATTRIBUTES as readonly string[]).includes(name);
}

const LABELS: Record<AttributeName, MessageId> = {
  given_name: "attribute.given-name",
  family_name: "attribute.family-name",
  preferred_username: "attribute.preferred-username",
  email: "attribute.email",
  locale: "attribute.locale",
  zoneinfo: "attribute.zoneinfo",
};

/** The name of an attribute, for a person. */
export function attributeLabel(name: AttributeName): MessageId {
  return LABELS[name];
}

/** What a browser knows to fill each field with. */
export const AUTOCOMPLETE: Record<AttributeName, string> = {
  given_name: "given-name",
  family_name: "family-name",
  preferred_username: "nickname",
  email: "email",
  locale: "language",
  zoneinfo: "off",
};

/** What this device suggests for an attribute: its language, its time zone,
 * nothing for the others. Browser only. */
export function deviceValue(name: AttributeName): string {
  try {
    if (name === "locale") return navigator.language ?? "";
    if (name === "zoneinfo") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    }
  } catch {
    // No suggestion: the field stays empty.
  }
  return "";
}

/**
 * The mailbox an address delivers to, as far as can be told without asking
 * its provider: lower case, and without the `+tag` many providers ignore.
 * `Ada+work@Example.org` and `ada@example.org` are one mailbox.
 */
export function mailbox(email: string): string {
  const address = email.trim().toLowerCase();
  const at = address.lastIndexOf("@");
  if (at < 1) return address;
  return `${address.slice(0, at).replace(/\+.*$/, "")}${address.slice(at)}`;
}

/**
 * The other identities of the account whose address delivers to the same
 * mailbox as `email`: sharing it through two identities tells applications
 * that they are one person.
 */
export function identitiesSharingMailbox(
  identities: readonly Identity[],
  identityId: string,
  email: string,
): Identity[] {
  if (!email.trim()) return [];
  const wanted = mailbox(email);
  return identities.filter(
    (i) =>
      i.id !== identityId &&
      i.attributes.email !== undefined &&
      mailbox(i.attributes.email) === wanted,
  );
}

/** One line of what an application asks for, for one identity. */
export interface AskedRow {
  name: AttributeName;
  /** The application cannot work without it. */
  required: boolean;
  /** The value that would be sent; `null` when the identity has none. */
  value: string | null;
  /** What the person decided before, about this value: accepted, refused,
   * or nothing yet. */
  decided: "accepted" | "refused" | null;
}

/** What `request` asks for, as it stands for identity `identityId`.
 * Attributes this interface does not know are left out: it could not name
 * them to the person. */
export function askedRows(
  request: AuthorizationRequest,
  identityId: string | null,
): AskedRow[] {
  const identity = request.identities.find((i) => i.id === identityId);
  const decisions = (identityId && request.decisions[identityId]) || {};
  return request.asked.flatMap((asked) => {
    if (!isAttribute(asked.name)) return [];
    const decision = decisions[asked.name];
    return [
      {
        name: asked.name,
        required: asked.required,
        value: identity?.attributes[asked.name] ?? null,
        decided:
          decision === undefined ? null : decision ? "accepted" : "refused",
      },
    ];
  });
}

/** The optional attributes shared when an identity is shown: all the ones it
 * has, but those the person refused before for this application. A required
 * attribute is not a choice: it is always sent (`toShare`). */
export function sharedAtFirst(rows: readonly AskedRow[]): AttributeName[] {
  return rows
    .filter(
      (row) => !row.required && row.value !== null && row.decided !== "refused",
    )
    .map((row) => row.name);
}

/** The required attributes the identity lacks: they stop the sign-in until
 * they are added, or another identity is chosen. */
export function blocking(rows: readonly AskedRow[]): AttributeName[] {
  return rows
    .filter((row) => row.required && row.value === null)
    .map((row) => row.name);
}

/** What is sent with the answer, of what the identity has: every required
 * attribute, and the optional ones left shared. */
export function toShare(
  rows: readonly AskedRow[],
  shared: readonly string[],
): AttributeName[] {
  return rows
    .filter(
      (row) =>
        row.value !== null && (row.required || shared.includes(row.name)),
    )
    .map((row) => row.name);
}
