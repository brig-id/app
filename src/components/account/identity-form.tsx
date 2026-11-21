import { $, component$, useSignal, type QRL } from "@qwik.dev/core";
import { IconPicker } from "~/components/account/icon-picker";
import { LogoIcon } from "~/components/ui/icon";
import { isMessage, T, tr } from "~/i18n";
import type { IdentityTemplate } from "~/lib/api-types";
import { logoName } from "~/lib/icons";

export interface FormValues {
  name: string;
  logo: string;
  description: string;
}

/** The form that creates or edits an identity's label: what the person sees
 * of it. No application receives any of these fields. */
export const IdentityForm = component$<{
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
