import {
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
  type Signal,
} from "@qwik.dev/core";
import { Icon } from "~/components/ui/icon";
import { both, T } from "~/i18n";
import {
  type AskedRow,
  type AttributeName,
  attributeLabel,
  AUTOCOMPLETE,
  deviceValue,
} from "~/lib/attributes";

/** An attribute the application asks for and the identity lacks: a field to
 * put it on the identity. A required one is then sent; an optional one is
 * shared like the others, and can be turned off. */
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

/** An attribute the identity lacks, with the field that adds it. */
const Missing = component$<{
  row: AskedRow;
  busy: boolean;
  onAdd$: QRL<(name: AttributeName, value: string) => Promise<void>>;
}>(({ row, busy, onAdd$ }) => (
  <li class="asked-row asked-row--missing" data-attribute={row.name}>
    <span class="asked-name">
      <T id={attributeLabel(row.name)} />
    </span>
    <span class="quiet small">
      <T id="continue.missing" />
    </span>
    <AddAttribute name={row.name} busy={busy} onAdd$={onAdd$} />
  </li>
));

/**
 * What the application asks for, for the identity chosen, in two groups.
 *
 * What it needs is not a choice: each value is shown and sent, and the
 * sign-in waits for the ones the identity lacks. What it would like is the
 * person's to decide: each has a switch, on unless they turned it off (now,
 * or the last time for this application).
 */
export const AskedAttributes = component$<{
  rows: AskedRow[];
  /** The names of the optional attributes left shared. */
  shared: Signal<string[]>;
  busy: boolean;
  onAdd$: QRL<(name: AttributeName, value: string) => Promise<void>>;
}>(({ rows, shared, busy, onAdd$ }) => {
  const needed = rows.filter((row) => row.required);
  const chosen = rows.filter((row) => !row.required);
  return (
    <>
      {needed.length > 0 && (
        <section class="asked" aria-labelledby="asked-needed">
          <h2 id="asked-needed" class="asked-title">
            <Icon name="lock" />
            <T id="continue.needs" />
          </h2>
          <ul class="asked-list asked-list--needed">
            {needed.map((row) =>
              row.value === null ? (
                <Missing key={row.name} row={row} busy={busy} onAdd$={onAdd$} />
              ) : (
                <li
                  key={row.name}
                  class="asked-row asked-row--needed"
                  data-attribute={row.name}
                >
                  <span class="asked-name">
                    <T id={attributeLabel(row.name)} />
                  </span>
                  <span class="asked-value">{row.value}</span>
                </li>
              ),
            )}
          </ul>
        </section>
      )}
      {chosen.length > 0 && (
        <section class="asked" aria-labelledby="asked-chosen">
          <h2 id="asked-chosen" class="asked-title">
            <T id="continue.choose" />
          </h2>
          <ul class="asked-list">
            {chosen.map((row) => {
              if (row.value === null) {
                return (
                  <Missing
                    key={row.name}
                    row={row}
                    busy={busy}
                    onAdd$={onAdd$}
                  />
                );
              }
              const on = shared.value.includes(row.name);
              return (
                <li
                  key={row.name}
                  class="asked-row asked-row--choice"
                  data-attribute={row.name}
                >
                  <span class="asked-text">
                    <span class="asked-name">
                      <T id={attributeLabel(row.name)} />
                    </span>
                    <span class="asked-value">
                      {on ? row.value : <T id="continue.kept" />}
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    class="switch"
                    aria-checked={on ? "true" : "false"}
                    onClick$={() => {
                      shared.value = on
                        ? shared.value.filter((name) => name !== row.name)
                        : [...shared.value, row.name];
                    }}
                  >
                    <span class="sr-only">
                      <T
                        id="continue.share"
                        p={{ attribute: both(attributeLabel(row.name)) }}
                      />
                    </span>
                    <span class="switch-thumb" aria-hidden="true">
                      {on && <Icon name="check" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
});
