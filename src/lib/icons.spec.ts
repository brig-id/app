import { describe, expect, it } from "vitest";
import { LOGO_ICONS } from "~/components/ui/icons.gen";
import { MESSAGES } from "~/i18n/messages";
import { DEFAULT_LOGO, ICON_GROUPS, LOGO_NAMES, logoName, logoRef } from "./icons";

describe("logo library", () => {
  it("only holds references the server accepts (icon:ph:<name>)", () => {
    for (const name of LOGO_NAMES) {
      expect(logoRef(name)).toMatch(/^icon:ph:[a-z0-9-]{1,64}$/);
    }
  });

  it("has no duplicates", () => {
    expect(new Set(LOGO_NAMES).size).toBe(LOGO_NAMES.length);
  });

  it("has a drawing and a name in both languages for every logo", () => {
    for (const name of LOGO_NAMES) {
      expect(LOGO_ICONS[name], name).toBeTruthy();
      expect(MESSAGES).toHaveProperty([`icon.${name}`]);
    }
    for (const group of ICON_GROUPS) {
      expect(MESSAGES).toHaveProperty([`icons.group.${group.key}`]);
    }
  });

  it("covers the logo of every template of the server", () => {
    // `brigid-identity/src/templates.rs` in `core`.
    for (const name of [
      "user",
      "briefcase",
      "code",
      "palette",
      "house-line",
      "globe-hemisphere-west",
      "detective",
    ]) {
      expect(LOGO_NAMES).toContain(name);
    }
    expect(logoName(DEFAULT_LOGO)).toBe("user");
  });

  it("reads a reference, and nothing else", () => {
    expect(logoName("icon:ph:briefcase")).toBe("briefcase");
    // The form references had before Phosphor: not a logo of the library.
    expect(logoName("icon:solid:briefcase")).toBeNull();
    expect(logoName("icon:ph:not-in-the-library")).toBeNull();
    expect(logoName("upload:123")).toBeNull();
    expect(logoName('icon:ph:x"><script>')).toBeNull();
  });
});
