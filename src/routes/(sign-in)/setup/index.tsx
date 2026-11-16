import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { PasskeyUnsupported } from "~/components/sign-in/passkey-unsupported";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { type Message, Said, T, titled } from "~/i18n";
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
 * The first administrator: a new server prints a link to this page when it
 * starts. Whoever opens it creates the first account, which administers the
 * server. Like any sign-up, it is a passkey and nothing else.
 */
export default component$(() => {
  const nav = useNavigate();
  const link = useSignal<string | null>(null);
  const read = useSignal(false);
  const server = useSignal("");
  const busy = useSignal(false);
  const error = useSignal<Message | null>(null);
  const unsupported = useSignal<Exclude<PasskeySupport, "supported"> | null>(
    null,
  );

  useVisibleTask$(({ cleanup }) => {
    cleanup(titled("title.setup"));
    server.value = currentServer();
    link.value = linkFromAddress("link");
    cleanup(reloadOnLink("link", () => link.value));
    read.value = true;
    const support = passkeySupport();
    if (support !== "supported") unsupported.value = support;
  });

  const create = $(async () => {
    if (!link.value) return;
    error.value = null;
    busy.value = true;
    try {
      await signUp(link.value);
      await nav("/welcome/");
    } catch (err) {
      if (err instanceof WebAuthnError && err.kind === "browser") {
        error.value = { id: "signup.none-created" };
      } else if (err instanceof WebAuthnError && err.code === "link_invalid") {
        error.value = { id: "setup.invalid" };
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
        <T id="setup.title" />
      </PasskeyUnsupported>
    );
  }

  return (
    <section class="card signin-card stack stack--loose">
      <h1>
        <T id="setup.title" />
      </h1>
      {!read.value ? null : link.value ? (
        <>
          <div class="stack stack--tight">
            <p>
              <T id="setup.lead" p={{ server: server.value }} />
            </p>
            <p class="quiet">
              <T id="setup.then" />
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
            <T id={busy.value ? "common.waiting-passkey" : "setup.button"} />
          </button>
        </>
      ) : (
        <Callout kind="info">
          <T id="setup.no-link" />
        </Callout>
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
  title: "Set up this server · brig·id",
};
