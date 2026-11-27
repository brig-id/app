/**
 * What runs: the server and this interface. Both are public, on the About
 * page. The server says its edition and version in `GET /auth/server`; the
 * interface's own is written into the build.
 */
import { serverInfo } from "./api";

declare const BRIGID_INTERFACE_VERSION: string;

/** The version of this interface, written at build time: the version of the
 * server it is released in, or `0.0.0` in any other build. */
export const INTERFACE_VERSION: string = BRIGID_INTERFACE_VERSION;

export interface ServerVersion {
  /** The edition: `seedling`. */
  edition: string;
  version: string;
}

/** What the server says it runs, or `null` from one that does not say (one
 * older than the question, or a program that declared nothing). */
export async function serverVersion(): Promise<ServerVersion | null> {
  const info = await serverInfo();
  return info.edition && info.version
    ? { edition: info.edition, version: info.version }
    : null;
}
