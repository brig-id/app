import {
  $,
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
} from "@qwik.dev/core";
import {
  type DocumentHead,
  Link,
  useLocation,
  useNavigate,
} from "@qwik.dev/router";
import { IDENTITIES_MENU } from "~/components/account/identities-context";
import { AttributesForm } from "~/components/account/attributes-form";
import {
  type FormValues,
  IdentityForm,
} from "~/components/account/identity-form";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { IdentityLogo } from "~/components/ui/identity-logo";
import { both, dateParam, type Message, Said, T, titled } from "~/i18n";
import {
  deleteIdentity,
  listApplications,
  listIdentities,
  SessionEndedError,
  updateIdentity,
  withdrawApplication,
  withdrawAttribute,
} from "~/lib/api";
import type { Identity, IdentityApplication } from "~/lib/api-types";
import {
  ATTRIBUTES,
  type AttributeName,
  attributeLabel,
  deviceValue,
  isAttribute,
} from "~/lib/attributes";
import { failure } from "~/lib/errors";
import { leaveDeleted } from "~/lib/deleted";
import { hueOf } from "~/lib/hues";
import {
  ignoredSuggestions,
  ignoreSuggestion,
  type Suggestion,
  suggestionKey,
  suggestions,
} from "~/lib/suggestions";

type Tab = "summary" | "info" | "usage";
const TABS: readonly {
  key: Tab;
  label: "identity.tab.summary" | "identity.tab.info" | "identity.tab.usage";
}[] = [
  { key: "summary", label: "identity.tab.summary" },
  { key: "info", label: "identity.tab.info" },
  { key: "usage", label: "identity.tab.usage" },
];

type Notice = { kind: "success" | "danger"; message: Message } | null;

/** The name of an attribute for a person; the claim's own name when a newer
 * server knows one this interface does not. */
const Named = (props: { name: string }) =>
  isAttribute(props.name) ? <T id={attributeLabel(props.name)} /> : props.name;

/**
 * One identity, in three tabs: a summary (with suggestions), its
 * information (edited there), and its usage: the applications it signed in
 * to, with what each one was given and when, and the way to withdraw it.
 * "Connected to" is the other direction, what the identity itself uses:
 * nothing in this version.
 */
