import { describe, expect, it } from "vitest";
import type { Identity } from "./api-types";
import { suggestionKey, suggestions } from "./suggestions";

const identity = (id: string, name: string, attributes: Identity["attributes"]): Identity =>
  ({ id, name, logo: "icon:ph:user", attributes }) as unknown as Identity;
const device = { locale: "fr-FR", zoneinfo: "Europe/Paris" };

describe("suggestions", () => {
  it("propose the device's language and time zone when missing", () => {
    const a = identity("a", "Work", {});
    expect(suggestions(a, [a], device, new Set())).toEqual([
      { name: "locale", value: "fr-FR", kind: "set", from: { device: true } },
      { name: "zoneinfo", value: "Europe/Paris", kind: "set", from: { device: true } },
    ]);
  });

  it("propose to change a time zone that is not the device's, never the language", () => {
    const a = identity("a", "Work", { locale: "en", zoneinfo: "America/New_York" });
    expect(suggestions(a, [a], device, new Set())).toEqual([
      { name: "zoneinfo", value: "Europe/Paris", kind: "change", from: { device: true } },
    ]);
  });

  it("propose a name another identity has, and say which", () => {
    const a = identity("a", "Work", { locale: "fr-FR", zoneinfo: "Europe/Paris" });
    const b = identity("b", "Personal", { given_name: " Bérenger " });
    expect(suggestions(a, [a, b], device, new Set())).toEqual([
      { name: "given_name", value: "Bérenger", kind: "set", from: { identity: "Personal" } },
    ]);
  });

  it("leave out what was ignored", () => {
    const a = identity("a", "Work", { zoneinfo: "Europe/Paris" });
    const [first] = suggestions(a, [a], device, new Set());
    const ignored = new Set([suggestionKey(a, first!)]);
    expect(suggestions(a, [a], device, ignored)).toEqual([]);
  });
});
