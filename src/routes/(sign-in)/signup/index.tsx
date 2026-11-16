import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { PasskeyUnsupported } from "~/components/sign-in/passkey-unsupported";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { type Message, type MessageId, Said, T, titled } from "~/i18n";
import { serverInfo } from "~/lib/api";
import { failure } from "~/lib/errors";
import { linkFromAddress, reloadOnLink } from "~/lib/links";
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
  /** Why no account can be created here, when none can. */
  const closed = useSignal<MessageId | null>(null);
  /** The invitation the person came with, if any. */
  const invitation = useSignal<string | null>(null);

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.signup"));
    server.value = currentServer();
    invitation.value = linkFromAddress("invitation");
    cleanup(reloadOnLink("invitation", () => invitation.value));
    const support = passkeySupport();
    if (support !== "supported") {
      unsupported.value = support;
      return;
    }
    const info = await serverInfo();
    if (info.policy === "closed") closed.value = "signup.closed";
    else if (info.policy === "invitation" && !invitation.value) {
      closed.value = "signup.invitation";
    }
  });

  const create = $(async () => {
    error.value = null;
    busy.value = true;
    try {
      await signUp(invitation.value ?? undefined);
      await nav("/welcome/");
    } catch (err) {
      if (err instanceof WebAuthnError && err.kind === "browser") {
        error.value = { id: "signup.none-created" };
      } else if (err instanceof WebAuthnError && err.code === "signup_closed") {
        closed.value = "signup.closed";
      } else if (
        err instanceof WebAuthnError &&
        err.code === "invitation_required"
      ) {
        closed.value = "signup.invitation";
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
          <T id={closed.value} />
        </Callout>
      ) : (
        <>
          <div class="stack stack--tight">
            {invitation.value && (
              <p>
                <strong>
                  <T id="signup.invited" />
                </strong>
              </p>
            )}
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
