import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, Link, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { IdentityLogo } from "~/components/ui/identity-logo";
import { both, type Message, Said, T, titled } from "~/i18n";
import { listIdentities, SessionEndedError } from "~/lib/api";
import type { Identity } from "~/lib/api-types";
import { ATTRIBUTES, attributeLabel, deviceValue } from "~/lib/attributes";
import { takeDeleted } from "~/lib/deleted";
import { failure } from "~/lib/errors";
import { hueAt } from "~/lib/hues";
import { ignoredSuggestions, suggestions } from "~/lib/suggestions";

/**
 * The identities, a card each in its own colour. A card opens the
 * identity's page; a new one has a page of its own (`/identities/new/`).
 */
export default component$(() => {
  const nav = useNavigate();
  const identities = useSignal<Identity[]>([]);
  /** How many suggestions each identity's summary has, by id. */
  const pending = useSignal<Record<string, number>>({});
  /** Whether the list was read: until then, and if reading it failed, the
   * page does not say there is no identity. */
  const loaded = useSignal(false);
  /** Why the list could not be read (e.g. too many requests). */
  const failed = useSignal<Message | null>(null);
  /** The identity just deleted from its own page, said once. Kept apart from
   * `failed`: the deletion is done even when the list then fails to load. */
  const deleted = useSignal<Message | null>(null);

  const refresh = $(async () => {
    try {
      const all = await listIdentities();
      identities.value = all;
      failed.value = null;
      const device = {
        locale: deviceValue("locale"),
        zoneinfo: deviceValue("zoneinfo"),
      };
      const ignored = ignoredSuggestions();
      pending.value = Object.fromEntries(
        all.map((i) => [i.id, suggestions(i, all, device, ignored).length]),
      );
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/");
        return;
      }
      failed.value = failure(err, "error.unexpected");
      return;
    }
    loaded.value = true;
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.identities"));
    // Back from an identity's page that deleted it: it left the name here.
    const name = takeDeleted();
    if (name) deleted.value = { id: "identity.deleted", p: { name } };
    await refresh();
  });

  return (
    <div class="page page--wide stack stack--loose">
      <div class="stack stack--tight">
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
      <div class="cluster">
        <Link class="button button--primary" href="/identities/new/">
          <Icon name="plus" />
          <T id="identities.new" />
        </Link>
        {identities.value.length > 1 && (
          <Link class="button" href="/identities/compare/">
            <Icon name="columns" />
            <T id="identities.compare" />
          </Link>
        )}
      </div>

      {deleted.value && (
        <Callout kind="success" alert>
          <Said message={deleted.value} />
        </Callout>
      )}
      {failed.value && (
        <Callout kind="danger" alert>
          <Said message={failed.value} />
        </Callout>
      )}

      {loaded.value && identities.value.length === 0 && (
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
          const tips = pending.value[identity.id] ?? 0;
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
                  <T id="identities.card.has" p={{ list }} />
                )}
              </p>
              {tips > 0 && (
                <p class="tip-badge small">
                  <Icon name="lightbulb" />
                  <T
                    id={
                      tips === 1
                        ? "identities.card.suggestion"
                        : "identities.card.suggestions"
                    }
                    p={{ count: tips }}
                  />
                </p>
              )}
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
