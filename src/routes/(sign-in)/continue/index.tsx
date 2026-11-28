import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { AskedAttributes } from "~/components/sign-in/asked-attributes";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { IdentityLogo } from "~/components/ui/identity-logo";
import { type Message, type MessageId, Said, T, titled } from "~/i18n";
import {
  answerSilently,
  ApiError,
  approveAuthorization,
  authorizationRequest,
  denyAuthorization,
  SessionEndedError,
  updateIdentity,
} from "~/lib/api";
import type { AuthorizationRequest } from "~/lib/api-types";
import {
  askedRows,
  type AttributeName,
  blocking,
  isAttribute,
  sharedAtFirst,
  toShare,
} from "~/lib/attributes";
import { continueStep, requestErrorMessage } from "~/lib/continue";
import { failure } from "~/lib/errors";
import { login, WebAuthnError } from "~/lib/webauthn";

/**
 * The linking page: an application sent the person here to sign in. The
 * server kept the application's request and gave this page its id; the page
 * signs the person in if needed, then goes in two steps on the same page.
 * First the identity the application will meet: none is chosen for the
 * person. Then what that identity gives: what the application needs, shown
 * and always sent; what it would like, each with a switch; and a field for
 * what the identity lacks. Nothing is sent before the person continues.
 *
 * The application receives an identifier that exists for it alone and, of
 * the attributes it asked for, the ones shown as shared. The names and
 * icons shown here are for the person: they never leave this server.
 */
