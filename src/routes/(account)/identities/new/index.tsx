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
import { isMessage, type Message, Said, T, titled, tr } from "~/i18n";
import {
  createIdentity,
  listIdentities,
  listTemplates,
  SessionEndedError,
} from "~/lib/api";
import type { Identity, IdentityTemplate } from "~/lib/api-types";
import { failure } from "~/lib/errors";
import { DEFAULT_LOGO, logoName } from "~/lib/icons";

/** The groups archetypes are shown in, in order; others go last. */
const GROUPS = ["everyday", "work", "leisure", "online"] as const;

/** An archetype's name and description in the page's language, the
 * server's words when the interface does not know it. */
function words(t: IdentityTemplate): { name: string; about: string } {
  const name = `template.${t.key}`;
  const about = `template.${t.key}.about`;
  return {
    name: isMessage(name) ? tr(name) : t.name,
    about: isMessage(about) ? tr(about) : t.description,
  };
}

/**
 * A new identity: from an archetype, in one click, or by hand. The
 * archetypes an account already uses (the same icon, or the same name) are
 * left out.
 */
export default component$(() => {
  const nav = useNavigate();
  const menu = useContext(IDENTITIES_MENU);
  const templates = useSignal<IdentityTemplate[]>([]);
  const identities = useSignal<Identity[]>([]);
  const loaded = useSignal(false);
  const manual = useSignal(false);
  const busy = useSignal(false);
  const error = useSignal<Message | null>(null);

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.new-identity"));
    try {
      identities.value = await listIdentities();
      templates.value = await listTemplates();
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
  const create = $(async (values: FormValues, template: string | null) => {
    busy.value = true;
    error.value = null;
    try {
      const made = await createIdentity({
        ...(template ? { template } : {}),
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

  const used = (t: IdentityTemplate) =>
    identities.value.some(
      (i) =>
        i.logo === t.logo ||
        i.name.trim().toLowerCase() === words(t).name.trim().toLowerCase(),
    );
  const offered = templates.value.filter((t) => !used(t));
  const groups = [
    ...GROUPS.map((g) => ({
      key: g as string,
      items: offered.filter((t) => t.group === g),
    })),
    {
      key: "other",
      items: offered.filter(
        (t) => !(GROUPS as readonly string[]).includes(t.group ?? ""),
      ),
    },
  ].filter((g) => g.items.length > 0);

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
            onSubmit$={$((values: FormValues) => create(values, null))}
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
          const title = `archetypes.group.${group.key}`;
          return (
            <section key={group.key} class="stack">
              <h2>{isMessage(title) ? <T id={title} /> : group.key}</h2>
              <ul class="archetypes">
                {group.items.map((t) => {
                  const w = words(t);
                  return (
                    <li key={t.key}>
                      <button
                        type="button"
                        class="card archetype"
                        disabled={busy.value}
                        onClick$={() =>
                          create(
                            {
                              name: w.name,
                              logo: t.logo,
                              description: w.about,
                            },
                            t.key,
                          )
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
