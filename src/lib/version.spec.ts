import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";
import { INTERFACE_VERSION, serverVersion } from "./version";
import pkg from "../../package.json";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("what runs", () => {
  it("the interface knows its own version, the one of package.json", () => {
    expect(INTERFACE_VERSION).toBe(pkg.version);
    expect(INTERFACE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("the server's is what it tells its administrators", async () => {
    vi.spyOn(api, "call").mockResolvedValue({
      edition: "seedling",
      version: "0.6.1",
    });
    await expect(serverVersion()).resolves.toEqual({
      edition: "seedling",
      version: "0.6.1",
    });
  });

  it("a server that does not say is not an error", async () => {
    vi.spyOn(api, "call").mockRejectedValue(new api.ApiError(404, "not found"));
    await expect(serverVersion()).resolves.toBeNull();
    vi.spyOn(api, "call").mockResolvedValue({ edition: null, version: null });
    await expect(serverVersion()).resolves.toBeNull();
  });

  it("a session that ended is still one", async () => {
    vi.spyOn(api, "call").mockRejectedValue(new api.SessionEndedError());
    await expect(serverVersion()).rejects.toBeInstanceOf(api.SessionEndedError);
  });
});
