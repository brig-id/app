import { afterEach, describe, expect, it, vi } from "vitest";
import { format } from "~/i18n";
import { limitsSettings, setLimits } from "./admin";
import { ApiError, createIdentity } from "./api";
import type { ServerLimit } from "./api-types";
import { failure } from "./errors";
import {
  limitChanges,
  limitFields,
  limitReachedMessage,
  parseLimit,
} from "./limits";
import { readRefusal } from "./refusal";
import { WebAuthnError } from "./webauthn";
import * as webauthn from "./webauthn";

const LIMITS: ServerLimit[] = [
  { name: "identities_per_account", value: 20, default: 20, max: 200 },
  { name: "passkeys_per_account", value: 10, default: 10, max: 50 },
  { name: "sign_ups_per_ip_per_day", value: 5, default: 5, max: 1000 },
];

const response = (status: number, body: unknown = "") =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a value typed for a limit", () => {
  it("is a whole number from 1 to the maximum", () => {
    expect(parseLimit("1", 50)).toBe(1);
    expect(parseLimit(" 50 ", 50)).toBe(50);
    expect(parseLimit("0", 50)).toBeNull();
    expect(parseLimit("51", 50)).toBeNull();
    expect(parseLimit("2.5", 50)).toBeNull();
    expect(parseLimit("-3", 50)).toBeNull();
    expect(parseLimit("1e1", 50)).toBeNull();
    expect(parseLimit("", 50)).toBeNull();
  });
});

describe("what the form of limits sends", () => {
  it("is only what changed", () => {
    const typed = {
      ...limitFields(LIMITS),
      identities_per_account: "30",
    };
    expect(limitChanges(LIMITS, typed)).toEqual({
      changes: { identities_per_account: 30 },
      invalid: [],
    });
  });

  it("is nothing when the fields hold what the server does", () => {
    expect(limitChanges(LIMITS, limitFields(LIMITS))).toEqual({
      changes: {},
      invalid: [],
    });
  });

  it("names the fields the server would refuse", () => {
    const typed = {
      ...limitFields(LIMITS),
      passkeys_per_account: "51",
      sign_ups_per_ip_per_day: "",
    };
    expect(limitChanges(LIMITS, typed).invalid).toEqual([
      "passkeys_per_account",
      "sign_ups_per_ip_per_day",
    ]);
  });

  it("takes a limit the interface has no words for", () => {
    const newer = [
      ...LIMITS,
      { name: "applications_per_day", value: 3, default: 3, max: 9 },
    ];
    const typed = { ...limitFields(newer), applications_per_day: "4" };
    expect(limitChanges(newer, typed).changes).toEqual({
      applications_per_day: 4,
    });
  });
});

describe("the limits of the administration", () => {
  it("are read, and changed as a subset, with the passkey when asked", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200, { limits: LIMITS }))
      .mockResolvedValueOnce(
        response(403, {
          error: "confirm with your passkey",
          code: "confirmation_required",
        }),
      )
      .mockResolvedValueOnce(
        response(200, {
          limits: [{ ...LIMITS[0]!, value: 30 }, ...LIMITS.slice(1)],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const ceremony = vi
      .spyOn(webauthn, "confirmPresence")
      .mockResolvedValue(undefined);

    expect((await limitsSettings()).limits).toEqual(LIMITS);
    const after = await setLimits({ identities_per_account: 30 });
    expect(after.limits[0]!.value).toBe(30);
    expect(ceremony).toHaveBeenCalledTimes(1);
    const [path, init] = fetchMock.mock.calls[2]!;
    expect(path).toBe("/admin/limits");
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual({
      identities_per_account: 30,
    });
  });

  it("refused for a value out of range, say so plainly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        response(400, {
          error: "identities_per_account is at most 200",
          code: "invalid_limit",
        }),
      ),
    );
    const err = await setLimits({ identities_per_account: 900 }).catch(
      (e: unknown) => e,
    );
    expect(failure(err, "admin.failed")).toEqual({
      id: "admin.limits.invalid",
    });
  });
});

describe("a limit reached", () => {
  it("is read from the server's refusal", () => {
    const body = JSON.stringify({
      error: "limit reached",
      code: "limit_reached",
      limit: "identities_per_account",
      value: 20,
    });
    expect(readRefusal(body)).toEqual({
      detail: "limit reached",
      code: "limit_reached",
      limit: { name: "identities_per_account", value: 20 },
    });
    expect(
      readRefusal(
        JSON.stringify({
          code: "limit_reached",
          limit: { name: "passkeys_per_account", value: 10 },
        }),
      ).limit,
    ).toEqual({ name: "passkeys_per_account", value: 10 });
  });

  it("without a name is still a limit reached", () => {
    expect(readRefusal(JSON.stringify({ code: "limit_reached" })).limit).toEqual(
      { name: "", value: null },
    );
  });

  it("is no limit at all in any other refusal", () => {
    expect(
      readRefusal(JSON.stringify({ error: "x", limit: "identities_per_account" }))
        .limit,
    ).toBeNull();
    expect(readRefusal("not json")).toEqual({
      detail: null,
      code: null,
      limit: null,
    });
  });

  it("is said with the limit's value, in both languages", () => {
    const message = limitReachedMessage({
      name: "identities_per_account",
      value: 20,
    });
    expect(format(message.id, "en", message.p)).toBe(
      "This server allows at most 20 identities per account.",
    );
    expect(format(message.id, "fr", message.p)).toBe(
      "Ce serveur permet au plus 20 identités par compte.",
    );
  });

  it("set to one is said in the singular", () => {
    const message = limitReachedMessage({
      name: "passkeys_per_account",
      value: 1,
    });
    expect(format(message.id, "en", message.p)).toBe(
      "This server allows only one passkey per account.",
    );
  });

  it("that the interface does not know, or with no value, is said in general words", () => {
    expect(limitReachedMessage({ name: "applications_per_day", value: 3 })).toEqual(
      { id: "limit.reached" },
    );
    expect(
      limitReachedMessage({ name: "identities_per_account", value: null }),
    ).toEqual({ id: "limit.reached" });
  });

  it("is what the person is told, from any call, whatever the status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        response(429, {
          error: "too many accounts from this address today",
          code: "limit_reached",
          limit: "sign_ups_per_ip_per_day",
          value: 5,
        }),
      ),
    );
    const err = await createIdentity({ name: "Work", logo: "icon:ph:briefcase" }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ApiError);
    expect(failure(err, "error.unexpected")).toEqual({
      id: "limit.sign_ups_per_ip_per_day.reached",
      p: { count: 5 },
    });

    const ceremony = new WebAuthnError(
      "api",
      "limit reached",
      403,
      "limit reached",
      "limit_reached",
      { name: "passkeys_per_account", value: 10 },
    );
    expect(failure(ceremony, "passkeys.add-failed")).toEqual({
      id: "limit.passkeys_per_account.reached",
      p: { count: 10 },
    });
  });
});