export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();
  const menu = useContext(IDENTITIES_MENU);
  const tab = useSignal<Tab>("summary");
  /** Suggestions ignored on this browser, read once the page is shown. */
  const ignored = useSignal<string[]>([]);
  const identities = useSignal<Identity[]>([]);
  const identityId = useSignal("");
  const applications = useSignal<IdentityApplication[]>([]);
  const loaded = useSignal(false);
  const editing = useSignal(false);
  /** Its label (name, icon, description) is being edited. */
  const relabeling = useSignal(false);
  const deleting = useSignal(false);
  /** The application whose withdrawal is being confirmed. */
  const withdrawing = useSignal<string | null>(null);
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
      applications.value = identities.value.some(
        (i) => i.id === identityId.value,
      )
        ? await listApplications(identityId.value)
        : [];
    } catch (err) {
      await fail(err);
    } finally {
      loaded.value = true;
    }
  });

  useVisibleTask$(({ cleanup }) => {
    cleanup(titled("title.identity"));
  });

  // The menu moves from one identity to another on this same page: the
  // address says which, and which tab. The router's address only says when
  // it changed: on a page built ahead of time, opened from a plain link, it
  // has no query string. The browser's has.
  useVisibleTask$(async ({ track }) => {
    track(() => loc.url.href);
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") ?? "";
    const wanted = params.get("tab");
    tab.value = wanted === "info" || wanted === "usage" ? wanted : "summary";
    ignored.value = [...ignoredSuggestions()];
    if (id !== identityId.value || !loaded.value) {
      identityId.value = id;
      editing.value = false;
      relabeling.value = false;
      deleting.value = false;
      notice.value = null;
      await refresh();
    }
  });

  const show = $((next: Tab) => {
    tab.value = next;
    const url = new URL(window.location.href);
    if (next === "summary") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    history.replaceState(history.state, "", url);
  });

  const apply = $(async (s: Suggestion) => {
    try {
      await updateIdentity(identityId.value, {
        attributes: { [s.name]: s.value },
      });
      notice.value = {
        kind: "success",
        message: { id: "identity.attributes.saved" },
      };
      await refresh();
      menu.changed.value++;
    } catch (err) {
      await fail(err);
    }
  });

  const ignore = $((key: string) => {
    ignoreSuggestion(key);
    ignored.value = [...ignored.value, key];
  });

  const save = $(async (attributes: Record<AttributeName, string>) => {
    try {
      await updateIdentity(identityId.value, { attributes });
      editing.value = false;
      notice.value = {
        kind: "success",
        message: { id: "identity.attributes.saved" },
      };
      await refresh();
    } catch (err) {
      if (err instanceof SessionEndedError) await fail(err);
      else {
        notice.value = {
          kind: "danger",
          message: failure(err, "identity.attributes.invalid"),
        };
      }
    }
  });

  const relabel = $(async (values: FormValues) => {
    try {
      await updateIdentity(identityId.value, values);
      relabeling.value = false;
      notice.value = { kind: "success", message: { id: "identity.saved" } };
      await refresh();
      menu.changed.value++;
    } catch (err) {
      await fail(err);
    }
  });

  const remove = $(async (name: string) => {
    try {
      await deleteIdentity(identityId.value);
      leaveDeleted(name);
      menu.changed.value++;
      await nav("/identities/");
    } catch (err) {
      await fail(err);
    }
  });

  const stop = $(async (application: IdentityApplication, name: string) => {
    try {
      await withdrawAttribute(identityId.value, application.client_id, name);
      notice.value = {
        kind: "success",
        message: { id: "identity.app.stopped", p: { app: application.name } },
      };
      await refresh();
    } catch (err) {
      await fail(err);
    }
  });

  const withdraw = $(async (application: IdentityApplication) => {
    try {
      await withdrawApplication(identityId.value, application.client_id);
      withdrawing.value = null;
      notice.value = {
        kind: "success",
        message: { id: "identity.app.withdrawn", p: { app: application.name } },
      };
      await refresh();
    } catch (err) {
      await fail(err);
    }
  });

  const identity = identities.value.find((i) => i.id === identityId.value);
  const back = (
    <p>
      <Link href="/identities/" class="back-link">
        <Icon name="arrow-left" />
        <T id="identity.back" />
      </Link>
    </p>
  );

  if (!loaded.value) {
    return (
      <div class="page stack stack--loose">
        {back}
        <output class="quiet">
          <T id="common.loading" />
        </output>
      </div>
    );
  }
  if (identity === undefined) {
    return (
      <div class="page stack stack--loose">
        {back}
        <h1>
          <T id="title.identity" />
        </h1>
        {notice.value ? (
          <Callout kind={notice.value.kind} alert>
            <Said message={notice.value.message} />
          </Callout>
        ) : (
          <Callout kind="info">
            <T id="identity.gone" />
          </Callout>
        )}
      </div>
    );
  }

  const present = ATTRIBUTES.filter(
    (name) => identity.attributes[name] !== undefined,
  );
  const presentList = {
    en: present.map((n) => both(attributeLabel(n)).en).join(", "),
    fr: present.map((n) => both(attributeLabel(n)).fr).join(", "),
  };
  const tips = suggestions(
    identity,
    identities.value,
    { locale: deviceValue("locale"), zoneinfo: deviceValue("zoneinfo") },
    new Set(ignored.value),
  );
  return (
    <div
      class={`page page--wide stack stack--loose hue-${hueOf(
        identities.value.map((i) => i.id),
        identity.id,
      )}`}
    >
      {back}
      {relabeling.value ? (
        <section class="card">
          <IdentityForm
            editing={identity.name}
            initial={{
              name: identity.name,
              logo: identity.logo,
              description: identity.description ?? "",
            }}
            onSubmit$={relabel}
            onCancel$={$(() => {
              relabeling.value = false;
            })}
          />
        </section>
      ) : (
        <div class="identity-hero">
          <IdentityLogo logo={identity.logo} size="l" />
          <div class="stack stack--tight grow">
            <p class="eyebrow">
              <T id="identity.eyebrow" />
            </p>
            <h1 class="identity-title">
              <span class="accent in-hue">{identity.name}</span>
            </h1>
            {identity.description && (
              <span class="quiet">{identity.description}</span>
            )}
          </div>
          <div class="cluster identity-hero-actions">
            <button
              type="button"
              class="button button--small"
              onClick$={() => {
                relabeling.value = true;
                deleting.value = false;
              }}
            >
              <Icon name="pencil-simple" />
              <T id="identity.edit" />
              <span class="sr-only"> {identity.name}</span>
            </button>
            <button
              type="button"
              class="button button--small button--danger"
              aria-expanded={deleting.value}
              onClick$={() => {
                deleting.value = !deleting.value;
              }}
            >
              <Icon name="trash" />
              <T id="identity.delete" />
              <span class="sr-only"> {identity.name}</span>
            </button>
          </div>
        </div>
      )}
      {deleting.value && (
        <div class="confirm stack">
          <p>
            <T id="identity.delete.confirm" p={{ name: identity.name }} />
          </p>
          <div class="cluster">
            <button
              type="button"
              class="button button--small button--danger"
              onClick$={() => remove(identity.name)}
            >
              <T id="identity.delete.yes" />
            </button>
            <button
              type="button"
              class="button button--small"
              onClick$={() => {
                deleting.value = false;
              }}
            >
              <T id="common.cancel" />
            </button>
          </div>
        </div>
      )}
      <p class="quiet small">
        <T id="identity.label.note" />
      </p>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}

      <div class="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-controls="identity-panel"
            aria-selected={tab.value === t.key}
            class="tab"
            onClick$={() => show(t.key)}
          >
            <T id={t.label} />
            {t.key === "summary" && tips.length > 0 && (
              <span class="tab-count">{tips.length}</span>
            )}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="identity-panel"
        class="stack stack--loose"
        aria-labelledby={`tab-${tab.value}`}
      >
        {tab.value === "summary" && (
          <>
            {tips.length > 0 && (
              <section class="card stack" aria-labelledby="tips-title">
                <h2 id="tips-title">
                  <T id="identity.tips.title" />
                </h2>
                <ul class="tips">
                  {tips.map((tip) => {
                    const key = suggestionKey(identity, tip);
                    return (
                      <li key={key} class="tip">
                        <div class="stack stack--tight grow">
                          <span>
                            <T
                              id={
                                tip.kind === "set"
                                  ? "identity.tip.set"
                                  : "identity.tip.change"
                              }
                              p={{ attribute: both(attributeLabel(tip.name)) }}
                            />{" "}
                            <strong class="mono">{tip.value}</strong>
                          </span>
                          <span class="quiet small">
                            {"device" in tip.from ? (
                              <T id="identity.tip.from-device" />
                            ) : (
                              <T
                                id="identity.tip.from-identity"
                                p={{ identity: tip.from.identity }}
                              />
                            )}
                          </span>
                        </div>
                        <div class="cluster">
                          <button
                            type="button"
                            class="button button--small button--primary"
                            onClick$={() => apply(tip)}
                          >
                            <T id="identity.tip.apply" />
                            <span class="sr-only">
                              {" "}
                              <T id={attributeLabel(tip.name)} />
                            </span>
                          </button>
                          <button
                            type="button"
                            class="button button--small"
                            onClick$={() => ignore(key)}
                          >
                            <T id="identity.tip.ignore" />
                            <span class="sr-only">
                              {" "}
                              <T id={attributeLabel(tip.name)} />
                            </span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            <section class="card stack" aria-labelledby="glance-title">
              <h2 id="glance-title">
                <T id="identity.glance.title" />
              </h2>
              <dl class="attributes">
                <div class="attribute">
                  <dt>
                    <T id="identity.info.title" />
                  </dt>
                  <dd>
                    {present.length === 0 ? (
                      <T id="identity.glance.no-info" />
                    ) : (
                      <T id="identity.glance.info" p={{ list: presentList }} />
                    )}{" "}
                    <button
                      type="button"
                      class="link-button"
                      onClick$={() => show("info")}
                    >
                      <T id="identity.glance.see" />
                    </button>
                  </dd>
                </div>
                <div class="attribute">
                  <dt>
                    <T id="identity.used-by" />
                  </dt>
                  <dd>
                    {applications.value.length === 0 ? (
                      <T id="identity.glance.no-apps" />
                    ) : (
                      <T
                        id="identity.glance.apps"
                        p={{
                          list: applications.value
                            .map((a) => a.name)
                            .join(", "),
                        }}
                      />
                    )}{" "}
                    <button
                      type="button"
                      class="link-button"
                      onClick$={() => show("usage")}
                    >
                      <T id="identity.glance.see" />
                    </button>
                  </dd>
                </div>
              </dl>
            </section>
          </>
        )}

        {tab.value === "info" && (
          <>
            <section class="card stack" aria-labelledby="attributes-title">
              <div class="split">
                <h2 id="attributes-title" class="grow">
                  <T id="identity.info.title" />
                </h2>
                {!editing.value && (
                  <button
                    type="button"
                    class="button button--small"
                    onClick$={() => {
                      editing.value = true;
                      notice.value = null;
                    }}
                  >
                    <Icon name="pencil-simple" />
                    <T id="identity.edit" />
                    <span class="sr-only">
                      {" "}
                      <T id="identity.info.title" />
                    </span>
                  </button>
                )}
              </div>
              <p class="quiet">
                <T id="identity.attributes.lead" />
              </p>
              {editing.value ? (
                <AttributesForm
                  identity={identity}
                  identities={identities.value}
                  onSave$={save}
                  onCancel$={$(() => {
                    editing.value = false;
                  })}
                />
              ) : present.length === 0 ? (
                <p class="quiet">
                  <T id="identity.attributes.none" />
                </p>
              ) : (
                <dl class="attributes">
                  {present.map((name) => (
                    <div key={name} class="attribute">
                      <dt>
                        <T id={attributeLabel(name)} />
                      </dt>
                      <dd>{identity.attributes[name]}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          </>
        )}

        {tab.value === "usage" && (
          <>
            <section class="stack" aria-labelledby="used-by-title">
              <h2 id="used-by-title">
                <T id="identity.used-by" />
              </h2>
              <h3>
                <T id="identity.used-by.applications" />
              </h3>
              {applications.value.length === 0 ? (
                <p class="quiet">
                  <T id="identity.used-by.none" />
                </p>
              ) : (
                <ul class="identity-list">
                  {applications.value.map((application) => (
                    <li
                      key={application.client_id}
                      class="card identity-row stack"
                      data-application={application.name}
                    >
                      <div class="split">
                        <span class="identity-name grow">
                          {application.name}
                        </span>
                        <button
                          type="button"
                          class="button button--small button--danger"
                          aria-expanded={
                            withdrawing.value === application.client_id
                          }
                          onClick$={() => {
                            withdrawing.value =
                              withdrawing.value === application.client_id
                                ? null
                                : application.client_id;
                          }}
                        >
                          <T id="identity.app.withdraw" />
                          <span class="sr-only"> {application.name}</span>
                        </button>
                      </div>
                      <p class="quiet small">
                        <T
                          id="identity.app.dates"
                          p={{
                            first: dateParam(application.linked_at),
                            last: dateParam(application.last_used_at),
                          }}
                        />
                      </p>
                      {application.shared.length +
                        application.refused.length ===
                      0 ? (
                        <p>
                          <T id="identity.app.identifier-only" />
                        </p>
                      ) : (
                        <>
                          <p>
                            <T
                              id={
                                application.shared.length > 0
                                  ? "identity.app.received"
                                  : "identity.app.identifier-only"
                              }
                            />
                          </p>
                          <ul class="shared-list">
                            {application.shared.map((shared) => (
                              <li key={shared.name} class="shared-row">
                                <div class="stack stack--tight grow">
                                  <span class="asked-name">
                                    <Named name={shared.name} />
                                  </span>
                                  <span class="shared-value">
                                    {shared.value}
                                  </span>
                                  <span class="quiet small">
                                    <T
                                      id="identity.app.since"
                                      p={{ date: dateParam(shared.since) }}
                                    />
                                  </span>
                                  {identity.attributes[shared.name] !==
                                    shared.value && (
                                    <span class="quiet small">
                                      <T id="identity.app.outdated" />
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  class="button button--small"
                                  onClick$={() =>
                                    stop(application, shared.name)
                                  }
                                >
                                  <T id="identity.app.stop" />
                                  <span class="sr-only">
                                    {" "}
                                    <Named name={shared.name} />
                                    {"("}
                                    {application.name}
                                    {")"}
                                  </span>
                                </button>
                              </li>
                            ))}
                            {application.refused.map((name) => (
                              <li key={name} class="shared-row">
                                <div class="stack stack--tight grow">
                                  <span class="asked-name">
                                    <Named name={name} />
                                  </span>
                                  <span class="quiet small">
                                    <T id="identity.app.refused" />
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  class="button button--small"
                                  onClick$={() => stop(application, name)}
                                >
                                  <T id="identity.app.ask-again" />
                                  <span class="sr-only">
                                    {" "}
                                    <Named name={name} />
                                    {"("}
                                    {application.name}
                                    {")"}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {withdrawing.value === application.client_id && (
                        <div class="confirm stack">
                          <p>
                            <T
                              id="identity.app.withdraw.confirm"
                              p={{ app: application.name }}
                            />
                          </p>
                          <div class="cluster">
                            <button
                              type="button"
                              class="button button--small button--danger"
                              onClick$={() => withdraw(application)}
                            >
                              <T id="identity.app.withdraw.yes" />
                            </button>
                            <button
                              type="button"
                              class="button button--small"
                              onClick$={() => {
                                withdrawing.value = null;
                              }}
                            >
                              <T id="common.cancel" />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section class="stack" aria-labelledby="connected-to-title">
              <h2 id="connected-to-title">
                <T id="identity.connected-to" />
              </h2>
              <p class="quiet">
                <T id="identity.connected-to.none" />
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Identity · brig·id",
};
