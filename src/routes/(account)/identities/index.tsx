import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { IconPicker } from "~/components/account/icon-picker";
import { Callout } from "~/components/ui/callout";
import { Icon, LogoIcon } from "~/components/ui/icon";
import { IdentityLogo } from "~/components/ui/identity-logo";
import { isMessage, type Message, Said, T, titled, tr } from "~/i18n";
import {
  createIdentity,
  deleteIdentity,
  listIdentities,
  listTemplates,
  SessionEndedError,
  updateIdentity,
} from "~/lib/api";
import type { Identity, IdentityTemplate } from "~/lib/api-types";
import { failure } from "~/lib/errors";
import { DEFAULT_LOGO, logoName } from "~/lib/icons";

type Notice = { kind: "success" | "danger"; message: Message } | null;

interface FormValues {
  name: string;
  logo: string;
  description: string;
}

/** The form that creates or edits an identity's label: what the person sees
 * of it. No application receives any of these fields. */
const IdentityForm = component$<{
  /** The name of the identity being edited; none when creating. */
  editing?: string;
  initial: FormValues;
  templates?: IdentityTemplate[];
  onSubmit$: QRL<
    (values: FormValues, template: string | null) => Promise<void>
  >;
  onCancel$: QRL<() => void>;
}>(({ editing, initial, templates, onSubmit$, onCancel$ }) => {
  const name = useSignal(initial.name);
  const logo = useSignal(initial.logo);
  const description = useSignal(initial.description);
  const template = useSignal("");
  const busy = useSignal(false);

  /** A template fills the fields, in the page's language when the interface
   * knows it, with the server's words otherwise. */
  const applyTemplate = $((t: IdentityTemplate) => {
    template.value = t.key;
    const title = `template.${t.key}`;
    const about = `template.${t.key}.about`;
    name.value = isMessage(title) ? tr(title) : t.name;
    description.value = isMessage(about) ? tr(about) : t.description;
    logo.value = t.logo;
  });

  return (
    <form
      class="stack stack--loose"
      preventdefault:submit
      onSubmit$={async () => {
        busy.value = true;
        try {
          await onSubmit$(
            {
              name: name.value,
              logo: logo.value,
              description: description.value,
            },
            template.value || null,
          );
        } finally {
          busy.value = false;
        }
      }}
    >
      <h2>
        {editing === undefined ? (
          <T id="identities.new" />
        ) : (
          <T id="identity.form.edit" p={{ name: editing }} />
        )}
      </h2>

      {templates && templates.length > 0 && (
        <fieldset class="field" aria-describedby="template-hint">
          <legend class="field-label">
            <T id="identity.form.template" />
          </legend>
          <div class="templates">
            {templates.map((t) => {
              const title = `template.${t.key}`;
              return (
                <button
                  key={t.key}
                  type="button"
                  class="template"
                  aria-pressed={template.value === t.key}
                  onClick$={() => applyTemplate(t)}
                >
                  <LogoIcon name={logoName(t.logo)} />
                  {isMessage(title) ? <T id={title} /> : t.name}
                </button>
              );
            })}
          </div>
          <span id="template-hint" class="field-hint">
            <T id="identity.form.template.hint" />
          </span>
        </fieldset>
      )}

      <div class="field">
        <label class="field-control">
          <span class="field-label">
            <T id="identity.form.name" />
          </span>
          <input
            id="identity-name"
            class="input"
            bind:value={name}
            required
            maxLength={64}
            autoComplete="off"
            aria-describedby="identity-name-hint"
          />
        </label>
        <span id="identity-name-hint" class="field-hint">
          <T id="identity.form.name.hint" />
        </span>
      </div>

      <div class="field">
        <label class="field-control">
          <span class="field-label">
            <T id="identity.form.description" />{" "}
            <span class="quiet">
              <T id="common.optional" />
            </span>
          </span>
          <textarea
            id="identity-description"
            class="input"
            bind:value={description}
            maxLength={500}
            rows={2}
          />
        </label>
      </div>

      <fieldset class="field">
        <legend class="field-label">
          <T id="identity.form.logo" />
        </legend>
        <IconPicker value={logo} />
      </fieldset>

      <div class="cluster">
        <button
          type="submit"
          class="button button--primary"
          disabled={busy.value || !name.value.trim() || !logo.value}
        >
          <T id={editing === undefined ? "identity.create" : "common.save"} />
        </button>
        <button type="button" class="button" onClick$={onCancel$}>
          <T id="common.cancel" />
        </button>
      </div>
    </form>
  );
});

