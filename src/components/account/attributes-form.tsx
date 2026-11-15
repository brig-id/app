import { component$, useSignal, useStore, type QRL } from "@qwik.dev/core";
import { Callout } from "~/components/ui/callout";
import { type MessageId, T } from "~/i18n";
import type { Identity } from "~/lib/api-types";
import {
  ATTRIBUTES,
  type AttributeName,
  attributeLabel,
  AUTOCOMPLETE,
  identitiesSharingMailbox,
} from "~/lib/attributes";

const HINTS: Partial<Record<AttributeName, MessageId>> = {
  preferred_username: "identity.attributes.username.hint",
  email: "identity.attributes.email.hint",
  locale: "identity.attributes.locale.hint",
  zoneinfo: "identity.attributes.zoneinfo.hint",
};

/**
 * The attributes of one identity: what it can share. Every field is
 * optional; an empty one removes the attribute.
 *
 * Saving shares nothing: an application receives a value only once the
 * person accepted it on the linking page, and is asked again after a change.
 */
export const AttributesForm = component$<{
  identity: Identity;
  /** The account's identities, to warn when an address is on another one. */
  identities: Identity[];
  /** Every attribute, with its new value; empty removes it. */
  onSave$: QRL<(attributes: Record<AttributeName, string>) => Promise<void>>;
  onCancel$: QRL<() => void>;
}>(({ identity, identities, onSave$, onCancel$ }) => {
  const values = useStore<Record<AttributeName, string>>(
    Object.fromEntries(
      ATTRIBUTES.map((name) => [name, identity.attributes[name] ?? ""]),
    ) as Record<AttributeName, string>,
  );
  const busy = useSignal(false);

  const sameMailbox = identitiesSharingMailbox(
    identities,
    identity.id,
    values.email,
  );

  return (
    <form
      class="stack stack--loose"
      preventdefault:submit
      onSubmit$={async () => {
        busy.value = true;
        try {
          await onSave$({ ...values });
        } finally {
          busy.value = false;
        }
      }}
    >
      <Callout kind="info">
        <T id="identity.attributes.linking" />
      </Callout>

      {ATTRIBUTES.map((name) => {
        const hint = HINTS[name];
        return (
          <div key={name} class="field">
            <label class="field-control">
              <span class="field-label">
                <T id={attributeLabel(name)} />{" "}
                <span class="quiet">
                  <T id="common.optional" />
                </span>
              </span>
              <input
                class="input"
                name={name}
                type={name === "email" ? "email" : "text"}
                value={values[name]}
                autoComplete={AUTOCOMPLETE[name]}
                autoCapitalize={
                  name === "given_name" || name === "family_name"
                    ? "words"
                    : "off"
                }
                spellcheck={false}
                maxLength={254}
                aria-describedby={hint ? `attribute-${name}-hint` : undefined}
                onInput$={(_, input) => {
                  values[name] = input.value;
                }}
              />
            </label>
            {hint && (
              <span id={`attribute-${name}-hint`} class="field-hint">
                <T id={hint} />
              </span>
            )}
            {name === "email" &&
              sameMailbox.map((other) => (
                <Callout key={other.id} kind="warning" alert>
                  <T
                    id="identity.attributes.email.same"
                    p={{ name: other.name }}
                  />
                </Callout>
              ))}
          </div>
        );
      })}

      <div class="cluster">
        <button
          type="submit"
          class="button button--primary"
          disabled={busy.value}
        >
          <T id="common.save" />
        </button>
        <button type="button" class="button" onClick$={onCancel$}>
          <T id="common.cancel" />
        </button>
      </div>
    </form>
  );
});
