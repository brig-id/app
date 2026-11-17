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

  it("the server's is what it says of itself, to anyone", async () => {
    vi.spyOn(api, "serverInfo").mockResolvedValue({
      sign_up: false,
      policy: "invitation",
      edition: "seedling",
      version: "0.7.1",
    });
    await expect(serverVersion()).resolves.toEqual({
      edition: "seedling",
      version: "0.7.1",
    });
  });

  it("a server that does not say is not an error", async () => {
    vi.spyOn(api, "serverInfo").mockResolvedValue({
      sign_up: true,
      policy: "open",
    });
    await expect(serverVersion()).resolves.toBeNull();
  });
});
