import { describe, expect, it } from "vitest";
import { looksLikeRecoveryCode, otherServerUrl } from "./validation";

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
