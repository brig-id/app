import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createIdentity, listIdentities, SessionEndedError } from "./api";

const response = (status: number, body: unknown = "", headers: Record<string, string> = {}) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("a read refused for too many requests", () => {
  it("is asked again after the pause the server names", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(429, { error: "slow down" }, { "retry-after": "1" }))
      .mockResolvedValueOnce(response(200, [{ id: "a" }]));
    vi.stubGlobal("fetch", fetchMock);

    const list = listIdentities();
    await vi.advanceTimersByTimeAsync(999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await list).toEqual([{ id: "a" }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after two more tries, and says why", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(response(429, { error: "slow down" })));
    vi.stubGlobal("fetch", fetchMock);

    const list = listIdentities().catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(10_000);
    const err = await list;
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("a write refused for too many requests", () => {
  it("is not repeated: the person decides", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response(429, { error: "slow down" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createIdentity({ name: "Work", logo: "icon:ph:briefcase" })).rejects.toMatchObject({
      status: 429,
      detail: "slow down",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("a session that ended", () => {
  it("is told apart from every other failure", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response(401)));
    await expect(listIdentities()).rejects.toBeInstanceOf(SessionEndedError);
  });
});
