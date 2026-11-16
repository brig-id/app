/**
 * What runs: this interface, and the server it talks to.
 *
 * The server tells its edition and version to its administrators only
 * (`GET /admin/server`): a sign-in server does not publish its version to
 * whoever asks. The interface's own is written into the build.
 */
import { ApiError, call } from "./api";

declare const BRIGID_INTERFACE_VERSION: string;

/** The version of this interface (`package.json`, at build time). */
export const INTERFACE_VERSION: string = BRIGID_INTERFACE_VERSION;

export interface ServerVersion {
  /** The edition (`seedling`), when the server says which it is. */
  edition: string | null;
  version: string | null;
}

/** What the server says it is. `null` from a server that does not say:
 * one older than this question, or a program that declared nothing. */
export async function serverVersion(): Promise<ServerVersion | null> {
  try {
    const answer = await call<ServerVersion>("GET", "/admin/server");
    return answer.edition && answer.version ? answer : null;
  } catch (err) {
    // An older server has no such route. Any other failure hides a line of
    // information, and nothing else: the page it is on still works.
    if (err instanceof ApiError) return null;
    throw err;
  }
}
