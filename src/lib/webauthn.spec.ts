import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  passkeySupport,
  login,
  recover,
  signUp,
  WebAuthnError,
} from "./webauthn";

function toArrayBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

/** Authenticator data whose AAGUID is 1Password's. */
function onePasswordAuthData(): ArrayBuffer {
  const bytes = new Uint8Array(55);
  bytes[32] = 0x45; // UP, UV, AT
  bytes.set(
    [0xba, 0xda, 0x55, 0x66, 0xa7, 0xaa, 0x40, 0x1f, 0xbd, 0x96, 0x45, 0x61, 0x9a, 0x55, 0x12, 0x0d],
    37,
  );
  return bytes.buffer;
}

function fakeCredential(kind: "attestation" | "assertion") {
  return {
    id: "credential-id",
    rawId: toArrayBuffer("raw-id"),
    response:
      kind === "attestation"
        ? {
            attestationObject: toArrayBuffer("attestation"),
            clientDataJSON: toArrayBuffer("client-data"),
            getAuthenticatorData: () => onePasswordAuthData(),
          }
        : {
            authenticatorData: toArrayBuffer("auth-data"),
            clientDataJSON: toArrayBuffer("client-data"),
            signature: toArrayBuffer("signature"),
            userHandle: null,
          },
    getClientExtensionResults: () => ({}),
  };
}

/** Mirrors a real `fetch` Response: only `.text()` is used by `apiRequest`. */
function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, text: async () => JSON.stringify(body) };
}

/** Mirrors `axum`'s `Ok(StatusCode::OK)` handlers: 200 with an empty body. */
function emptyOkResponse() {
  return { ok: true, status: 200, text: async () => "" };
}

type FakeResponse = ReturnType<typeof jsonResponse> | ReturnType<typeof emptyOkResponse>;
type FakeFetch = (url: string, init?: RequestInit) => Promise<FakeResponse>;

describe("register/login", () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("signUp() sends no username and names the passkey after its provider", async () => {
    const fetchMock = vi
      .fn<FakeFetch>()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          session_id: "sess-1",
          challenge: {
            publicKey: {
              challenge: "Y2hhbGxlbmdl",
              user: { id: "dXNlcg", name: "u", displayName: "u" },
              rp: { name: "brig-id" },
              pubKeyCredParams: [],
            },
          },
        }),
      )
      // 204 + Set-Cookie: the session is the cookie, the body is empty.
      .mockResolvedValueOnce(emptyOkResponse());
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {
      credentials: {
        create: vi
          .fn<() => Promise<ReturnType<typeof fakeCredential>>>()
          .mockResolvedValue(fakeCredential("attestation")),
      },
    });

    await signUp();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/auth/register/begin");
    const beginBody = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(beginBody).toEqual({});
    expect(fetchMock.mock.calls[0]![1]!.credentials).toBe("same-origin");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/auth/register/finish");
    const finishBody = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);
    expect(finishBody.session_id).toBe("sess-1");
    expect(finishBody.credential.id).toBe("credential-id");
    expect(finishBody.label).toBe("1Password");
  });

  it("signUp() throws a browser WebAuthnError when the passkey ceremony is cancelled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        jsonResponse(200, {
          session_id: "sess-1",
          challenge: {
            publicKey: {
              challenge: "Y2hhbGxlbmdl",
              user: { id: "dXNlcg", name: "u", displayName: "u" },
              rp: { name: "brig-id" },
              pubKeyCredParams: [],
            },
          },
        }),
      ),
    );
    vi.stubGlobal("navigator", {
      credentials: {
        create: vi
          .fn<() => Promise<ReturnType<typeof fakeCredential>>>()
          .mockRejectedValue(new Error("NotAllowedError")),
      },
    });

    const error = await signUp().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(WebAuthnError);
    expect((error as WebAuthnError).kind).toBe("browser");
  });

  it("signUp() throws a network WebAuthnError when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const error = await signUp().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(WebAuthnError);
    expect((error as WebAuthnError).kind).toBe("network");
  });

  it("signUp() throws an api WebAuthnError on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(jsonResponse(409, { error: "username taken" })),
    );

    const error = await signUp().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(WebAuthnError);
    expect((error as WebAuthnError).kind).toBe("api");
    expect((error as WebAuthnError).message).toBe("username taken");
  });

  it("recover() sends the code, then finishes", async () => {
    const fetchMock = vi
      .fn<FakeFetch>()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          session_id: "rec-1",
          challenge: {
            publicKey: {
              challenge: "Y2hhbGxlbmdl",
              user: { id: "dXNlcg", name: "u", displayName: "u" },
              rp: { name: "brig-id" },
              pubKeyCredParams: [],
            },
          },
        }),
      )
      // 204 + Set-Cookie: the session is the cookie, the body is empty.
      .mockResolvedValueOnce(emptyOkResponse());
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {
      credentials: {
        create: vi
          .fn<() => Promise<ReturnType<typeof fakeCredential>>>()
          .mockResolvedValue(fakeCredential("attestation")),
      },
    });

    await recover("ABCD-EFGH");

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/auth/recovery/begin");
    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({
      code: "ABCD-EFGH",
    });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/auth/recovery/finish");
    const finish = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);
    expect(finish.session_id).toBe("rec-1");
    expect(finish.label).toBe("1Password");
  });

  it("recover() reports a refused code as an api error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(jsonResponse(400, { error: "this recovery code has a typo" })),
    );
    const error = await recover("bad").catch((err: unknown) => err);
    expect(error).toBeInstanceOf(WebAuthnError);
    expect((error as WebAuthnError).message).toBe("this recovery code has a typo");
  });

  it("login() sends no username, and finishes", async () => {
    const fetchMock = vi
      .fn<FakeFetch>()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          session_id: "sess-2",
          challenge: { publicKey: { challenge: "Y2hhbGxlbmdl" } },
        }),
      )
      .mockResolvedValueOnce(emptyOkResponse());
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {
      credentials: {
        get: vi
          .fn<() => Promise<ReturnType<typeof fakeCredential>>>()
          .mockResolvedValue(fakeCredential("assertion")),
      },
    });

    await login();

    const beginBody = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(beginBody).toEqual({});
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/auth/login/finish");
  });

  it("passkeySupport() tells an insecure context from a missing API", () => {
    vi.stubGlobal("window", { isSecureContext: false, PublicKeyCredential: {} });
    expect(passkeySupport()).toBe("insecure-context");
    vi.stubGlobal("window", { isSecureContext: true });
    expect(passkeySupport()).toBe("no-webauthn");
    vi.stubGlobal("window", { isSecureContext: true, PublicKeyCredential: {} });
    expect(passkeySupport()).toBe("supported");
  });

  it("keeps nothing of the session in localStorage", async () => {
    const fetchMock = vi
      .fn<FakeFetch>()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          session_id: "sess-3",
          challenge: { publicKey: { challenge: "Y2hhbGxlbmdl" } },
        }),
      )
      .mockResolvedValueOnce(emptyOkResponse());
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {
      credentials: {
        get: vi
          .fn<() => Promise<ReturnType<typeof fakeCredential>>>()
          .mockResolvedValue(fakeCredential("assertion")),
      },
    });
    await login();
    expect(memory.size).toBe(0);
  });
});
