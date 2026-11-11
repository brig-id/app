import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import { type DocumentHead, useNavigate } from "@builder.io/qwik-city";
import { IconPicker } from "~/components/icon-picker/icon-picker";
import { IdentityLogo } from "~/components/identity-logo/identity-logo";
import type { Identity, IdentityTemplate } from "~/lib/api-types";
import {
  createIdentity,
  deleteIdentity,
  listIdentities,
  listTemplates,
  SessionEndedError,
  updateIdentity,
} from "~/lib/api";
import { wa } from "~/lib/wa";

type Message = { kind: "success" | "error"; text: string } | null;

interface FormValues {
  name: string;
  logo: string;
  description: string;
}

/** Create or edit form. Native controls (styled by Web Awesome's native.css)
 * so Qwik's bind:value works without ref plumbing. */
const IdentityForm = component$<{
  title: string;
  submitLabel: string;
  initial: FormValues;
  templates?: IdentityTemplate[];
  onSubmit$: QRL<
    (values: FormValues, template: string | null) => Promise<void>
  >;
  onCancel$: QRL<() => void>;
}>(({ title, submitLabel, initial, templates, onSubmit$, onCancel$ }) => {
  const name = useSignal(initial.name);
  const logo = useSignal(initial.logo);
  const description = useSignal(initial.description);
  const template = useSignal("");
  const busy = useSignal(false);

  const applyTemplate = $((key: string) => {
    template.value = key;
    const t = templates?.find((x) => x.key === key);
    if (!t) return;
    name.value = t.name;
    logo.value = t.logo;
    description.value = t.description;
  });

  return (
    <form
      class="identity-form wa-stack"
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
      <h2 class="wa-heading-m">{title}</h2>
      {templates && (
        <label class="wa-stack wa-gap-2xs">
          Start from
          <select
            value={template.value}
            onChange$={(_, el) => applyTemplate(el.value)}
          >
            <option value="">Scratch</option>
            {templates.map((t) => (
              <option key={t.key} value={t.key}>
                {`${t.name} — ${t.description}`}
              </option>
            ))}
          </select>
        </label>
      )}
      <label class="wa-stack wa-gap-2xs">
        Name
        <input
          bind:value={name}
          required
          maxLength={64}
          autoComplete="off"
          placeholder="e.g. Work"
        />
      </label>
      <label class="wa-stack wa-gap-2xs">
        Description <span class="quiet">(optional)</span>
        <textarea bind:value={description} maxLength={500} rows={2} />
      </label>
      <div class="wa-stack wa-gap-2xs">
        <span>Logo</span>
        <IconPicker value={logo} />
      </div>
      <div class="wa-cluster wa-gap-s">
        <button
          type="submit"
          class="wa-brand"
          disabled={busy.value || !name.value.trim() || !logo.value}
        >
          {submitLabel}
        </button>
        <button type="button" onClick$={onCancel$}>
          Cancel
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
  const message = useSignal<Message>(null);

  const fail = $(async (err: unknown) => {
    if (err instanceof SessionEndedError) {
      await nav("/login/");
      return;
    }
    message.value = {
      kind: "error",
      text: err instanceof Error ? err.message : "Unexpected error.",
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

  useVisibleTask$(async () => {
    void Promise.all([wa.card(), wa.callout(), wa.icon()]);
    await refresh();
    try {
      templates.value = await listTemplates();
    } catch {
      // creating from scratch still works
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
      message.value = {
        kind: "success",
        text: `“${values.name.trim()}” created.`,
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
      message.value = { kind: "success", text: "Identity saved." };
      await refresh();
    } catch (err) {
      await fail(err);
    }
  });

  const remove = $(async (identity: Identity) => {
    if (
      !confirm(`Delete the identity “${identity.name}”? This cannot be undone.`)
    ) {
      return;
    }
    try {
      await deleteIdentity(identity.id);
      message.value = { kind: "success", text: `“${identity.name}” deleted.` };
      await refresh();
    } catch (err) {
      await fail(err);
    }
  });

  return (
    <div class="page wa-stack">
      <div class="wa-split">
        <div>
          <h1 class="wa-heading-l">Identities</h1>
          <p class="quiet">
            What each service sees of you. Services never see your account, and
            two identities can't be linked to each other.
          </p>
        </div>
        {!creating.value && (
          <button
            type="button"
            class="wa-brand"
            onClick$={() => {
              creating.value = true;
              editing.value = null;
            }}
          >
            New identity
          </button>
        )}
      </div>

      {message.value && (
        <wa-callout
          variant={message.value.kind === "success" ? "success" : "danger"}
          role="alert"
        >
          <wa-icon
            slot="icon"
            name={
              message.value.kind === "success"
                ? "circle-check"
                : "circle-exclamation"
            }
          ></wa-icon>
          {message.value.text}
        </wa-callout>
      )}

      {creating.value && (
        <wa-card>
          <IdentityForm
            title="New identity"
            submitLabel="Create"
            initial={{ name: "", logo: "icon:solid:user", description: "" }}
            templates={templates.value}
            onSubmit$={create}
            onCancel$={$(() => {
              creating.value = false;
            })}
          />
        </wa-card>
      )}

      {loaded.value && identities.value.length === 0 && !creating.value && (
        <p class="quiet">No identity yet. Create one to sign in to services.</p>
      )}

      <ul class="identity-list">
        {identities.value.map((identity) => (
          <li key={identity.id}>
            <wa-card>
              {editing.value === identity.id ? (
                <IdentityForm
                  title={`Edit “${identity.name}”`}
                  submitLabel="Save"
                  initial={{
                    name: identity.name,
                    logo: identity.logo,
                    description: identity.description ?? "",
                  }}
                  onSubmit$={$((values: FormValues) =>
                    save(identity.id, values),
                  )}
                  onCancel$={$(() => {
                    editing.value = null;
                  })}
                />
              ) : (
                <div class="identity-row wa-split">
                  <div class="wa-cluster wa-gap-m">
                    <IdentityLogo logo={identity.logo} size="l" />
                    <div class="wa-stack wa-gap-3xs">
                      <strong>{identity.name}</strong>
                      {identity.description && (
                        <span class="quiet">{identity.description}</span>
                      )}
                    </div>
                  </div>
                  <div class="wa-cluster wa-gap-xs">
                    <button
                      type="button"
                      aria-label={`Edit ${identity.name}`}
                      onClick$={() => {
                        editing.value = identity.id;
                        creating.value = false;
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="wa-danger"
                      aria-label={`Delete ${identity.name}`}
                      onClick$={() => remove(identity)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </wa-card>
          </li>
        ))}
      </ul>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Identities — brig·id",
};
