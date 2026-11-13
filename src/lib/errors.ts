/**
 * What to tell the person when a call failed: a message of the interface, in
 * their language, with the server's own words as a detail when it gave some.
 */
import type { Message, MessageId } from "~/i18n";
import { ApiError } from "./api";
import { WebAuthnError } from "./webauthn";

export function failure(err: unknown, fallback: MessageId): Message {
  if (err instanceof WebAuthnError) {
    if (err.kind === "network") return { id: "error.network" };
    if (err.status === 429) return { id: "error.rate" };
    return { id: fallback, ...(err.detail ? { detail: err.detail } : {}) };
  }
  if (err instanceof ApiError) {
    if (err.status === 0) return { id: "error.network" };
    if (err.status === 429) return { id: "error.rate" };
    return { id: fallback, ...(err.detail ? { detail: err.detail } : {}) };
  }
  return { id: "error.unexpected" };
}