export default component$(() => {
  const requestId = useSignal("");
  const request = useSignal<AuthorizationRequest | null>(null);
  /** A message that ends the page: nothing more can be done here. */
  const dead = useSignal<MessageId | null>(null);
  const error = useSignal<Message | null>(null);
  /** The identity chosen: none until the person picks one. */
  const selected = useSignal<string | null>(null);
  /** The optional attributes left shared, for the identity chosen. */
  const shared = useSignal<string[]>([]);
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
      // An identity that is gone since the page was read is no longer the
      // choice. Otherwise reading the request again (after an attribute was
      // added) keeps what the person did.
      if (!r.identities.some((identity) => identity.id === selected.value)) {
        selected.value = null;
      }
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

  /** Puts a value the application asks for on the chosen identity. It is
   * then shown like the others: sent if the application needs it, shared
   * unless turned off if it is optional. */
  const add = $(async (name: AttributeName, value: string) => {
    if (selected.value === null || !value.trim()) return;
    error.value = null;
    busy.value = true;
    try {
      await updateIdentity(selected.value, { attributes: { [name]: value } });
      await load();
      const row =
        request.value &&
        askedRows(request.value, selected.value).find((r) => r.name === name);
      if (row && !row.required && row.value !== null) {
        shared.value = [...shared.value.filter((n) => n !== name), name];
      }
    } catch (err) {
      if (err instanceof SessionEndedError) await load();
      else error.value = failure(err, "continue.add.failed");
    } finally {
      busy.value = false;
    }
  });

  const proceed = $(async () => {
    if (selected.value === null || request.value === null) return;
    // Enter in a field that adds an attribute adds it; it does not answer
    // the application.
    const active = document.activeElement;
    if (active instanceof HTMLInputElement && active.dataset.add) {
      if (isAttribute(active.dataset.add)) {
        await add(active.dataset.add, active.value);
      }
      return;
    }
    const rows = askedRows(request.value, selected.value);
    if (blocking(rows).length > 0) return;
    error.value = null;
    busy.value = true;
    try {
      const to = await approveAuthorization(
        requestId.value,
        selected.value,
        toShare(rows, shared.value),
      );
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
    } catch (err) {
      // The request is gone: nothing to go back with. Anything else (the
      // server asks to slow down, the network) is said, and can be tried
      // again.
      if (err instanceof ApiError && err.status === 404) {
        dead.value = "continue.expired-close";
      } else {
        error.value = failure(err, "continue.failed");
      }
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

  // A site that describes itself is named by its address: its declared
  // name is only shown beside it, since anyone can declare any name.
  const app = r.client.host ?? r.client.name;
  const declared =
    r.client.host && r.client.name !== r.client.host ? r.client.name : null;
  const chosen = r.must_sign_in
    ? undefined
    : r.identities.find((identity) => identity.id === selected.value);
  const rows = chosen ? askedRows(r, chosen.id) : [];
  const blocked = blocking(rows).length > 0;
  const count = toShare(rows, shared.value).length;
  return (
    <section class="card signin-card signin-card--wide stack stack--loose">
      <h1 class="signin-title">
        <T id="continue.title" p={{ app }} />
      </h1>
      {declared && (
        <p class="quiet">
          <T id="continue.declared" p={{ name: declared }} />
        </p>
      )}

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
      ) : r.needs_recovery_code ? (
        <Callout kind="info">
          <T id="continue.setup" />{" "}
          <a href="/welcome/">
            <T id="continue.setup.link" />
          </a>
        </Callout>
      ) : r.identities.length === 0 ? (
        <Callout kind="info">
          <T id="continue.none" />{" "}
          <a href="/identities/">
            <T id="continue.none.link" />
          </a>
        </Callout>
      ) : chosen === undefined ? (
        // Step 1: the identity. Nothing is selected, and nothing of any
        // identity is shown.
        <fieldset class="choices">
          <legend>
            <T id="continue.which" />
          </legend>
          <div class="choices-grid">
            {r.identities.map((identity) => (
              <label key={identity.id} class="choice">
                <input
                  type="radio"
                  name="identity"
                  value={identity.id}
                  checked={false}
                  onChange$={() => {
                    selected.value = identity.id;
                    shared.value = sharedAtFirst(askedRows(r, identity.id));
                  }}
                />
                <IdentityLogo logo={identity.logo} size="s" />
                <span class="choice-name">{identity.name}</span>
              </label>
            ))}
          </div>
          <p class="quiet small">
            <T id="continue.which.hint" p={{ app }} />
          </p>
        </fieldset>
      ) : (
        // Step 2: what the identity chosen gives, then the answer.
        <form
          class="stack stack--loose"
          preventdefault:submit
          onSubmit$={proceed}
        >
          <div class="chosen">
            <IdentityLogo logo={chosen.logo} size="s" />
            <span class="chosen-text">
              <span class="quiet small">
                <T id="continue.identity" />
              </span>
              <span class="choice-name">{chosen.name}</span>
            </span>
            <button
              type="button"
              class="link-button"
              disabled={busy.value}
              onClick$={() => {
                selected.value = null;
                shared.value = [];
              }}
            >
              <T id="continue.change" />
            </button>
          </div>
          <AskedAttributes
            rows={rows}
            shared={shared}
            busy={busy.value}
            onAdd$={add}
          />
          <details class="knows">
            <summary>
              <T id="continue.knows" p={{ app }} />
            </summary>
            <ul>
              <li>
                <T
                  id={
                    count === 0
                      ? "continue.knows.nothing"
                      : count === 1
                        ? "continue.knows.one"
                        : "continue.knows.several"
                  }
                  p={{ count: String(count) }}
                />
              </li>
              <li>
                <T id="continue.knows.identifier" />
              </li>
            </ul>
          </details>
          {blocked && (
            <div id="continue-blocked">
              <Callout kind="warning">
                <T id="continue.blocked" p={{ app }} />
              </Callout>
            </div>
          )}
          <button
            type="submit"
            class="button button--primary button--wide"
            disabled={busy.value || blocked}
            aria-describedby={blocked ? "continue-blocked" : undefined}
          >
            <T id="continue.with" p={{ identity: chosen.name }} />
          </button>
        </form>
      )}

      <button
        type="button"
        class="button button--wide"
        disabled={busy.value}
        onClick$={cancel}
      >
        <T
          id={chosen === undefined ? "continue.cancel" : "continue.refuse"}
          p={{ app }}
        />
      </button>
    </section>
  );
});

export const head: DocumentHead = {
  title: "Continue to an application · brig·id",
};
