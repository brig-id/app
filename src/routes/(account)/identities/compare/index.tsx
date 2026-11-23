import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { IdentityLogo } from "~/components/ui/identity-logo";
import { both, type Message, Said, T, titled } from "~/i18n";
import { listApplications, listIdentities, SessionEndedError } from "~/lib/api";
import type { Identity, IdentityApplication } from "~/lib/api-types";
import { ATTRIBUTES, attributeLabel } from "~/lib/attributes";
import { isShared, sameValues } from "~/lib/compare";
import { failure } from "~/lib/errors";
import { hueAt } from "~/lib/hues";

/**
 * The identities side by side: what each can share, and where each is
 * used. The point is to see them apart, and to notice what would join them:
 * the same value carried by two identities, which an application receiving
 * it from both could match.
 */
export default component$(() => {
  const nav = useNavigate();
  const identities = useSignal<Identity[]>([]);
  /** Applications per identity id. */
  const used = useSignal<Record<string, IdentityApplication[]>>({});
  const loaded = useSignal(false);
  const error = useSignal<Message | null>(null);

  const load = $(async () => {
    try {
      const all = await listIdentities();
      // One identity after the other, not all at once: the server limits
      // how fast an account's pages may ask.
      const applications: Record<string, IdentityApplication[]> = {};
      for (const identity of all) {
        // oxlint-disable-next-line no-await-in-loop -- sequential on purpose
        applications[identity.id] = await listApplications(identity.id);
      }
      identities.value = all;
      used.value = applications;
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

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.compare"));
    await load();
  });

  const all = identities.value;
  const same = sameValues(all);
  /** An application used by two identities or more: it sees two strangers. */
  const sites = new Map<string, { name: string; count: number }>();
  for (const identity of all) {
    for (const app of used.value[identity.id] ?? []) {
      const seen = sites.get(app.client_id);
      sites.set(app.client_id, {
        name: app.name,
        count: (seen?.count ?? 0) + 1,
      });
    }
  }
  const sharedSites = [...sites.values()].filter((s) => s.count > 1);

  return (
    <div class="page page--wide stack stack--loose">
      <a class="back-link small" href="/identities/">
        <Icon name="arrow-left" />
        <T id="identity.back" />
      </a>
      <div class="stack stack--tight">
        <p class="eyebrow">
          <T id="compare.eyebrow" />
        </p>
        <h1>
          <T id="compare.title.lead" />{" "}
          <span class="accent spectrum">
            <T id="compare.title.accent" />
          </span>
        </h1>
        <p class="quiet">
          <T id="compare.lead" />
        </p>
      </div>

      {error.value && (
        <Callout kind="danger" alert>
          <Said message={error.value} />
        </Callout>
      )}

      {!loaded.value && (
        <output class="quiet">
          <T id="common.loading" />
        </output>
      )}

      {loaded.value && all.length > 0 && (
        <>
          <Callout kind="warning">
            <div class="stack stack--tight">
              <p>
                <T id="compare.apart" />
              </p>
              {same.length > 0 && (
                <>
                  <p>
                    <T id="compare.same.lead" />
                  </p>
                  <ul class="stack stack--tight">
                    {same.map((s) => (
                      <li key={`${s.name}-${s.identities[0]!.id}`}>
                        <T
                          id="compare.same"
                          p={{
                            attribute: both(attributeLabel(s.name)),
                            identities: s.identities
                              .map((i) => i.name)
                              .join(", "),
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Callout>

          <div class="compare-wrap card">
            <table class="compare">
              <caption class="sr-only">
                <T id="compare.caption" />
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span class="sr-only">
                      <T id="compare.attribute" />
                    </span>
                  </th>
                  {all.map((identity, index) => (
                    <th
                      key={identity.id}
                      scope="col"
                      class={`hue-${hueAt(index)}`}
                    >
                      <a
                        class="cluster"
                        href={`/identities/details/?id=${encodeURIComponent(identity.id)}`}
                      >
                        <IdentityLogo logo={identity.logo} size="s" />
                        <span class="identity-name">{identity.name}</span>
                      </a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ATTRIBUTES.map((name) => (
                  <tr key={name}>
                    <th scope="row">
                      <T id={attributeLabel(name)} />
                    </th>
                    {all.map((identity) => {
                      const value = identity.attributes[name];
                      if (value === undefined)
                        return (
                          <td key={identity.id} class="absent">
                            —
                          </td>
                        );
                      const joined = isShared(same, name, identity);
                      return (
                        <td key={identity.id} class={joined ? "same" : ""}>
                          {value}
                          {joined && (
                            <span class="sr-only">
                              {" "}
                              <T id="compare.same.short" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <th scope="row">
                    <T id="compare.used-by" />
                  </th>
                  {all.map((identity) => {
                    const apps = used.value[identity.id] ?? [];
                    return (
                      <td key={identity.id}>
                        {apps.length === 0 ? (
                          <span class="absent">
                            <T id="compare.used-by.none" />
                          </span>
                        ) : (
                          <ul class="stack stack--tight">
                            {apps.map((app) => (
                              <li key={app.client_id}>{app.name}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {sharedSites.length > 0 && (
            <p class="quiet small">
              <T
                id="compare.two-strangers"
                p={{ sites: sharedSites.map((s) => s.name).join(", ") }}
              />
            </p>
          )}
        </>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Compare · brig·id",
};
