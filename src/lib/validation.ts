/**
 * What the pages check before asking the server: said at once, without a
 * request. The server decides in every case.
 */
import { isHostname } from "helpers4/guard";

/**
 * Where "Another server" on the sign-in page leads: that server's sign-in
 * page, `"current"` when the domain is this server's own, or `null` when the
 * input is not a server domain. A pasted URL (`https://x/...`) is reduced to
 * its host.
 */
export function otherServerUrl(
  input: string,
  currentServer: string,
): string | "current" | null {
  let host = input.trim().toLowerCase();
  host = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!isHostname(host)) return null;
  if (host === currentServer.toLowerCase()) return "current";
  return `https://${host}/`;
}

/**
 * Whether what was typed can be a recovery code: 40 characters once the
 * separators are taken out. Said before anything is sent, so that a typo is
 * not counted as an attempt; the server decides whether the code is right.
 */
export function looksLikeRecoveryCode(input: string): boolean {
  return input.replace(/[\s-]/g, "").length === 40;
}