export default component$(() => {
  const nav = useNavigate();
  const identities = useSignal<Identity[]>([]);
  const templates = useSignal<IdentityTemplate[]>([]);
  const loaded = useSignal(false);
  const creating = useSignal(false);
  const editing = useSignal<string | null>(null);
  const deleting = useSignal<string | null>(null);
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

  const save = $(async (id: string, values: FormValues) => {
    try {
      await updateIdentity(id, values);
      editing.value = null;
      notice.value = { kind: "success", message: { id: "identity.saved" } };
      await refresh();
    } catch (err) {
      await fail(err);
    }
  });

  const remove = $(async (identity: Identity) => {
    try {
      await deleteIdentity(identity.id);
      deleting.value = null;
      notice.value = {
        kind: "success",
        message: { id: "identity.deleted", p: { name: identity.name } },
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
          <h1>
            <T id="identities.title" />
          </h1>
          <p class="quiet">
            <T id="identities.lead" />
          </p>
        </div>
        {!creating.value && (
          <button
            type="button"
            class="button button--primary"
            onClick$={() => {
              creating.value = true;
              editing.value = null;
              deleting.value = null;
            }}
          >
            <Icon name="plus" />
            <T id="identities.new" />
          </button>
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

      <ul class="identity-list">
        {identities.value.map((identity) => (
          <li key={identity.id} class="card identity-row">
            {editing.value === identity.id ? (
              <IdentityForm
                editing={identity.name}
                initial={{
                  name: identity.name,
                  logo: identity.logo,
                  description: identity.description ?? "",
                }}
                onSubmit$={$((values: FormValues) => save(identity.id, values))}
                onCancel$={$(() => {
                  editing.value = null;
                })}
              />
            ) : (
              <div class="stack">
                <div class="split">
                  <div class="cluster grow">
                    <IdentityLogo logo={identity.logo} size="l" />
                    <div class="stack stack--tight grow">
                      <span class="identity-name">{identity.name}</span>
                      {identity.description && (
                        <span class="quiet small">{identity.description}</span>
                      )}
                    </div>
                  </div>
                  <div class="cluster">
                    <button
                      type="button"
                      class="button button--small"
                      onClick$={() => {
                        editing.value = identity.id;
                        creating.value = false;
                        deleting.value = null;
                      }}
                    >
                      <Icon name="pencil-simple" />
                      <T id="identity.edit" />
                      <span class="sr-only"> {identity.name}</span>
                    </button>
                    <button
                      type="button"
                      class="button button--small button--danger"
                      aria-expanded={deleting.value === identity.id}
                      onClick$={() => {
                        deleting.value =
                          deleting.value === identity.id ? null : identity.id;
                      }}
                    >
                      <Icon name="trash" />
                      <T id="identity.delete" />
                      <span class="sr-only"> {identity.name}</span>
                    </button>
                  </div>
                </div>
                {deleting.value === identity.id && (
                  <div class="confirm stack">
                    <p>
                      <T
                        id="identity.delete.confirm"
                        p={{ name: identity.name }}
                      />
                    </p>
                    <div class="cluster">
                      <button
                        type="button"
                        class="button button--small button--danger"
                        onClick$={() => remove(identity)}
                      >
                        <T id="identity.delete.yes" />
                      </button>
                      <button
                        type="button"
                        class="button button--small"
                        onClick$={() => {
                          deleting.value = null;
                        }}
                      >
                        <T id="common.cancel" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Identities · brig·id",
};
