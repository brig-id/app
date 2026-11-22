import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useLocation, useNavigate } from "@qwik.dev/router";
import {
  type FormValues,
  IdentityForm,
} from "~/components/account/identity-form";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { IdentityLogo } from "~/components/ui/identity-logo";
import { both, type Message, Said, T, titled } from "~/i18n";
import {
  createIdentity,
  listIdentities,
  listTemplates,
  SessionEndedError,
} from "~/lib/api";
import type { Identity, IdentityTemplate } from "~/lib/api-types";
import { ATTRIBUTES, attributeLabel } from "~/lib/attributes";
import { failure } from "~/lib/errors";
import { hueAt } from "~/lib/hues";
import { DEFAULT_LOGO } from "~/lib/icons";

type Notice = { kind: "success" | "danger"; message: Message } | null;

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const identities = useSignal<Identity[]>([]);
  const templates = useSignal<IdentityTemplate[]>([]);
  const loaded = useSignal(false);
  const creating = useSignal(false);
  const notice = useSignal<Notice>(null);

  const fail = $(async (err: unknown) => {
    if (err instanceof SessionEndedError) {
      await nav("/");
      return;
    }
    notice.value = {
      kind: "danger",
      message: failure(err, "error.unexpected"),
    };
  });

  const refresh = $(async () => {
    try {
      identities.value = await listIdentities();
    } catch (err) {
      await fail(err);
    } finally {
      loaded.value = true;
    }
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.identities"));
    // Back from an identity's page that deleted it. The router's address:
    // after a navigation inside the interface, `window.location` may not
    // be the new one yet.
    const deleted = loc.url.searchParams.get("deleted");
    if (deleted) {
      notice.value = {
        kind: "success",
        message: { id: "identity.deleted", p: { name: deleted } },
      };
      history.replaceState(null, "", window.location.pathname);
    }
    await refresh();
    try {
      templates.value = await listTemplates();
    } catch {
      // Creating without a template still works.
    }
  });

  const create = $(async (values: FormValues, template: string | null) => {
    try {
      await createIdentity({
        ...(template ? { template } : {}),
        name: values.name,
        logo: values.logo,
        description: values.description,
      });
      creating.value = false;
      notice.value = {
        kind: "success",
        message: { id: "identity.created", p: { name: values.name.trim() } },
      };
      await refresh();
    } catch (err) {
      await fail(err);
    }
  });

  return (
    <div class="page stack stack--loose">
      <div class="split">
        <div class="stack stack--tight grow">
          <p class="eyebrow">
            <T id="identities.eyebrow" />
          </p>
          <h1>
            <T id="identities.title.lead" />{" "}
            <span class="accent spectrum">
              <T id="identities.title.accent" />
            </span>
          </h1>
          <p class="quiet">
            <T id="identities.lead" />
          </p>
        </div>
        {!creating.value && (
          <div class="cluster">
            {identities.value.length > 1 && (
              <a class="button" href="/identities/compare/">
                <Icon name="columns" />
                <T id="identities.compare" />
              </a>
            )}
            <button
              type="button"
              class="button button--primary"
              onClick$={() => {
                creating.value = true;
              }}
            >
              <Icon name="plus" />
              <T id="identities.new" />
            </button>
          </div>
        )}
      </div>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}

      {creating.value && (
        <section class="card">
          <IdentityForm
            initial={{ name: "", logo: DEFAULT_LOGO, description: "" }}
            templates={templates.value}
            onSubmit$={create}
            onCancel$={$(() => {
              creating.value = false;
            })}
          />
        </section>
      )}

      {loaded.value && identities.value.length === 0 && !creating.value && (
        <p class="quiet">
          <T id="identities.empty" />
        </p>
      )}

      <ul class="identity-list identity-grid">
        {identities.value.map((identity, index) => {
          const present = ATTRIBUTES.filter(
            (name) => identity.attributes[name] !== undefined,
          );
          const list = {
            en: present.map((n) => both(attributeLabel(n)).en).join(", "),
            fr: present.map((n) => both(attributeLabel(n)).fr).join(", "),
          };
          return (
            <li
              key={identity.id}
              class={`card identity-row identity-card hue-${hueAt(index)}`}
            >
              <div class="cluster">
                <IdentityLogo logo={identity.logo} size="l" />
                <div class="stack stack--tight grow">
                  <span class="identity-name">{identity.name}</span>
                  {identity.description && (
                    <span class="quiet small">{identity.description}</span>
                  )}
                </div>
              </div>
              <p class="quiet small">
                {present.length === 0 ? (
                  <T id="identities.card.nothing" />
                ) : (
                  <T id="identities.card.shares" p={{ list }} />
                )}
              </p>
              <a
                class="identity-card-link small"
                href={`/identities/details/?id=${encodeURIComponent(identity.id)}`}
              >
                <T id="identity.open" />
                <span class="sr-only"> ({identity.name})</span>
                <Icon name="arrow-right" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Identities · brig·id",
};
