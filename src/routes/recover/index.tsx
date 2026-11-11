import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { type DocumentHead, useNavigate } from "@builder.io/qwik-city";
import { AuthBackground } from "~/components/auth-background/auth-background";
import { PasskeyUnsupported } from "~/components/passkey-unsupported/passkey-unsupported";
import { wa } from "~/lib/wa";
import {
  markRecovered,
  passkeySupport,
  recover,
  storeAuth,
  WebAuthnError,
} from "~/lib/webauthn";

/**
 * "I lost my passkeys" (ADR-004, app#33): the recovery code adds a new
 * passkey to the account it names, signs in, and is used up.
 */
export default component$(() => {
  const nav = useNavigate();
  const code = useSignal("");
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const supported = useSignal(true);
  const unsupportedReason = useSignal<"insecure-context" | "no-webauthn">(
    "no-webauthn",
  );

  useVisibleTask$(() => {
    const support = passkeySupport();
    supported.value = support === "supported";
    if (support !== "supported") unsupportedReason.value = support;
    void Promise.all([wa.card(), wa.callout(), wa.icon()]);
  });

  const submit = $(async () => {
    error.value = null;
    loading.value = true;
    try {
      const session = await recover(code.value, window.location.origin);
      storeAuth(session.id_token, session.user_id);
      markRecovered();
      await nav("/welcome/");
    } catch (err) {
      if (err instanceof WebAuthnError) {
        if (err.kind === "browser") {
          error.value =
            "No passkey was created. Your code is still valid: try again.";
        } else if (err.kind === "network") {
          error.value = "Server unreachable. Please try again.";
        } else if (/status 401|Unauthorized/i.test(err.message)) {
          error.value = "This code doesn't open any account on this server.";
        } else if (/status 429/.test(err.message)) {
          error.value = "Too many attempts. Wait a minute and try again.";
        } else {
          error.value = err.message;
        }
      } else {
        error.value = "Unexpected error.";
      }
    } finally {
      loading.value = false;
    }
  });

  if (!supported.value) {
    return (
      <>
        <AuthBackground />
        <PasskeyUnsupported
          reason={unsupportedReason.value}
          action="Recover your account"
        />
      </>
    );
  }

  return (
    <>
      <AuthBackground />
      <wa-card class="auth-card">
        <form class="wa-stack" preventdefault:submit onSubmit$={submit}>
          <h1 class="wa-heading-l">Recover your account</h1>
          <p>
            Lost every passkey? Enter the recovery code you saved when you
            created your account. You'll then create a new passkey on this
            device.
          </p>
          <label class="wa-stack wa-gap-2xs">
            Recovery code
            <input
              class="recovery-code-input"
              bind:value={code}
              placeholder="XXXX-XXXX-XXXX-…"
              autoComplete="off"
              autoCapitalize="characters"
              spellcheck={false}
              required
            />
          </label>
          {error.value && (
            <wa-callout variant="danger" role="alert">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              {error.value}
            </wa-callout>
          )}
          <button
            type="submit"
            class="wa-brand auth-main-button"
            disabled={loading.value || !code.value.trim()}
          >
            {loading.value ? "Waiting for your passkey…" : "Recover"}
          </button>
          <a href="/login/" class="auth-alt-link">
            Back to sign in
          </a>
        </form>
      </wa-card>
    </>
  );
});

export const head: DocumentHead = {
  title: "Recover your account — brig·id",
};
