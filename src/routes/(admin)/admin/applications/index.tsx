import {
  $,
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
} from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import {
  AttributeNeeds,
  needsOf,
  noNeeds,
  toAttributes,
} from "~/components/admin/attribute-needs";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { Said, T, titled } from "~/i18n";
import {
  listApplications,
  registerApplication,
  removeApplication,
  setApplicationAttributes,
} from "~/lib/admin";
import { done, type Notice, notDone } from "~/lib/admin-notice";
import { SessionEndedError } from "~/lib/api";
import type { AdminApplication, RegisteredApplication } from "~/lib/api-types";
import { attributeLabel, isAttribute } from "~/lib/attributes";

/**
 * The applications that may ask this server to sign people in: registering
 * one, saying what it may ask people to share, removing it.
 */
export default component$(() => {
  const nav = useNavigate();
  const applications = useSignal<AdminApplication[]>([]);
  const loaded = useSignal(false);
  const notice = useSignal<Notice>(null);
  const busy = useSignal(false);

  const adding = useSignal(false);
  const name = useSignal("");
  const uris = useSignal("");
  const confidential = useSignal(true);
  const needs = useStore(noNeeds());
  /** The application just registered, with its secret: shown once. */
  const registered = useSignal<RegisteredApplication | null>(null);

  const editing = useSignal<string | null>(null);
  const editNeeds = useStore(noNeeds());
  const removing = useSignal<string | null>(null);

  const refresh = $(async () => {
    try {
      applications.value = await listApplications();
    } catch (err) {
      if (err instanceof SessionEndedError) await nav("/");
      else notice.value = notDone(err);
    } finally {
      loaded.value = true;
    }
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.admin"));
    await refresh();
  });

  const failed = $(async (err: unknown) => {
    if (err instanceof SessionEndedError) await nav("/");
    else notice.value = notDone(err);
  });

  const register = $(async () => {
    busy.value = true;
    notice.value = null;
    try {
      registered.value = await registerApplication({
        name: name.value,
        redirect_uris: uris.value
          .split("\n")
          .map((uri) => uri.trim())
          .filter(Boolean),
        confidential: confidential.value,
        attributes: toAttributes(needs),
      });
      adding.value = false;
      name.value = "";
      uris.value = "";
      Object.assign(needs, noNeeds());
      await refresh();
    } catch (err) {
      await failed(err);
    } finally {
      busy.value = false;
    }
  });

  const save = $(async (application: AdminApplication) => {
    busy.value = true;
    notice.value = null;
    try {
      await setApplicationAttributes(
        application.client_id,
        toAttributes(editNeeds),
      );
      editing.value = null;
      notice.value = done({ id: "admin.app.saved" });
      await refresh();
    } catch (err) {
      await failed(err);
    } finally {
      busy.value = false;
    }
  });

  const remove = $(async (application: AdminApplication) => {
    busy.value = true;
    notice.value = null;
    try {
      await removeApplication(application.client_id);
      removing.value = null;
      notice.value = done({
        id: "admin.app.removed",
        p: { name: application.name },
      });
      await refresh();
    } catch (err) {
      await failed(err);
    } finally {
      busy.value = false;
    }
  });

  return (
    <>
      <div class="split">
        <div class="stack stack--tight grow">
          <h1>
            <T id="admin.apps.title" />
          </h1>
          <p class="quiet">
            <T id="admin.apps.lead" />
          </p>
        </div>
        {!adding.value && (
          <button
            type="button"
            class="button button--primary"
            onClick$={() => {
              adding.value = true;
              registered.value = null;
              notice.value = null;
            }}
          >
            <Icon name="plus" />
            <T id="admin.apps.new" />
          </button>
        )}
      </div>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}

      {registered.value && (
        <section class="card stack" aria-labelledby="registered-title">
          <Callout kind="success" alert>
            <span id="registered-title">
              <T
                id="admin.app.registered"
                p={{ name: registered.value.name }}
              />
            </span>
          </Callout>
          <dl class="attributes">
            <div class="attribute">
              <dt>
                <T id="admin.app.client-id" />
              </dt>
              <dd class="mono" data-value="client-id">
                {registered.value.client_id}
              </dd>
            </div>
            {registered.value.client_secret !== null && (
              <div class="attribute">
                <dt>
                  <T id="admin.app.secret" />
                </dt>
                <dd class="mono" data-value="client-secret">
                  {registered.value.client_secret}
                </dd>
              </div>
            )}
          </dl>
          {registered.value.client_secret !== null && (
            <p class="quiet small">
              <T id="admin.app.secret.once" />
            </p>
          )}
        </section>
      )}

      {adding.value && (
        <section class="card">
          <form
            class="stack stack--loose"
            preventdefault:submit
            onSubmit$={register}
          >
            <h2>
              <T id="admin.apps.new" />
            </h2>
            <div class="field">
              <label class="field-control">
                <span class="field-label">
                  <T id="admin.app.name" />
                </span>
                <input
                  class="input"
                  bind:value={name}
                  required
                  maxLength={100}
                  autoComplete="off"
                  aria-describedby="app-name-hint"
                />
              </label>
              <span id="app-name-hint" class="field-hint">
                <T id="admin.app.name.hint" />
              </span>
            </div>
            <div class="field">
              <label class="field-control">
                <span class="field-label">
                  <T id="admin.app.uris" />
                </span>
                <textarea
                  class="input input--mono"
                  bind:value={uris}
                  required
                  rows={2}
                  spellcheck={false}
                  aria-describedby="app-uris-hint"
                />
              </label>
              <span id="app-uris-hint" class="field-hint">
                <T id="admin.app.uris.hint" />
              </span>
            </div>
            <div class="field">
              <label class="check">
                <input
                  type="checkbox"
                  checked={confidential.value}
                  aria-describedby="app-secret-hint"
                  onChange$={(_, input) => {
                    confidential.value = input.checked;
                  }}
                />
                <span>
                  <T id="admin.app.confidential" />
                </span>
              </label>
              <span id="app-secret-hint" class="field-hint">
                <T id="admin.app.confidential.hint" />
              </span>
            </div>
            <AttributeNeeds needs={needs} group="new" />
            <div class="cluster">
              <button
                type="submit"
                class="button button--primary"
                disabled={
                  busy.value || !name.value.trim() || !uris.value.trim()
                }
              >
                <T id="admin.app.register" />
              </button>
              <button
                type="button"
                class="button"
                onClick$={() => {
                  adding.value = false;
                }}
              >
                <T id="common.cancel" />
              </button>
            </div>
          </form>
        </section>
      )}

      {loaded.value && applications.value.length === 0 && !adding.value && (
        <p class="quiet">
          <T id="admin.apps.none" />
        </p>
      )}

      <ul class="identity-list">
        {applications.value.map((application) => {
          const asked = Object.entries(application.attributes);
          return (
            <li
              key={application.client_id}
              class="card identity-row stack"
              data-application={application.name}
            >
              <div class="split">
                <div class="stack stack--tight grow">
                  <span class="identity-name">
                    {application.host ?? application.name}
                  </span>
                  {application.described && (
                    <span class="quiet small">
                      <T
                        id="admin.app.described"
                        p={{ name: application.name }}
                      />
                    </span>
                  )}
                  <span class="quiet small mono">{application.client_id}</span>
                  {application.redirect_uris.map((uri) => (
                    <span key={uri} class="quiet small mono">
                      {uri}
                    </span>
                  ))}
                  <span class="quiet small">
                    <T
                      id={
                        application.described
                          ? application.confidential
                            ? "admin.app.signs"
                            : "admin.app.public"
                          : application.confidential
                            ? "admin.app.has-secret"
                            : "admin.app.public"
                      }
                    />
                  </span>
                </div>
                <div class="cluster">
                  <button
                    type="button"
                    class="button button--small"
                    aria-expanded={editing.value === application.client_id}
                    onClick$={() => {
                      if (editing.value === application.client_id) {
                        editing.value = null;
                        return;
                      }
                      Object.assign(editNeeds, needsOf(application.attributes));
                      editing.value = application.client_id;
                      removing.value = null;
                    }}
                  >
                    <Icon name="pencil-simple" />
                    <T id="admin.app.edit" />
                    <span class="sr-only"> ({application.name})</span>
                  </button>
                  <button
                    type="button"
                    class="button button--small button--danger"
                    aria-expanded={removing.value === application.client_id}
                    onClick$={() => {
                      removing.value =
                        removing.value === application.client_id
                          ? null
                          : application.client_id;
                      editing.value = null;
                    }}
                  >
                    <Icon name="trash" />
                    <T id="admin.app.remove" />
                    <span class="sr-only"> ({application.name})</span>
                  </button>
                </div>
              </div>

              {editing.value === application.client_id ? (
                <form
                  class="stack"
                  preventdefault:submit
                  onSubmit$={() => save(application)}
                >
                  <AttributeNeeds
                    needs={editNeeds}
                    group={`edit-${application.client_id}`}
                  />
                  <div class="cluster">
                    <button
                      type="submit"
                      class="button button--primary button--small"
                      disabled={busy.value}
                    >
                      <T id="common.save" />
                    </button>
                    <button
                      type="button"
                      class="button button--small"
                      onClick$={() => {
                        editing.value = null;
                      }}
                    >
                      <T id="common.cancel" />
                    </button>
                  </div>
                </form>
              ) : asked.length === 0 ? (
                <p class="quiet small">
                  <T id="admin.app.asks.nothing" />
                </p>
              ) : (
                <div class="stack stack--tight">
                  <span class="quiet small">
                    <T id="admin.app.asks" />
                  </span>
                  <ul class="cluster asks">
                    {asked.map(([claim, need]) => (
                      <li key={claim} class="tag">
                        {isAttribute(claim) ? (
                          <T id={attributeLabel(claim)} />
                        ) : (
                          claim
                        )}
                        {" · "}
                        <T
                          id={
                            need === "required"
                              ? "admin.app.need.required"
                              : "admin.app.need.optional"
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {removing.value === application.client_id && (
                <div class="confirm stack">
                  <p>
                    <T
                      id="admin.app.remove.confirm"
                      p={{ name: application.name }}
                    />
                  </p>
                  <div class="cluster">
                    <button
                      type="button"
                      class="button button--small button--danger"
                      disabled={busy.value}
                      onClick$={() => remove(application)}
                    >
                      <T id="admin.app.remove.yes" />
                    </button>
                    <button
                      type="button"
                      class="button button--small"
                      onClick$={() => {
                        removing.value = null;
                      }}
                    >
                      <T id="common.cancel" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
});

export const head: DocumentHead = {
  title: "Administration · brig·id",
};
