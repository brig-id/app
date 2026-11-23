import type { Identity } from "./api-types";
import type { AttributeName } from "./attributes";

/** Something an identity could have, and does not yet, or has otherwise. */
export interface Suggestion {
  name: AttributeName;
  value: string;
  /** `set`: the identity has none; `change`: it has another value. */
  kind: "set" | "change";
  /** Where the value comes from: this device, or another identity. */
  from: { device: true } | { identity: string };
}

/** What this device says, for the attributes it knows. */
export interface Device {
  locale: string;
  zoneinfo: string;
}

/** The key under which a suggestion is remembered as ignored. */
export function suggestionKey(identity: Identity, s: Suggestion): string {
  return `${identity.id}:${s.name}:${s.value}`;
}

/**
 * What the summary of `identity` proposes, `ignored` left out:
 *
 * - its language and time zone from this device, when it has none, or the
 *   time zone when it differs (a move, a trip);
 * - a first or last name another identity carries, when it has none; said
 *   as coming from that identity, since the same value in two identities
 *   helps to link them (Compare says so).
 */
export function suggestions(
  identity: Identity,
  all: readonly Identity[],
  device: Device,
  ignored: ReadonlySet<string>,
): Suggestion[] {
  const found: Suggestion[] = [];
  const has = (name: AttributeName) => identity.attributes[name];
  for (const name of ["locale", "zoneinfo"] as const) {
    const value = device[name].trim();
    if (!value) continue;
    const current = has(name);
    if (current === undefined) {
      found.push({ name, value, kind: "set", from: { device: true } });
    } else if (name === "zoneinfo" && current !== value) {
      found.push({ name, value, kind: "change", from: { device: true } });
    }
  }
  for (const name of ["given_name", "family_name"] as const) {
    if (has(name) !== undefined) continue;
    const other = all.find(
      (i) => i.id !== identity.id && (i.attributes[name] ?? "").trim() !== "",
    );
    if (other) {
      found.push({
        name,
        value: other.attributes[name]!.trim(),
        kind: "set",
        from: { identity: other.name },
      });
    }
  }
  return found.filter((s) => !ignored.has(suggestionKey(identity, s)));
}

const STORAGE = "brigid.ignored-suggestions";

/** The suggestions this browser was told to ignore. */
export function ignoredSuggestions(): Set<string> {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(STORAGE) ?? "[]");
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
}

export function ignoreSuggestion(key: string): void {
  try {
    const set = ignoredSuggestions();
    set.add(key);
    localStorage.setItem(STORAGE, JSON.stringify([...set].slice(-200)));
  } catch {
    // Not remembered: it comes back next time.
  }
}
