import { describe, expect, it } from "vitest";
import type { AuthorizationRequest, Identity } from "./api-types";
import { continueStep, requestErrorMessage } from "./continue";

const identity = (id: string): Identity => ({
  id,
  name: `Identity ${id}`,
  logo: "icon:ph:user",
  description: null,
  created_at: "2026-11-13T00:00:00Z",
  updated_at: "2026-11-13T00:00:00Z",
});

const request = (over: Partial<AuthorizationRequest>): AuthorizationRequest => ({
  client: { name: "Shop" },
  signed_in: true,
  must_sign_in: false,
  silent: false,
  force_choice: false,
  identities: [identity("a"), identity("b")],
  chosen: null,
  ...over,
});

describe("continueStep", () => {
  it("answers a silent request without showing anything, signed in or not", () => {
    expect(continueStep(request({ silent: true }))).toEqual({ kind: "silent" });
    expect(
      continueStep(request({ silent: true, signed_in: false, must_sign_in: true })),
    ).toEqual({ kind: "silent" });
  });

  it("asks for the passkey first when the server says so", () => {
    expect(
      continueStep(request({ signed_in: false, must_sign_in: true, identities: [] })),
    ).toEqual({ kind: "sign-in" });
    // Signed in, but the site wants a fresh ceremony.
    expect(continueStep(request({ must_sign_in: true }))).toEqual({
      kind: "sign-in",
    });
  });

  it("preselects the identity remembered for the site", () => {
    expect(continueStep(request({ chosen: "b" }))).toEqual({
      kind: "choose",
      selected: "b",
    });
  });

  it("picks nothing for the person when several identities exist", () => {
    expect(continueStep(request({}))).toEqual({ kind: "choose", selected: null });
  });

  it("forgets a remembered identity that no longer exists", () => {
    expect(continueStep(request({ chosen: "gone" }))).toEqual({
      kind: "choose",
      selected: null,
    });
  });

  it("selects the only identity there is", () => {
    expect(continueStep(request({ identities: [identity("a")] }))).toEqual({
      kind: "choose",
      selected: "a",
    });
  });
});

describe("requestErrorMessage", () => {
  it("explains the two refusals and falls back for anything else", () => {
    expect(requestErrorMessage("unknown_client")).toBe("continue.unknown-client");
    expect(requestErrorMessage("invalid_redirect_uri")).toBe("continue.bad-redirect");
    expect(requestErrorMessage("<script>")).toBe("continue.invalid");
    expect(requestErrorMessage("")).toBe("continue.invalid");
  });
});
