import { describe, expect, it } from "vitest";
import { MESSAGES } from "~/i18n/messages";
import { ARCHETYPES, GROUPS } from "./archetypes";

describe("archetypes", () => {
  it("each has its own key and its own icon", () => {
    const keys = ARCHETYPES.map((a) => a.key);
    const logos = ARCHETYPES.map((a) => a.logo);
    expect(new Set(keys).size).toBe(keys.length);
    // The new identity page leaves out an archetype whose icon is in use.
    expect(new Set(logos).size).toBe(logos.length);
  });

  it("each is named and described in both languages, in a known group", () => {
    for (const a of ARCHETYPES) {
      expect(MESSAGES).toHaveProperty([`archetype.${a.key}`]);
      expect(MESSAGES).toHaveProperty([`archetype.${a.key}.about`]);
      expect(GROUPS).toContain(a.group);
    }
    for (const g of GROUPS) {
      expect(MESSAGES).toHaveProperty([`archetypes.group.${g}`]);
    }
  });

  it("the onboarding proposes public, personal and work", () => {
    expect(ARCHETYPES.filter((a) => a.starter).map((a) => a.key)).toEqual([
      "public",
      "personal",
      "work",
    ]);
  });
});
