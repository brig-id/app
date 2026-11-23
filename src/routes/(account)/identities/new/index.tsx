import {
  $,
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
} from "@qwik.dev/core";
import { type DocumentHead, Link, useNavigate } from "@qwik.dev/router";
import { IDENTITIES_MENU } from "~/components/account/identities-context";
import {
  type FormValues,
  IdentityForm,
} from "~/components/account/identity-form";
import { Callout } from "~/components/ui/callout";
import { Icon, LogoIcon } from "~/components/ui/icon";
import { type Message, Said, T, titled } from "~/i18n";
import { createIdentity, listIdentities, SessionEndedError } from "~/lib/api";
import type { Identity } from "~/lib/api-types";
import {
  ARCHETYPES,
  type Archetype,
  archetypeWords,
  GROUPS,
} from "~/lib/archetypes";
import { failure } from "~/lib/errors";
import { DEFAULT_LOGO, logoName } from "~/lib/icons";

/**
 * A new identity: from an archetype, in one click, or by hand. The
 * archetypes an account already uses (the same icon, or the same name) are
 * left out.
 */
export default component$(() => {
  const nav = useNavigate();
  const menu = useContext(IDENTITIES_MENU);
  const identities = useSignal<Identity[]>([]);
  const loaded = useSignal(false);
  const manual = useSignal(false);
  const busy = useSignal(false);
  const error = useSignal<Message | null>(null);

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.new-identity"));
    try {
      identities.value = await listIdentities();
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/");
        return;
      }
      error.value = failure(err, "error.unexpected");
    } finally {
      loaded.value = true;
    }
  });

  /** Creates the identity, then opens it. */
  const create = $(async (values: FormValues) => {
    busy.value = true;
    error.value = null;
    try {
      const made = await createIdentity({
        name: values.name,
        logo: values.logo,
        description: values.description,
      });
      menu.changed.value++;
      await nav(`/identities/details/?id=${encodeURIComponent(made.id)}`);
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/");
        return;
      }
      error.value = failure(err, "error.unexpected");
    } finally {
      busy.value = false;
    }
  });

  const used = (a: Archetype) =>
    identities.value.some(
      (i) =>
        i.logo === a.logo ||
        i.name.trim().toLowerCase() ===
          archetypeWords(a).name.trim().toLowerCase(),
    );
  const offered = ARCHETYPES.filter((a) => !used(a));
  const groups = GROUPS.map((g) => ({
    key: g,
    items: offered.filter((a) => a.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div class="page page--wide stack stack--loose">
      <p>
        <Link href="/identities/" class="back-link">
          <Icon name="arrow-left" />
          <T id="identity.back" />
        </Link>
      </p>
      <div class="stack stack--tight">
        <p class="eyebrow">
          <T id="new.eyebrow" />
        </p>
        <h1>
          <T id="new.title.lead" />{" "}
          <span class="accent spectrum">
            <T id="new.title.accent" />
          </span>
        </h1>
        <p class="quiet">
          <T id="new.lead" />
        </p>
      </div>

      {error.value && (
        <Callout kind="danger" alert>
          <Said message={error.value} />
        </Callout>
      )}

      <div class="mode-pills">
        <button
          type="button"
          aria-pressed={!manual.value}
          onClick$={() => {
            manual.value = false;
          }}
        >
          <T id="new.archetypes" />
        </button>
        <button
          type="button"
          aria-pressed={manual.value}
          onClick$={() => {
            manual.value = true;
          }}
        >
          <T id="new.manual" />
        </button>
      </div>

      {manual.value ? (
        <section class="card">
          <IdentityForm
            initial={{ name: "", logo: DEFAULT_LOGO, description: "" }}
            onSubmit$={$((values: FormValues) => create(values))}
            onCancel$={$(async () => {
              await nav("/identities/");
            })}
          />
        </section>
      ) : !loaded.value ? (
        <output class="quiet">
          <T id="common.loading" />
        </output>
      ) : groups.length === 0 ? (
        <p class="quiet">
          <T id="new.all-used" />
        </p>
      ) : (
        groups.map((group) => {
          return (
            <section key={group.key} class="stack">
              <h2>
                <T id={`archetypes.group.${group.key}`} />
              </h2>
              <ul class="archetypes">
                {group.items.map((t) => {
                  const w = archetypeWords(t);
                  return (
                    <li key={t.key}>
                      <button
                        type="button"
                        class="card archetype"
                        disabled={busy.value}
                        onClick$={() =>
                          create({
                            name: w.name,
                            logo: t.logo,
                            description: w.about,
                          })
                        }
                      >
                        <LogoIcon name={logoName(t.logo)} />
                        <span class="archetype-name">{w.name}</span>
                        <span class="archetype-about quiet small">
                          {w.about}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "New identity · brig·id",
};
