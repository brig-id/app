import { component$ } from "@builder.io/qwik";
import type { PasskeySupport } from "~/lib/webauthn";

/**
 * What to tell someone whose browser can't use passkeys (app#13). brig·id
 * has no password fallback, so the message says what to change, not just
 * that it failed. Shown inside the usual card, under the page's own title.
 */
export const PasskeyUnsupported = component$<{
  reason: Exclude<PasskeySupport, "supported">;
  action: string;
}>(({ reason, action }) => (
  <wa-card class="auth-card auth-unsupported">
    <div class="wa-stack">
      <h1 class="wa-heading-l">{action}</h1>
      <wa-callout variant="warning" role="alert">
        <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
        {reason === "insecure-context" ? (
          <span>
            Passkeys only work on secure pages. Open this page with{" "}
            <strong>https://</strong> in the address.
          </span>
        ) : (
          <span>
            This browser can't use passkeys. Update it, or use a recent Chrome,
            Safari, Edge or Firefox.
          </span>
        )}
      </wa-callout>
      <p class="quiet">
        brig·id signs you in with passkeys only: no password to remember or to
        steal. A passkey can live on this device, on your phone, or on a
        security key.
      </p>
      <a
        href="https://passkeys.dev/docs/intro/what-are-passkeys/"
        target="_blank"
        rel="noopener noreferrer"
      >
        What is a passkey?
      </a>
    </div>
  </wa-card>
));
