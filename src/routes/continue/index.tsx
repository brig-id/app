import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AuthBackground } from "~/components/auth-background/auth-background";
import { IdentityLogo } from "~/components/identity-logo/identity-logo";
import {
  answerSilently,
  approveAuthorization,
  authorizationRequest,
  denyAuthorization,
  SessionEndedError,
} from "~/lib/api";
import type { AuthorizationRequest } from "~/lib/api-types";
import { continueStep, requestErrorMessage } from "~/lib/continue";
import { wa } from "~/lib/wa";
import { login, WebAuthnError } from "~/lib/webauthn";

/**
 * The linking page (ADR-005 §2): a site sent the person here to sign in.
 * The server kept the site's request and gave this page its id; the page
 * signs the person in if needed, lets them choose the identity the site will
 * meet, and sends the browser back to the site.
 *
 * The site receives an identifier that exists for it alone. The names and
 * icons shown here are for the person: they never leave this server.
 */
export default component$(() => {
  const requestId = useSignal("");
  const request = useSignal<AuthorizationRequest | null>(null);
  /** A message that ends the page: nothing more can be done here. */
  const dead = useSignal<string | null>(null);
  const error = useSignal<string | null>(null);
  const selected = useSignal<string | null>(null);
  const busy = useSignal(false);
  const leaving = useSignal(false);

  const load = $(async () => {
    try {
      const r = await authorizationRequest(requestId.value);
      if (r === null) {
        dead.value =
          "This sign-in request has expired. Go back to the site and start again.";
        return;
      }
      const step = continueStep(r);
      if (step.kind === "silent") {
        leaving.value = true;
        window.location.replace(await answerSilently(requestId.value));
        return;
      }
      if (step.kind === "choose") selected.value = step.selected;
      request.value = r;
    } catch {
      error.value = "Unable to reach the server. Please try again.";
    }
  });

  useVisibleTask$(async () => {
    void Promise.all([wa.card(), wa.callout(), wa.icon()]);
    const params = new URLSearchParams(window.location.search);
    const refused = params.get("error");
    if (refused !== null) {
      dead.value = requestErrorMessage(refused);
      return;
    }
    const id = params.get("request");
    if (!id) {
      dead.value = requestErrorMessage("");
      return;
    }
    requestId.value = id;
    await load();
  });

  const signIn = $(async () => {
    error.value = null;
    busy.value = true;
    try {
      await login(null);
      await load();
    } catch (err) {
      error.value =
        err instanceof WebAuthnError && err.kind === "network"
          ? "Server unreachable. Please try again."
          : "No passkey was used. Try again, or use another device.";
    } finally {
      busy.value = false;
    }
  });

  const proceed = $(async () => {
    if (selected.value === null) return;
    error.value = null;
    busy.value = true;
    try {
      const to = await approveAuthorization(requestId.value, selected.value);
      leaving.value = true;
      window.location.assign(to);
    } catch (err) {
      if (err instanceof SessionEndedError) {
        // The session ended while the page was open: sign in again.
        await load();
      } else {
        error.value = "Unable to continue. Please try again.";
      }
    } finally {
      busy.value = false;
    }
  });

  const cancel = $(async () => {
    busy.value = true;
    try {
      const to = await denyAuthorization(requestId.value);
      leaving.value = true;
      window.location.assign(to);
    } catch {
      dead.value = "This sign-in request has expired. You can close this page.";
    } finally {
      busy.value = false;
    }
  });

  if (dead.value !== null) {
    return (
      <>
        <AuthBackground />
        <wa-card class="auth-card">
          <div class="wa-stack">
            <h1 class="wa-heading-l">Sign-in request</h1>
            <wa-callout variant="danger" role="alert">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              {dead.value}
            </wa-callout>
          </div>
        </wa-card>
      </>
    );
  }

  const r = request.value;
  if (r === null || leaving.value) {
    return (
      <>
        <AuthBackground />
        <wa-card class="auth-card">
          <output>
            {leaving.value ? "Returning to the site…" : "Loading…"}
          </output>
          {error.value && (
            <wa-callout variant="danger" role="alert">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              {error.value}
            </wa-callout>
          )}
        </wa-card>
      </>
    );
  }

  return (
    <>
      <AuthBackground />
      <wa-card class="auth-card auth-card--wide">
        <div class="wa-stack">
          <h1 class="wa-heading-l">
            Continue to <span class="continue-site">{r.client.name}</span>
          </h1>

          {error.value && (
            <wa-callout variant="danger" role="alert">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              {error.value}
            </wa-callout>
          )}

          {r.must_sign_in ? (
            <>
              <p>
                {r.signed_in
                  ? "This site asks you to confirm it is you."
                  : "Sign in to choose the identity this site will meet."}
              </p>
              <button
                type="button"
                class="wa-brand auth-main-button"
                disabled={busy.value}
                onClick$={signIn}
              >
                Use my passkey
              </button>
            </>
          ) : (
            <form class="wa-stack" preventdefault:submit onSubmit$={proceed}>
              <fieldset class="continue-identities">
                <legend>Which identity will this site meet?</legend>
                {r.identities.map((identity) => (
                  <label key={identity.id} class="continue-identity">
                    <input
                      type="radio"
                      name="identity"
                      value={identity.id}
                      checked={selected.value === identity.id}
                      onChange$={() => {
                        selected.value = identity.id;
                      }}
                    />
                    <IdentityLogo logo={identity.logo} size="s" />
                    <span>{identity.name}</span>
                  </label>
                ))}
              </fieldset>
              <p class="continue-shared">
                {r.client.name} receives an identifier that exists for this site
                and this identity only. It does not receive the identity's name
                or icon, and it cannot connect it to your other identities.
              </p>
              <button
                type="submit"
                class="wa-brand auth-main-button"
                disabled={busy.value || selected.value === null}
              >
                Continue
              </button>
            </form>
          )}

          <button
            type="button"
            class="link-button auth-alt-link"
            disabled={busy.value}
            onClick$={cancel}
          >
            Cancel and go back to {r.client.name}
          </button>
        </div>
      </wa-card>
    </>
  );
});

export const head: DocumentHead = {
  title: "Continue to a site — brig·id",
  meta: [{ name: "robots", content: "noindex" }],
};
