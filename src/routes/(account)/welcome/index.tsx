import {
  $,
  component$,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
} from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { RecoveryCodePanel } from "~/components/account/recovery-code";
import { Callout } from "~/components/ui/callout";
import { IdentityLogo } from "~/components/ui/identity-logo";
import { type Message, Said, T, titled } from "~/i18n";
import {
  createIdentity,
  listIdentities,
  listPasskeys,
  renamePasskey,
  SessionEndedError,
} from "~/lib/api";
import type { PasskeySummary } from "~/lib/api-types";
import { ARCHETYPES, archetypeWords } from "~/lib/archetypes";
import { failure } from "~/lib/errors";
import { takeRecoveredFlag } from "~/lib/webauthn";

/** An identity the onboarding proposes: kept unless unticked, under the
 * name the person leaves or types. */
interface Starter {
  key: string;
  logo: string;
  name: string;
  /** Its description, the archetype's, in the page's language. */
  about: string;
  keep: boolean;
  /** Created already: a second press on "Continue" does not create it twice. */
  created: boolean;
}

/**
 * Onboarding, after sign-up or recovery: name the passkey (pre-filled with
 * its provider), keep the recovery code, choose the first identities, then
 * the account.
 *
 * The recovery code comes first for the server too: until it exists, the
 * account's identities are closed. The identities proposed are created by
 * this page, the ones the person kept, when they continue; the server
 * creates none.
 */
export default component$(() => {
  const nav = useNavigate();
  const recovered = useSignal(false);
  const passkey = useSignal<PasskeySummary | null>(null);
  const name = useSignal("");
  const nameSaved = useSignal(false);
  const codeKept = useSignal(false);
  const error = useSignal<Message | null>(null);
  /** The identities proposed; empty for an account that already has some. */
  const starters = useStore<{ list: Starter[] }>({ list: [] });
  const startersAsked = useSignal(false);
  /** Whether it is known what to propose, even if that is nothing: until
   * then the person cannot continue, or they would leave before the
   * proposal reached them. */
  const startersKnown = useSignal(false);
  const continuing = useSignal(false);
  const identitiesError = useSignal<Message | null>(null);

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

  /** Once the recovery code exists: an account without any identity is
   * proposed the starters, named in the page's language. */
  const proposeStarters = $(async () => {
    if (startersAsked.value) return;
    startersAsked.value = true;
    try {
      if ((await listIdentities()).length > 0) return;
      starters.list = ARCHETYPES.filter((a) => a.starter).map((a) => {
        const words = archetypeWords(a);
        return {
          key: a.key,
          logo: a.logo,
          name: words.name,
          about: words.about,
          keep: true,
          created: false,
        };
      });
    } catch (err) {
      if (err instanceof SessionEndedError) await nav("/");
      // Otherwise nothing is proposed: identities are created from their page.
    } finally {
      startersKnown.value = true;
    }
  });

  /** Creates the identities kept, then goes to the account. */
  const finish = $(async () => {
    identitiesError.value = null;
    continuing.value = true;
    try {
      for (const starter of starters.list) {
        if (!starter.keep || starter.created || !starter.name.trim()) continue;
        // One at a time: the list of identities keeps this order.
        // oxlint-disable-next-line no-await-in-loop
        await createIdentity({
          name: starter.name,
          logo: starter.logo,
          description: starter.about,
        });
        starter.created = true;
      }
      await nav("/identities/");
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/");
        return;
      }
      identitiesError.value = failure(err, "welcome.identities.failed");
    } finally {
      continuing.value = false;
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
          onReady$={proposeStarters}
        />
      </section>

      {starters.list.length > 0 && (
        <section class="card stack" aria-labelledby="starters-title">
          <div class="stack stack--tight">
            <h2 id="starters-title">
              <T id="welcome.identities.title" />
            </h2>
            <p class="quiet">
              <T id="welcome.identities.lead" />
            </p>
          </div>
          <ul class="starters">
            {starters.list.map((starter) => (
              <li key={starter.key} class="starter">
                <label class="starter-keep">
                  <input
                    type="checkbox"
                    checked={starter.keep}
                    disabled={starter.created}
                    onChange$={(_, input) => {
                      starter.keep = input.checked;
                    }}
                  />
                  <IdentityLogo logo={starter.logo} size="s" />
                  <span class="sr-only">
                    <T
                      id="welcome.identities.keep"
                      p={{ name: starter.name }}
                    />
                  </span>
                </label>
                <label class="field-control grow">
                  <span class="sr-only">
                    <T id="identity.form.name" />
                  </span>
                  <input
                    class="input"
                    value={starter.name}
                    maxLength={64}
                    autoComplete="off"
                    disabled={!starter.keep || starter.created}
                    onInput$={(_, input) => {
                      starter.name = input.value;
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
          {identitiesError.value && (
            <Callout kind="danger" alert>
              <Said message={identitiesError.value} />
            </Callout>
          )}
        </section>
      )}

      <div class="cluster">
        <button
          type="button"
          class="button button--primary"
          disabled={!codeKept.value || !startersKnown.value || continuing.value}
          aria-describedby={codeKept.value ? undefined : "continue-hint"}
          onClick$={finish}
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
