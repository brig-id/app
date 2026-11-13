import { describe, expect, it } from "vitest";
import {
  isValidHandle,
  looksLikeRecoveryCode,
  otherServerUrl,
  parseLoginInput,
} from "./validation";

describe("isValidHandle", () => {
  it("accepts a well-formed handle", () => {
    expect(isValidHandle("alice@example.com")).toBe(true);
  });

  it("accepts hyphens and underscores in the username", () => {
    expect(isValidHandle("al-ice_2@example.com")).toBe(true);
  });

  it("rejects a missing @", () => {
    expect(isValidHandle("alice.example.com")).toBe(false);
  });

  it("rejects multiple @", () => {
    expect(isValidHandle("alice@ex@ample.com")).toBe(false);
  });

  it("rejects a username shorter than 3 characters", () => {
    expect(isValidHandle("ab@example.com")).toBe(false);
  });

  it("rejects a username made entirely of underscores", () => {
    expect(isValidHandle("___@example.com")).toBe(false);
  });

  it("rejects a server label starting with a hyphen", () => {
    expect(isValidHandle("alice@-example.com")).toBe(false);
  });

  it("rejects an empty server", () => {
    expect(isValidHandle("alice@")).toBe(false);
  });
});

describe("parseLoginInput", () => {
  it("treats a bare username as local to the current server", () => {
    expect(parseLoginInput("alice", "example.com")).toEqual({
      kind: "local",
      username: "alice",
      server: "example.com",
    });
  });

  it("treats a handle matching the current server as local", () => {
    expect(parseLoginInput("alice@example.com", "example.com")).toEqual({
      kind: "local",
      username: "alice",
      server: "example.com",
    });
  });

  it("compares the server case-insensitively", () => {
    expect(parseLoginInput("alice@Example.com", "example.com")).toEqual({
      kind: "local",
      username: "alice",
      server: "Example.com",
    });
  });

  it("treats a handle for a different server as remote", () => {
    expect(parseLoginInput("alice@other.example", "example.com")).toEqual({
      kind: "remote",
      username: "alice",
      server: "other.example",
    });
  });

  it("rejects an invalid bare username", () => {
    expect(parseLoginInput("ab", "example.com")).toEqual({ kind: "invalid" });
  });

  it("rejects a malformed handle", () => {
    expect(parseLoginInput("alice@ex@ample.com", "example.com")).toEqual({
      kind: "invalid",
    });
  });
});

describe("otherServerUrl", () => {
  it("sends the browser to another server's sign-in page", () => {
    expect(otherServerUrl("id.example.org", "helm.brig.id")).toBe(
      "https://id.example.org/",
    );
    expect(otherServerUrl(" https://ID.example.org/whatever ", "helm.brig.id")).toBe(
      "https://id.example.org/",
    );
  });

  it("stays here for this server, and refuses what isn't a domain", () => {
    expect(otherServerUrl("Helm.Brig.Id", "helm.brig.id")).toBe("current");
    expect(otherServerUrl("", "helm.brig.id")).toBeNull();
    expect(otherServerUrl("not a domain", "helm.brig.id")).toBeNull();
    expect(otherServerUrl("127.0.0.1", "helm.brig.id")).toBeNull();
  });
});

describe("looksLikeRecoveryCode", () => {
  const code = "ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ23-4567-ABCD-EFGH";

  it("accepts 40 characters, however they are separated or cased", () => {
    expect(looksLikeRecoveryCode(code)).toBe(true);
    expect(looksLikeRecoveryCode(code.toLowerCase())).toBe(true);
    expect(looksLikeRecoveryCode(code.replaceAll("-", ""))).toBe(true);
    expect(looksLikeRecoveryCode(` ${code.replaceAll("-", " ")} `)).toBe(true);
  });

  it("refuses anything shorter or longer", () => {
    expect(looksLikeRecoveryCode("AAAA-BBBB")).toBe(false);
    expect(looksLikeRecoveryCode(`${code}-AAAA`)).toBe(false);
    expect(looksLikeRecoveryCode("")).toBe(false);
  });
});
