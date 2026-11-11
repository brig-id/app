import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { type DocumentHead, useNavigate } from "@builder.io/qwik-city";
import { AuthBackground } from "~/components/auth-background/auth-background";
import { PasskeyUnsupported } from "~/components/passkey-unsupported/passkey-unsupported";
import { wa } from "~/lib/wa";
import { currentServer } from "~/lib/server";
import {
  passkeySupport,
  signUp,
  storeAuth,
  WebAuthnError,
} from "~/lib/webauthn";

/**
 * Signup (ADR-003, app#36): an account is just a passkey. No username: the
 * server generates a hidden one. The account exists only once the passkey is
 * stored; then the onboarding page (passkey name, recovery code).
 */
export default component$(() => {
  const nav = useNavigate();
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const supported = useSignal(true);
  const unsupportedReason = useSignal<"insecure-context" | "no-webauthn">(
    "no-webauthn",
  );
  const server = useSignal("");

  useVisibleTask$(() => {
    server.value = currentServer();
    const support = passkeySupport();
    supported.value = support === "supported";
    if (support !== "supported") unsupportedReason.value = support;
    void Promise.all([wa.card(), wa.callout(), wa.icon()]);
  });

  const create = $(async () => {
    error.value = null;
    loading.value = true;
    try {
      const session = await signUp(window.location.origin);
      storeAuth(session.id_token, session.user_id);
      await nav("/welcome/");
    } catch (err) {
      if (err instanceof WebAuthnError) {
        if (err.kind === "browser") {
          error.value =
            "No passkey was created, so no account either. Try again.";
        } else if (err.kind === "network") {
          error.value = "Server unreachable. Please try again.";
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
          action="Create an account"
        />
      </>
    );
  }

  return (
    <>
      <AuthBackground />
      <wa-card class="auth-card">
        <div class="wa-stack">
          <h1 class="wa-heading-l">Create account</h1>
          <p>
            Your account is a <strong>passkey</strong>: no password, no
            username. Your device or password manager keeps it and unlocks it
            with your fingerprint, face or PIN.
          </p>
          <p class="quiet">
            Then you create the identities that services will see. They never
            see your account itself.
          </p>
          {server.value && (
            <p class="auth-server-hint">
              on <strong>{server.value}</strong>
            </p>
          )}
          {error.value && (
            <wa-callout variant="danger" role="alert">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              {error.value}
            </wa-callout>
          )}
          <button
            type="button"
            class="wa-brand auth-main-button"
            disabled={loading.value}
            onClick$={create}
          >
            {loading.value ? "Waiting for your passkey…" : "Create account"}
          </button>
          <a href="/login/" class="auth-alt-link">
            Already have an account? Sign in
          </a>
        </div>
      </wa-card>
    </>
  );
});

export const head: DocumentHead = {
  title: "Create account — brig·id",
};
