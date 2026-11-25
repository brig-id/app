/**
 * What to tell the person when a call failed: a message of the interface, in
 * their language, with the server's own words as a detail when it gave some.
 */
import type { Message, MessageId } from "~/i18n";
import { ApiError } from "./api";
import { limitReachedMessage } from "./limits";
import { WebAuthnError } from "./webauthn";

/** What the server's own names for its refusals mean to a person. */
const REFUSALS: Record<string, MessageId> = {
  suspended: "error.suspended",
  invitation_required: "signup.invitation",
  link_invalid: "error.link-invalid",
  signup_closed: "signup.closed",
  invalid_limit: "admin.limits.invalid",
};

export function failure(err: unknown, fallback: MessageId): Message {
  // A limit of the server, reached: said plainly, whatever the status.
  if ((err instanceof WebAuthnError || err instanceof ApiError) && err.limit) {
    return limitReachedMessage(err.limit);
  }
  if (
    (err instanceof WebAuthnError || err instanceof ApiError) &&
    err.code !== null &&
    Object.hasOwn(REFUSALS, err.code)
  ) {
    return { id: REFUSALS[err.code]! };
  }
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
