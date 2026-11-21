import type { Identity } from "./api-types";
import { ATTRIBUTES, type AttributeName, mailbox } from "./attributes";

/**
 * The value of an attribute as it would be compared by someone trying to
 * join two identities: e-mail addresses by mailbox (`ada+work@x.org` is
 * `ada@x.org`), anything else trimmed and without case.
 */
export function comparable(name: AttributeName, value: string): string {
  return name === "email" ? mailbox(value) : value.trim().toLowerCase();
}

/** Identities that carry the same value of one attribute. */
export interface SameValue {
  name: AttributeName;
  /** The identities, in the account's order; at least two. */
  identities: Identity[];
}

/**
 * Where two identities or more carry the same value: an application that
 * receives that value from both can tell they are the same person. Locale
 * and time zone are left out: many people share them, they tell little.
 */
export function sameValues(identities: readonly Identity[]): SameValue[] {
  const found: SameValue[] = [];
  for (const name of ATTRIBUTES) {
    if (name === "locale" || name === "zoneinfo") continue;
    const groups = new Map<string, Identity[]>();
    for (const identity of identities) {
      const value = identity.attributes[name];
      if (value === undefined || !value.trim()) continue;
      const key = comparable(name, value);
      groups.set(key, [...(groups.get(key) ?? []), identity]);
    }
    for (const group of groups.values()) {
      if (group.length > 1) found.push({ name, identities: group });
    }
  }
  return found;
}

/** Whether `identity`'s value of `name` is shared with another identity. */
export function isShared(
  same: readonly SameValue[],
  name: AttributeName,
  identity: Identity,
): boolean {
  return same.some(
    (s) => s.name === name && s.identities.some((i) => i.id === identity.id),
  );
}
