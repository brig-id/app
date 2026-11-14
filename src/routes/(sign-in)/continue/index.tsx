import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { IdentityLogo } from "~/components/ui/identity-logo";
import { type Message, type MessageId, Said, T, titled } from "~/i18n";
import {
  answerSilently,
  approveAuthorization,
  authorizationRequest,
  denyAuthorization,
  SessionEndedError,
} from "~/lib/api";
import type { AuthorizationRequest } from "~/lib/api-types";
import { continueStep, requestErrorMessage } from "~/lib/continue";
import { failure } from "~/lib/errors";
import { login, WebAuthnError } from "~/lib/webauthn";

/**
 * The linking page: an application sent the person here to sign in. The
 * server kept the application's request and gave this page its id; the page
 * signs the person in if needed, lets them choose the identity the
 * application will meet, and sends the browser back to it.
 *
 * The application receives an identifier that exists for it alone. The
 * names and icons shown here are for the person: they never leave this
 * server.
 */
export default component$(() => {
  const requestId = useSignal("");
  const request = useSignal<AuthorizationRequest | null>(null);
  /** A message that ends the page: nothing more can be done here. */
  const dead = useSignal<MessageId | null>(null);
  const error = useSignal<Message | null>(null);
  const selected = useSignal<string | null>(null);
  const busy = useSignal(false);
  const leaving = useSignal(false);

  const load = $(async () => {
    try {
      const r = await authorizationRequest(requestId.value);
      if (r === null) {
        dead.value = "continue.expired";
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
    } catch (err) {
      error.value = failure(err, "error.unexpected");
    }
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.continue"));
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
      await login();
      await load();
    } catch (err) {
      error.value =
        err instanceof WebAuthnError && err.kind === "browser"
          ? { id: "signin.no-passkey" }
          : failure(err, "error.unexpected");
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
        error.value = failure(err, "continue.failed");
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
      dead.value = "continue.expired-close";
    } finally {
      busy.value = false;
    }
  });

  if (dead.value !== null) {
    return (
      <section class="card signin-card stack">
        <h1>
          <T id="continue.request" />
        </h1>
        <Callout kind="danger" alert>
          <T id={dead.value} />
        </Callout>
      </section>
    );
  }

  const r = request.value;
  if (r === null || leaving.value) {
    return (
      <section class="card signin-card stack">
        <output class="quiet">
          <T id={leaving.value ? "continue.returning" : "common.loading"} />
        </output>
        {error.value && (
          <Callout kind="danger" alert>
            <Said message={error.value} />
          </Callout>
        )}
      </section>
    );
  }

  const app = r.client.name;
  return (
    <section class="card signin-card signin-card--wide stack stack--loose">
      <h1 class="signin-title">
        <T id="continue.title" p={{ app }} />
      </h1>

      {error.value && (
        <Callout kind="danger" alert>
          <Said message={error.value} />
        </Callout>
      )}

      {r.must_sign_in ? (
        <>
          <p>
            <T
              id={r.signed_in ? "continue.confirm" : "continue.sign-in-first"}
            />
          </p>
          <button
            type="button"
            class="button button--primary button--wide"
            disabled={busy.value}
            onClick$={signIn}
          >
            <Icon name="fingerprint" />
            <T id={busy.value ? "common.waiting-passkey" : "signin.button"} />
          </button>
        </>
      ) : r.identities.length === 0 ? (
        <Callout kind="info">
          <T id="continue.none" />{" "}
          <a href="/identities/">
            <T id="continue.none.link" />
          </a>
        </Callout>
      ) : (
        <form
          class="stack stack--loose"
          preventdefault:submit
          onSubmit$={proceed}
        >
          <fieldset class="choices">
            <legend>
              <T id="continue.which" />
            </legend>
            {r.identities.map((identity) => (
              <label key={identity.id} class="choice">
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
                <span class="choice-name">{identity.name}</span>
              </label>
            ))}
          </fieldset>
          <p class="quiet small">
            <T id="continue.shared" p={{ app }} />
          </p>
          <button
            type="submit"
            class="button button--primary button--wide"
            disabled={busy.value || selected.value === null}
          >
            <T id="common.continue" />
          </button>
        </form>
      )}

      <p class="signin-links signin-links--center">
        <button
          type="button"
          class="link-button"
          disabled={busy.value}
          onClick$={cancel}
        >
          <T id="continue.cancel" p={{ app }} />
        </button>
      </p>
    </section>
  );
});

export const head: DocumentHead = {
  title: "Continue to an application · brig·id",
};
