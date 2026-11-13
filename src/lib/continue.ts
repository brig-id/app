/**
 * The linking page (`/continue/`): what a site's request looks like to the
 * person, as plain data, so the wording can be tested without a browser.
 */
import type { AuthorizationRequest } from "./api-types";

/** A request this server refused to send back to the site (ADR-005 §2: the
 * site or its return address is not registered, so nothing is sent there). */
export function requestErrorMessage(code: string): string {
  switch (code) {
    case "unknown_client":
      return "The site that sent you here is not registered on this server.";
    case "invalid_redirect_uri":
      return "The site asked to send you back to an address it did not register.";
    default:
      return "This sign-in request is not valid.";
  }
}

export type ContinueStep =
  /** Nothing to show: answer for the site and leave. */
  | { kind: "silent" }
  /** A passkey ceremony first. */
  | { kind: "sign-in" }
  /** Choose the identity the site will meet. */
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
