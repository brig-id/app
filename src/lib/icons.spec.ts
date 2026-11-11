import { describe, expect, it } from "vitest";
import { ALL_ICONS, logoLabel, parseLogo } from "./icons";

describe("icon library", () => {
  it("only holds refs the server accepts (icon:<style>:<name>)", () => {
    for (const icon of ALL_ICONS) {
      expect(icon.ref).toMatch(/^icon:[a-z0-9-]{1,32}:[a-z0-9-]{1,64}$/);
    }
  });

  it("has no duplicates", () => {
    const refs = ALL_ICONS.map((i) => i.ref);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("covers every server template's logo", () => {
    for (const ref of [
      "icon:solid:user",
      "icon:solid:briefcase",
      "icon:solid:code",
      "icon:solid:palette",
      "icon:solid:people-roof",
      "icon:solid:globe",
      "icon:solid:user-secret",
    ]) {
      expect(ALL_ICONS.some((i) => i.ref === ref)).toBe(true);
    }
  });

  it("maps refs to wa-icon attributes", () => {
    expect(parseLogo("icon:solid:briefcase")).toEqual({
      name: "briefcase",
      variant: "solid",
    });
    expect(parseLogo("icon:brands:github")).toEqual({
      name: "github",
      family: "brands",
    });
    expect(parseLogo("upload:123")).toBeNull();
    expect(parseLogo("icon:Solid:x")).toBeNull();
  });

  it("labels refs", () => {
    expect(logoLabel("icon:solid:briefcase")).toBe("Briefcase");
    expect(logoLabel("icon:solid:unknown-one")).toBe("unknown-one");
  });
});
