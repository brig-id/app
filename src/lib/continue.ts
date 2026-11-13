/**
 * The linking page (`/continue/`): what an application's request looks like to
 * the person, as plain data, so the wording can be tested without a browser.
 */
import type { MessageId } from "~/i18n/messages";
import type { AuthorizationRequest } from "./api-types";

/** Why this server refused to send a request back to the application that
 * made it: the application or its return address is not registered, so
 * nothing is sent there. The code comes from the address of the page. */
export function requestErrorMessage(code: string): MessageId {
  switch (code) {
    case "unknown_client":
      return "continue.unknown-client";
    case "invalid_redirect_uri":
      return "continue.bad-redirect";
    default:
      return "continue.invalid";
  }
}

export type ContinueStep =
  /** Nothing to show: answer for the application and leave. */
  | { kind: "silent" }
  /** A passkey ceremony first. */
  | { kind: "sign-in" }
  /** Choose the identity the application will meet. */
  | { kind: "choose"; selected: string | null };

/** What the page does with a request. */
export function continueStep(request: AuthorizationRequest): ContinueStep {
  if (request.silent) return { kind: "silent" };
  if (request.must_sign_in) return { kind: "sign-in" };
  const remembered = request.identities.find((i) => i.id === request.chosen);
  return {
    kind: "choose",
    // The remembered identity, else the only one there is. With several and
    // none remembered, the person chooses: nothing is picked for them.
    selected:
      remembered?.id ??
      (request.identities.length === 1 ? request.identities[0]!.id : null),
  };
}
