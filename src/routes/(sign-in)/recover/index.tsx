import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { PasskeyUnsupported } from "~/components/sign-in/passkey-unsupported";
import { Callout } from "~/components/ui/callout";
import { type Message, Said, T, titled } from "~/i18n";
import { failure } from "~/lib/errors";
import { looksLikeRecoveryCode } from "~/lib/validation";
import {
  markRecovered,
  passkeySupport,
  type PasskeySupport,
  recover,
  WebAuthnError,
} from "~/lib/webauthn";

/**
 * "I lost my passkeys": the recovery code adds a new passkey to the account
 * it names, signs in, and is used up.
 */
export default component$(() => {
  const nav = useNavigate();
  const code = useSignal("");
  const busy = useSignal(false);
  const error = useSignal<Message | null>(null);
  const unsupported = useSignal<Exclude<PasskeySupport, "supported"> | null>(
    null,
  );

  useVisibleTask$(({ cleanup }) => {
    cleanup(titled("title.recover"));
    const support = passkeySupport();
    if (support !== "supported") unsupported.value = support;
  });

  const submit = $(async () => {
    error.value = null;
    if (!looksLikeRecoveryCode(code.value)) {
      error.value = { id: "recover.shape" };
      return;
    }
    busy.value = true;
    try {
      await recover(code.value);
      markRecovered();
      await nav("/welcome/");
    } catch (err) {
      if (err instanceof WebAuthnError && err.kind === "browser") {
        error.value = { id: "recover.none-created" };
      } else if (err instanceof WebAuthnError && err.status === 401) {
        error.value = { id: "recover.unknown" };
      } else if (err instanceof WebAuthnError && err.status === 400) {
        error.value = { id: "recover.shape" };
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
        <T id="recover.title" />
      </PasskeyUnsupported>
    );
  }

  return (
    <section class="card signin-card">
      <form class="stack stack--loose" preventdefault:submit onSubmit$={submit}>
        <div class="stack stack--tight">
          <h1>
            <T id="recover.title" />
          </h1>
          <p class="quiet">
            <T id="recover.lead" />
          </p>
        </div>
        <div class="field">
          <label class="field-control">
            <span class="field-label">
              <T id="recover.code.label" />
            </span>
            <input
              id="code"
              class="input input--mono"
              bind:value={code}
              placeholder="XXXX-XXXX-XXXX-…"
              autoComplete="off"
              autoCapitalize="characters"
              spellcheck={false}
              required
              aria-describedby="code-hint"
            />
          </label>
          <span id="code-hint" class="field-hint">
            <T id="recover.code.hint" />
          </span>
        </div>
        {error.value && (
          <Callout kind="danger" alert>
            <Said message={error.value} />
          </Callout>
        )}
        <button
          type="submit"
          class="button button--primary button--wide"
          disabled={busy.value || !code.value.trim()}
        >
          <T id={busy.value ? "common.waiting-passkey" : "recover.button"} />
        </button>
        <p class="signin-links signin-links--center">
          <a href="/">
            <T id="recover.back" />
          </a>
        </p>
      </form>
    </section>
  );
});

export const head: DocumentHead = {
  title: "Recover your account · brig·id",
};
