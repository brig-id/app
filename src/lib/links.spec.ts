import { describe, expect, it } from "vitest";
import { linkAddress, linkIn } from "./links";

describe("a link that carries a secret", () => {
  it("carries it in the fragment, which a browser never sends", () => {
    const address = linkAddress(
      "https://id.example.org",
      "/signup/",
      "invitation",
      "a_b-c",
    );
    expect(address).toBe("https://id.example.org/signup/#invitation=a_b-c");
    const url = new URL(address);
    expect(url.search).toBe("");
    expect(linkIn(url.hash, "invitation")).toBe("a_b-c");
  });

  it("is read by its name, and by no other", () => {
    expect(linkIn("#link=abc", "link")).toBe("abc");
    expect(linkIn("#link=abc", "invitation")).toBeNull();
    expect(linkIn("", "link")).toBeNull();
    expect(linkIn("#link=", "link")).toBeNull();
    expect(linkIn("#content", "link")).toBeNull();
  });
});
