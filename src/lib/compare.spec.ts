import { describe, expect, it } from "vitest";
import type { Identity } from "./api-types";
import { isShared, sameValues } from "./compare";

const identity = (id: string, attributes: Identity["attributes"]): Identity =>
  ({ id, name: id, logo: "user", attributes }) as unknown as Identity;

describe("sameValues", () => {
  it("finds an address shared through two identities, tags and case aside", () => {
    const a = identity("a", { email: "Ada+work@Example.org", given_name: "Ada" });
    const b = identity("b", { email: "ada@example.org" });
    const c = identity("c", { email: "other@example.org", given_name: " ada " });
    const same = sameValues([a, b, c]);
    expect(same.map((s) => [s.name, s.identities.map((i) => i.id)])).toEqual([
      ["given_name", ["a", "c"]],
      ["email", ["a", "b"]],
    ]);
    expect(isShared(same, "email", a)).toBe(true);
    expect(isShared(same, "email", c)).toBe(false);
  });

  it("leaves out language and time zone, and empty values", () => {
    const a = identity("a", { locale: "fr", zoneinfo: "Europe/Paris", email: " " });
    const b = identity("b", { locale: "fr", zoneinfo: "Europe/Paris", email: " " });
    expect(sameValues([a, b])).toEqual([]);
  });
});
