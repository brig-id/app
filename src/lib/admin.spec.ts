import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmed, invitationAddress } from "./admin";
import { ApiError } from "./api";
import * as webauthn from "./webauthn";

afterEach(() => {
  vi.restoreAllMocks();
});

const asked = () =>
  new ApiError(403, "confirm with your passkey", null, "confirmation_required");

describe("an administrative change", () => {
  it("goes through when the session was confirmed a moment ago", async () => {
    const ceremony = vi.spyOn(webauthn, "confirmPresence");
    const change = vi.fn<() => Promise<string>>().mockResolvedValue("done");
    await expect(confirmed(change)).resolves.toBe("done");
    expect(change).toHaveBeenCalledTimes(1);
    expect(ceremony).not.toHaveBeenCalled();
  });

  it("asks for the passkey when the server does, then is sent again, once", async () => {
    const ceremony = vi
      .spyOn(webauthn, "confirmPresence")
      .mockResolvedValue(undefined);
    const change = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(asked())
      .mockResolvedValueOnce("done");
    await expect(confirmed(change)).resolves.toBe("done");
    expect(ceremony).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(2);
  });

  it("is not made when the person does not confirm", async () => {
    vi.spyOn(webauthn, "confirmPresence").mockRejectedValue(
      new webauthn.WebAuthnError("browser", "cancelled"),
    );
    const change = vi.fn<() => Promise<string>>().mockRejectedValue(asked());
    await expect(confirmed(change)).rejects.toBeInstanceOf(
      webauthn.WebAuthnError,
    );
    expect(change).toHaveBeenCalledTimes(1);
  });

  it("does not loop if the server still asks after the ceremony", async () => {
    const ceremony = vi
      .spyOn(webauthn, "confirmPresence")
      .mockResolvedValue(undefined);
    const change = vi.fn<() => Promise<string>>().mockRejectedValue(asked());
    await expect(confirmed(change)).rejects.toMatchObject({
      code: "confirmation_required",
    });
    expect(ceremony).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(2);
  });

  it("leaves any other refusal alone", async () => {
    const ceremony = vi.spyOn(webauthn, "confirmPresence");
    const change = vi.fn<() => Promise<string>>().mockRejectedValue(new ApiError(409, "conflict"));
    await expect(confirmed(change)).rejects.toMatchObject({ status: 409 });
    expect(ceremony).not.toHaveBeenCalled();
  });
});

describe("an invitation", () => {
  it("is an address of the sign-up page", () => {
    expect(invitationAddress("https://id.example.org", "a_b-c")).toBe(
      "https://id.example.org/signup/#invitation=a_b-c",
    );
  });
});
