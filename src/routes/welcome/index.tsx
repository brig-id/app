import {
  $,
  component$,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { type DocumentHead, useNavigate } from "@builder.io/qwik-city";
import { RecoveryCodePanel } from "~/components/recovery-code/recovery-code";
import type { PasskeySummary } from "~/lib/api-types";
import { listPasskeys, renamePasskey, SessionEndedError } from "~/lib/api";
import { wa } from "~/lib/wa";
import { takeRecoveredFlag } from "~/lib/webauthn";

/**
 * Onboarding (ADR-003, app#36), after signup or recovery: name the passkey
 * (pre-filled with its provider), keep the recovery code, then the account.
 */
export default component$(() => {
  const nav = useNavigate();
  const recovered = useSignal(false);
  const passkey = useSignal<PasskeySummary | null>(null);
  const name = useSignal("");
  const nameSaved = useSignal(false);
  const codeSaved = useSignal(false);
  const error = useSignal<string | null>(null);

  // Editing the name again un-marks it as saved.
  useTask$(({ track }) => {
    track(() => name.value);
    nameSaved.value = false;
  });

  useVisibleTask$(async () => {
    void Promise.all([wa.card(), wa.callout(), wa.icon()]);
    recovered.value = takeRecoveredFlag();
    try {
      const passkeys = await listPasskeys();
      // The passkey just created: the last one listed.
      passkey.value = passkeys.at(-1) ?? null;
      // Pre-fill with the provider's name, unless the user already typed.
      if (!name.value) name.value = passkey.value?.label ?? "";
    } catch (err) {
      if (err instanceof SessionEndedError) await nav("/login/");
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
        await nav("/login/");
        return;
      }
      error.value = err instanceof Error ? err.message : "Unexpected error.";
    }
  });

  return (
    <div class="page wa-stack">
      <div>
        <h1 class="wa-heading-l">
          {recovered.value ? "Your account is back" : "Welcome to brig·id"}
        </h1>
        <p class="quiet">
          {recovered.value
            ? "Your new passkey works, and your old recovery code is used up: keep the new one below."
            : "Your account exists. Two things before you start."}
        </p>
      </div>

      <wa-card>
        <form class="wa-stack" preventdefault:submit onSubmit$={saveName}>
          <h2 class="wa-heading-m">Your passkey</h2>
          <p class="quiet">
            A name helps you recognise it later, for instance where it is
            stored.
          </p>
          <label class="wa-stack wa-gap-2xs">
            Name
            <input
              bind:value={name}
              maxLength={64}
              placeholder="e.g. Pixel 9, 1Password, YubiKey"
            />
          </label>
          {error.value && (
            <wa-callout variant="danger" role="alert">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              {error.value}
            </wa-callout>
          )}
          <div class="wa-cluster wa-gap-s">
            <button type="submit" disabled={!passkey.value}>
              Save the name
            </button>
            {nameSaved.value && <span class="quiet">Saved.</span>}
          </div>
        </form>
      </wa-card>

      <wa-card>
        <RecoveryCodePanel
          onboarding
          onSaved$={$((saved: boolean) => {
            codeSaved.value = saved;
          })}
        />
      </wa-card>

      <div>
        <button
          type="button"
          class="wa-brand"
          disabled={!codeSaved.value}
          title={codeSaved.value ? undefined : "Save your recovery code first"}
          onClick$={() => nav("/identities/")}
        >
          Continue to my identities
        </button>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Welcome — brig·id",
};
