import {
  $,
  component$,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { RecoveryCodePanel } from "~/components/account/recovery-code";
import { Callout } from "~/components/ui/callout";
import { type Message, Said, T, titled } from "~/i18n";
import { listPasskeys, renamePasskey, SessionEndedError } from "~/lib/api";
import type { PasskeySummary } from "~/lib/api-types";
import { failure } from "~/lib/errors";
import { takeRecoveredFlag } from "~/lib/webauthn";

/**
 * Onboarding, after sign-up or recovery: name the passkey (pre-filled with
 * its provider), keep the recovery code, then the account.
 */
export default component$(() => {
  const nav = useNavigate();
  const recovered = useSignal(false);
  const passkey = useSignal<PasskeySummary | null>(null);
  const name = useSignal("");
  const nameSaved = useSignal(false);
  const codeKept = useSignal(false);
  const error = useSignal<Message | null>(null);

  // Editing the name again un-marks it as saved.
  useTask$(({ track }) => {
    track(() => name.value);
    nameSaved.value = false;
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.welcome"));
    recovered.value = takeRecoveredFlag();
    try {
      const passkeys = await listPasskeys();
      // The passkey just created: the last one listed.
      passkey.value = passkeys.at(-1) ?? null;
      // Pre-filled with the provider's name, unless the person already typed.
      if (!name.value) name.value = passkey.value?.label ?? "";
    } catch (err) {
      if (err instanceof SessionEndedError) await nav("/");
    }
  });

  const saveName = $(async () => {
    if (!passkey.value) return;
    error.value = null;
    try {
      await renamePasskey(passkey.value.id, name.value.trim());
      nameSaved.value = true;
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/");
        return;
      }
      error.value = failure(err, "passkeys.rename-failed");
    }
  });

  return (
    <div class="page stack stack--loose">
      <div class="stack stack--tight">
        <h1>
          <T id={recovered.value ? "welcome.back.title" : "welcome.title"} />
        </h1>
        <p class="quiet">
          <T id={recovered.value ? "welcome.back.lead" : "welcome.lead"} />
        </p>
      </div>

      <section class="card">
        <form class="stack" preventdefault:submit onSubmit$={saveName}>
          <div class="stack stack--tight">
            <h2>
              <T id="welcome.passkey.title" />
            </h2>
            <p class="quiet">
              <T id="welcome.passkey.lead" />
            </p>
          </div>
          <div class="field">
            <label class="field-control">
              <span class="field-label">
                <T id="passkey.name" />
              </span>
              <input
                id="passkey-name"
                class="input"
                bind:value={name}
                maxLength={64}
                autoComplete="off"
                aria-describedby="passkey-name-hint"
              />
            </label>
            <span id="passkey-name-hint" class="field-hint">
              <T id="passkey.name.hint" />
            </span>
          </div>
          {error.value && (
            <Callout kind="danger" alert>
              <Said message={error.value} />
            </Callout>
          )}
          <div class="cluster">
            <button type="submit" class="button" disabled={!passkey.value}>
              <T id="welcome.passkey.save" />
            </button>
            {nameSaved.value && (
              <output class="quiet">
                <T id="common.saved" />
              </output>
            )}
          </div>
        </form>
      </section>

      <section class="card">
        <RecoveryCodePanel
          onboarding
          onKept$={$((kept: boolean) => {
            codeKept.value = kept;
          })}
        />
      </section>

      <div class="cluster">
        <button
          type="button"
          class="button button--primary"
          disabled={!codeKept.value}
          aria-describedby={codeKept.value ? undefined : "continue-hint"}
          onClick$={() => nav("/identities/")}
        >
          <T id="welcome.continue" />
        </button>
        {!codeKept.value && (
          <span id="continue-hint" class="quiet small">
            <T id="welcome.continue.hint" />
          </span>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Welcome · brig·id",
};
