/**
 * Client-side mirror of `RootId::parse` (brigid-identity/src/root_id.rs).
 * Format: `username@server` where `username` is 3-64 ASCII alphanumeric/-/_
 * chars (not all underscores) and `server` is a DNS hostname (helpers4 on
 * both sides: no trailing dot, not an IP address).
 */
import { isHostname } from "helpers4/guard";

const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,64}$/;

export function isValidUsername(username: string): boolean {
  if (!USERNAME_PATTERN.test(username)) return false;
  return !/^_+$/.test(username);
}

export function isValidHandle(handle: string): boolean {
  const at = handle.indexOf("@");
  if (at === -1 || at !== handle.lastIndexOf("@")) return false;
  const username = handle.slice(0, at);
  const server = handle.slice(at + 1);
  return isValidUsername(username) && isHostname(server);
}

export type LoginInput =
  | { kind: "local"; username: string; server: string }
  | { kind: "remote"; username: string; server: string }
  | { kind: "invalid" };

/**
 * Accepts either a bare `username` (assumed to live on `currentServer`) or
 * a full `username@server` handle, so the login field doesn't force typing
 * `@server` for the common case of logging into the server you're on.
 * Server comparison is case-insensitive, mirroring `RootId::parse`'s
 * lowercasing (`brigid-identity/src/root_id.rs`) so `Example.com` and
 * `example.com` are treated as the same server.
 */
export function parseLoginInput(
  input: string,
  currentServer: string,
): LoginInput {
  const at = input.indexOf("@");
  if (at === -1) {
    if (!isValidUsername(input)) return { kind: "invalid" };
    return { kind: "local", username: input, server: currentServer };
  }
  if (!isValidHandle(input)) return { kind: "invalid" };
  const username = input.slice(0, at);
  const server = input.slice(at + 1);
  if (server.toLowerCase() === currentServer.toLowerCase()) {
    return { kind: "local", username, server };
  }
  return { kind: "remote", username, server };
}
