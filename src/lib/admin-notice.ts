/**
 * What an administration page tells the person after a change: done, not
 * done because the passkey was not used, or refused.
 */
import type { Message } from "~/i18n";
import { failure } from "./errors";
import { WebAuthnError } from "./webauthn";

export type Notice = {
  kind: "success" | "danger" | "info";
  message: Message;
} | null;

export function done(message: Message): Notice {
  return { kind: "success", message };
}

/** A change that failed. The ceremony cancelled is not an error: nothing
 * was done, and that is said plainly. */
export function notDone(err: unknown): Notice {
  if (err instanceof WebAuthnError && err.kind === "browser") {
    return { kind: "info", message: { id: "admin.confirm.cancelled" } };
  }
  return { kind: "danger", message: failure(err, "admin.failed") };
}
