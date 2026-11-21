import { describe, expect, it } from "vitest";
import { HUES, hueAt, hueOf } from "./hues";

describe("hues", () => {
  it("go round the six colours in order", () => {
    expect(HUES.map((_, i) => hueAt(i))).toEqual([...HUES]);
    expect(hueAt(6)).toBe("amber");
    expect(hueAt(-1)).toBe("green");
  });
  it("follow an identity's place among the account's", () => {
    expect(hueOf(["a", "b", "c"], "c")).toBe("rose");
    expect(hueOf(["a"], "unknown")).toBe("amber");
  });
});
