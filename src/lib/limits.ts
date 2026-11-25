/**
 * The limits of a server: what one account, or one network address, may do.
 * The server holds them and enforces them; an administrator changes them,
 * between 1 and a maximum the server sets. The interface knows the words for
 * some; a limit it has no words for is shown by its name.
 */
import type { Message, MessageId } from "~/i18n";
import type { ServerLimit } from "./api-types";
import type { LimitReached } from "./refusal";

interface LimitWords {
  /** Its name, as a field's label. */
  label: MessageId;
  /** What it protects. */
  about: MessageId;
  /** Said to a person who reached it, with its value as `{count}`. */
  reached: MessageId;
  /** The same, when the value is 1. */
  reachedOne: MessageId;
}

export const LIMIT_WORDS: Readonly<Record<string, LimitWords>> = {
  identities_per_account: {
    label: "limit.identities_per_account",
    about: "limit.identities_per_account.about",
    reached: "limit.identities_per_account.reached",
    reachedOne: "limit.identities_per_account.reached.one",
  },
  passkeys_per_account: {
    label: "limit.passkeys_per_account",
    about: "limit.passkeys_per_account.about",
    reached: "limit.passkeys_per_account.reached",
    reachedOne: "limit.passkeys_per_account.reached.one",
  },
  sign_ups_per_ip_per_day: {
    label: "limit.sign_ups_per_ip_per_day",
    about: "limit.sign_ups_per_ip_per_day.about",
    reached: "limit.sign_ups_per_ip_per_day.reached",
    reachedOne: "limit.sign_ups_per_ip_per_day.reached.one",
  },
};

/** The words for a limit, or `null` for one this interface does not know. */
export function limitWords(name: string): LimitWords | null {
  return Object.hasOwn(LIMIT_WORDS, name) ? LIMIT_WORDS[name]! : null;
}

/** What to tell a person whose request reached a limit. A limit the
 * interface does not know, or one whose value the server did not give, is
 * said in general words. */
export function limitReachedMessage(limit: LimitReached): Message {
  const words = limitWords(limit.name);
  if (words === null || limit.value === null) {
    return { id: "limit.reached" };
  }
  if (limit.value === 1) return { id: words.reachedOne };
  return { id: words.reached, p: { count: limit.value } };
}

/** The value typed in a field, if it is one the server takes: a whole
 * number from 1 to the limit's maximum. */
export function parseLimit(text: string, max: number): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return value >= 1 && value <= max ? value : null;
}

/** What a form of limits asks the server to change: the limits whose
 * field holds another value than the server's, and the fields that hold
 * none it would take. A field left out of `typed` is unchanged. */
export function limitChanges(
  limits: readonly ServerLimit[],
  typed: Readonly<Record<string, string>>,
): { changes: Record<string, number>; invalid: string[] } {
  const changes: Record<string, number> = {};
  const invalid: string[] = [];
  for (const limit of limits) {
    if (!Object.hasOwn(typed, limit.name)) continue;
    const value = parseLimit(typed[limit.name]!, limit.max);
    if (value === null) invalid.push(limit.name);
    else if (value !== limit.value) changes[limit.name] = value;
  }
  return { changes, invalid };
}

/** The fields of a form of limits, as the server holds them. */
export function limitFields(
  limits: readonly ServerLimit[],
): Record<string, string> {
  return Object.fromEntries(limits.map((l) => [l.name, String(l.value)]));
}
