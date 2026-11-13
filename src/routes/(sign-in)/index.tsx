import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { PasskeyUnsupported } from "~/components/sign-in/passkey-unsupported";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { type Message, Said, T, titled } from "~/i18n";
import { checkSession, serverInfo } from "~/lib/api";
import { failure } from "~/lib/errors";
import { currentServer } from "~/lib/server";
import { otherServerUrl } from "~/lib/validation";
import {
  login,
  passkeySupport,
  type PasskeySupport,
  WebAuthnError,
} from "~/lib/webauthn";

/**
 * Sign-in: the server serving this page by default, another one by its
 * domain (the browser goes there: a passkey only works on the domain that
 * created it), and the passkey, with no username to type.
 */
export default component$(() => {
  const nav = useNavigate();
  const busy = useSignal(false);
  const error = useSignal<Message | null>(null);
  const unsupported = useSignal<Exclude<PasskeySupport, "supported"> | null>(
    null,
  );
  const server = useSignal("");
  const signUpOpen = useSignal(true);
  const choosingServer = useSignal(false);
  const otherServer = useSignal("");
  const otherServerInvalid = useSignal(false);

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.signin"));
    server.value = currentServer();
    const support = passkeySupport();
    if (support !== "supported") {
      unsupported.value = support;
      return;
    }
    const [signedIn, info] = await Promise.all([
      checkSession().then(
        () => true,
        () => false,
      ),
      serverInfo(),
    ]);
    if (signedIn) {
      await nav("/identities/");
      return;
    }
    signUpOpen.value = info.sign_up;
  });

  const signIn = $(async () => {
    error.value = null;
    busy.value = true;
    try {
      await login(null);
      await nav("/identities/");
    } catch (err) {
      error.value =
        err instanceof WebAuthnError && err.kind === "browser"
          ? { id: "signin.no-passkey" }
          : failure(err, "error.unexpected");
    } finally {
      busy.value = false;
    }
  });

  const goToServer = $(() => {
    const url = otherServerUrl(otherServer.value, server.value);
    if (url === null) {
      otherServerInvalid.value = true;
      return;
    }
    if (url === "current") {
      choosingServer.value = false;
      return;
    }
    window.location.assign(url);
  });

  if (unsupported.value !== null) {
    return (
      <PasskeyUnsupported reason={unsupported.value}>
        <T id="signin.title" />
      </PasskeyUnsupported>
    );
  }

  return (
    <section class="card signin-card stack stack--loose">
      <div class="stack stack--tight">
        <h1>
          <T id="signin.title" />
        </h1>
        {!choosingServer.value && (
          <p class="server-hint">
            {server.value && (
              <>
                <T id="signin.on" p={{ server: server.value }} />
                <span aria-hidden="true"> · </span>
              </>
            )}
            <button
              type="button"
              class="link-button small"
              onClick$={() => {
                choosingServer.value = true;
              }}
            >
              <T id="signin.other-server" />
            </button>
          </p>
        )}
      </div>

      {choosingServer.value && (
        <form class="stack" preventdefault:submit onSubmit$={goToServer}>
          <div class="field">
            <label class="field-control">
              <span class="field-label">
                <T id="signin.server.label" />
              </span>
              <input
                id="server"
                class="input input--mono"
                bind:value={otherServer}
                placeholder="id.example.org"
                autoComplete="url"
                inputMode="url"
                autoCapitalize="off"
                spellcheck={false}
                aria-describedby="server-hint"
                aria-invalid={otherServerInvalid.value}
              />
            </label>
            {otherServerInvalid.value ? (
              <span id="server-hint" class="field-error" role="alert">
                <T id="signin.server.invalid" />
              </span>
            ) : (
              <span id="server-hint" class="field-hint">
                <T id="signin.server.hint" />
              </span>
            )}
          </div>
          <div class="cluster">
            <button type="submit" class="button button--primary">
              <T id="common.continue" />
            </button>
            <button
              type="button"
              class="button"
              onClick$={() => {
                choosingServer.value = false;
                otherServerInvalid.value = false;
              }}
            >
              <T id="common.cancel" />
            </button>
          </div>
        </form>
      )}

      {error.value && (
        <Callout kind="danger" alert>
          <Said message={error.value} />
        </Callout>
      )}

      {!choosingServer.value && (
        <button
          type="button"
          class="button button--primary button--wide"
          disabled={busy.value}
          onClick$={signIn}
        >
          <Icon name="fingerprint" />
          <T id={busy.value ? "common.waiting-passkey" : "signin.button"} />
        </button>
      )}

      <p
        class={
          signUpOpen.value
            ? "signin-links"
            : "signin-links signin-links--center"
        }
      >
        {signUpOpen.value && (
          <a href="/signup/">
            <T id="signin.create" />
          </a>
        )}
        <a href="/recover/">
          <T id="signin.lost" />
        </a>
      </p>
    </section>
  );
});

export const head: DocumentHead = {
  title: "Sign in · brig·id",
};
