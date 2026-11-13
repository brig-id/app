import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { PasskeyUnsupported } from "~/components/sign-in/passkey-unsupported";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { type Message, Said, T, titled } from "~/i18n";
import { serverInfo } from "~/lib/api";
import { failure } from "~/lib/errors";
import { currentServer } from "~/lib/server";
import {
  passkeySupport,
  type PasskeySupport,
  signUp,
  WebAuthnError,
} from "~/lib/webauthn";

/**
 * Sign-up: an account is a passkey. No username: the server generates a
 * hidden one. The account exists only once the passkey is stored; then the
 * onboarding page (the passkey's name, the recovery code).
 */
export default component$(() => {
  const nav = useNavigate();
  const busy = useSignal(false);
  const error = useSignal<Message | null>(null);
  const unsupported = useSignal<Exclude<PasskeySupport, "supported"> | null>(
    null,
  );
  const server = useSignal("");
  const closed = useSignal(false);

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.signup"));
    server.value = currentServer();
    const support = passkeySupport();
    if (support !== "supported") {
      unsupported.value = support;
      return;
    }
    closed.value = !(await serverInfo()).sign_up;
  });

  const create = $(async () => {
    error.value = null;
    busy.value = true;
    try {
      await signUp();
      await nav("/welcome/");
    } catch (err) {
      if (err instanceof WebAuthnError && err.kind === "browser") {
        error.value = { id: "signup.none-created" };
      } else if (err instanceof WebAuthnError && err.status === 403) {
        closed.value = true;
      } else {
        error.value = failure(err, "error.unexpected");
      }
    } finally {
      busy.value = false;
    }
  });

  if (unsupported.value !== null) {
    return (
      <PasskeyUnsupported reason={unsupported.value}>
        <T id="signup.title" />
      </PasskeyUnsupported>
    );
  }

  return (
    <section class="card signin-card stack stack--loose">
      <div class="stack stack--tight">
        <h1>
          <T id="signup.title" />
        </h1>
        {server.value && (
          <p class="server-hint">
            <T id="signin.on" p={{ server: server.value }} />
          </p>
        )}
      </div>

      {closed.value ? (
        <Callout kind="info" alert>
          <T id="signup.closed" />
        </Callout>
      ) : (
        <>
          <div class="stack stack--tight">
            <p>
              <T id="signup.lead" />
            </p>
            <p class="quiet">
              <T id="signup.then" />
            </p>
          </div>
          {error.value && (
            <Callout kind="danger" alert>
              <Said message={error.value} />
            </Callout>
          )}
          <button
            type="button"
            class="button button--primary button--wide"
            disabled={busy.value}
            onClick$={create}
          >
            <Icon name="fingerprint" />
            <T id={busy.value ? "common.waiting-passkey" : "signup.button"} />
          </button>
        </>
      )}

      <p class="signin-links signin-links--center">
        <a href="/">
          <T id="signup.have-account" />
        </a>
      </p>
    </section>
  );
});

export const head: DocumentHead = {
  title: "Create an account · brig·id",
};
