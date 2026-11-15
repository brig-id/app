import {
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
  type Signal,
} from "@qwik.dev/core";
import { both, T } from "~/i18n";
import {
  type AskedRow,
  type AttributeName,
  attributeLabel,
  AUTOCOMPLETE,
  deviceValue,
} from "~/lib/attributes";

const Need = (props: { required: boolean }) => (
  <span class={props.required ? "tag tag--strong" : "tag"}>
    <T id={props.required ? "continue.required" : "continue.optional"} />
  </span>
);

/** An attribute the application asks for and the identity lacks: a field to
 * put it on the identity. Saving it shares nothing: the box that then
 * appears is not ticked. */
const AddAttribute = component$<{
  name: AttributeName;
  busy: boolean;
  onAdd$: QRL<(name: AttributeName, value: string) => Promise<void>>;
}>(({ name, busy, onAdd$ }) => {
  const value = useSignal("");
  useVisibleTask$(() => {
    if (!value.value) value.value = deviceValue(name);
  });
  return (
    <div class="asked-add">
      <label class="field-control grow">
        <span class="sr-only">
          <T
            id="continue.add.label"
            p={{ attribute: both(attributeLabel(name)) }}
          />
        </span>
        <input
          class="input"
          type={name === "email" ? "email" : "text"}
          autoComplete={AUTOCOMPLETE[name]}
          autoCapitalize={
            name === "given_name" || name === "family_name" ? "words" : "off"
          }
          spellcheck={false}
          maxLength={254}
          bind:value={value}
          data-add={name}
        />
      </label>
      <button
        type="button"
        class="button button--small"
        disabled={busy || !value.value.trim()}
        onClick$={() => onAdd$(name, value.value)}
      >
        <T id="continue.add" />
      </button>
    </div>
  );
});

/**
 * What the application asks for, for the identity chosen: each attribute
 * with the value that would be sent, required or optional, and a box the
 * person ticks to accept. A box is ticked when the page opens only if they
 * accepted that very value before.
 */
export const AskedAttributes = component$<{
  app: string;
  rows: AskedRow[];
  /** The names of the attributes ticked. */
  accepted: Signal<string[]>;
  busy: boolean;
  onAdd$: QRL<(name: AttributeName, value: string) => Promise<void>>;
}>(({ app, rows, accepted, busy, onAdd$ }) => (
  <fieldset class="asked" aria-describedby="asked-hint">
    <legend>
      <T id="continue.asks" p={{ app }} />
    </legend>
    <p id="asked-hint" class="quiet small">
      <T id="continue.asks.hint" />
    </p>
    <ul class="asked-list">
      {rows.map((row) =>
        row.value === null ? (
          <li key={row.name} class="asked-row asked-row--missing">
            <div class="asked-head">
              <span class="asked-name">
                <T id={attributeLabel(row.name)} />
              </span>
              <Need required={row.required} />
            </div>
            <span class="quiet small">
              <T id="continue.missing" />
            </span>
            <AddAttribute name={row.name} busy={busy} onAdd$={onAdd$} />
          </li>
        ) : (
          <li key={row.name} class="asked-row">
            <label class="asked-choice">
              <input
                type="checkbox"
                name="attribute"
                value={row.name}
                checked={accepted.value.includes(row.name)}
                aria-describedby={
                  row.decided ? `asked-${row.name}-note` : undefined
                }
                onChange$={(_, input) => {
                  accepted.value = input.checked
                    ? [...accepted.value, row.name]
                    : accepted.value.filter((name) => name !== row.name);
                }}
              />
              <span class="asked-text">
                <span class="asked-name">
                  <T id={attributeLabel(row.name)} />
                </span>
                <span class="asked-value">{row.value}</span>
              </span>
              <Need required={row.required} />
            </label>
            {row.decided && (
              <span
                id={`asked-${row.name}-note`}
                class="asked-note quiet small"
              >
                <T
                  id={
                    row.decided === "accepted"
                      ? "continue.accepted-before"
                      : "continue.refused-before"
                  }
                />
              </span>
            )}
          </li>
        ),
      )}
    </ul>
    {rows.some((row) => row.value === null) && (
      <p class="quiet small">
        <T id="continue.add.hint" />
      </p>
    )}
  </fieldset>
));
