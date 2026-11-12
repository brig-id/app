import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { type DocumentHead, useNavigate } from "@builder.io/qwik-city";
import { AuthBackground } from "~/components/auth-background/auth-background";
import { PasskeyUnsupported } from "~/components/passkey-unsupported/passkey-unsupported";
import { wa } from "~/lib/wa";
import { otherServerUrl } from "~/lib/validation";
import { currentServer } from "~/lib/server";
import { login, passkeySupport, WebAuthnError } from "~/lib/webauthn";

/**
 * Sign-in (ADR-003, app#37): the server serving this page by default, another
 * one by its domain (the browser goes there: a passkey only works on the
 * domain that created it), and the passkey, with no username to type.
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
  const choosingServer = useSignal(false);
  const otherServer = useSignal("");
  const otherServerError = useSignal<string | null>(null);

  useVisibleTask$(() => {
    server.value = currentServer();
    const support = passkeySupport();
    supported.value = support === "supported";
    if (support !== "supported") unsupportedReason.value = support;
    void Promise.all([wa.card(), wa.callout(), wa.icon()]);
  });

  const signIn = $(async () => {
    error.value = null;
    loading.value = true;
    try {
      await login(null);
      await nav("/identities/");
    } catch (err) {
      if (err instanceof WebAuthnError) {
        if (err.kind === "network") {
          error.value = "Server unreachable. Please try again.";
        } else if (err.kind === "browser") {
          error.value =
            "No passkey was used. Try again, or use another device.";
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

  const goToServer = $(() => {
    const url = otherServerUrl(otherServer.value, server.value);
    if (url === null) {
      otherServerError.value = "Enter a server's domain, e.g. id.example.org";
      return;
    }
    if (url === "current") {
      choosingServer.value = false;
      return;
    }
    window.location.assign(url);
  });

  if (!supported.value) {
    return (
      <>
        <AuthBackground />
        <PasskeyUnsupported reason={unsupportedReason.value} action="Sign in" />
      </>
    );
  }

  return (
    <>
      <AuthBackground />
      <wa-card class="auth-card">
        <div class="wa-stack">
          <h1 class="wa-heading-l">Sign in</h1>

          {choosingServer.value ? (
            <form
              class="wa-stack wa-gap-xs"
              preventdefault:submit
              onSubmit$={goToServer}
            >
              <label class="wa-stack wa-gap-2xs">
                Server
                <input
                  bind:value={otherServer}
                  placeholder="id.example.org"
                  autoComplete="url"
                  inputMode="url"
                />
              </label>
              {otherServerError.value && (
                <p class="field-error" role="alert">
                  {otherServerError.value}
                </p>
              )}
              <div class="wa-cluster wa-gap-xs">
                <button type="submit" class="wa-brand">
                  Continue
                </button>
                <button
                  type="button"
                  onClick$={() => {
                    choosingServer.value = false;
                    otherServerError.value = null;
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p class="auth-server-hint">
              on <strong>{server.value}</strong> ·{" "}
              <button
                type="button"
                class="link-button"
                onClick$={() => {
                  choosingServer.value = true;
                }}
              >
                Another server
              </button>
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
            disabled={loading.value || choosingServer.value}
            onClick$={signIn}
          >
            {loading.value ? "Waiting for your passkey…" : "Use my passkey"}
          </button>

          <div class="wa-split auth-links">
            <a href="/register/">Create an account</a>
            <a href="/recover/">Lost your passkeys?</a>
          </div>
        </div>
      </wa-card>
    </>
  );
});

export const head: DocumentHead = {
  title: "Sign in — brig·id",
};
