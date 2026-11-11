import { describe, expect, it } from "vitest";
import { aaguidFromAuthenticatorData, providerName } from "./aaguid";

function authData(aaguid: number[], flags = 0x45): ArrayBuffer {
  const bytes = new Uint8Array(53 + 2);
  bytes[32] = flags;
  bytes.set(aaguid, 37);
  return bytes.buffer;
}

const ONE_PASSWORD = [
  0xba, 0xda, 0x55, 0x66, 0xa7, 0xaa, 0x40, 0x1f, 0xbd, 0x96, 0x45, 0x61, 0x9a,
  0x55, 0x12, 0x0d,
];

describe("aaguid", () => {
  it("reads the AAGUID of attested credential data", () => {
    expect(aaguidFromAuthenticatorData(authData(ONE_PASSWORD))).toBe(
      "bada5566-a7aa-401f-bd96-45619a55120d",
    );
  });

  it("finds no AAGUID without the AT flag or in short data", () => {
    expect(aaguidFromAuthenticatorData(authData(ONE_PASSWORD, 0x05))).toBeNull();
    expect(aaguidFromAuthenticatorData(new ArrayBuffer(37))).toBeNull();
  });

  it("names known providers only", () => {
    expect(providerName("bada5566-a7aa-401f-bd96-45619a55120d")).toBe("1Password");
    expect(providerName("BADA5566-A7AA-401F-BD96-45619A55120D")).toBe("1Password");
    expect(providerName("00000000-0000-0000-0000-000000000000")).toBeNull();
    expect(providerName(null)).toBeNull();
  });
});
