import { Slot, component$ } from "@qwik.dev/core";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { T } from "~/i18n";
import type { PasskeySupport } from "~/lib/webauthn";

/**
 * What to tell someone whose browser can't use passkeys. There is no
 * password to fall back on, so the message says what to change, not only
 * that it failed. The page's own title goes in the slot.
 */
export const PasskeyUnsupported = component$<{
  reason: Exclude<PasskeySupport, "supported">;
}>(({ reason }) => (
  <section class="card signin-card passkey-unsupported stack">
    <h1>
      <Slot />
    </h1>
    <Callout kind="warning" alert>
      <T
        id={
          reason === "insecure-context"
            ? "unsupported.insecure"
            : "unsupported.browser"
        }
      />
    </Callout>
    <p class="quiet">
      <T id="unsupported.why" />
    </p>
    <p>
      <a
        href="https://passkeys.dev/docs/intro/what-are-passkeys/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <T id="unsupported.learn" /> <Icon name="arrow-square-out" />
        <span class="sr-only">
          {" "}
          <T id="common.new-tab" />
        </span>
      </a>
    </p>
  </section>
));
