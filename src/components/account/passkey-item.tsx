import { component$, useSignal, type QRL } from "@qwik.dev/core";
import { Icon } from "~/components/ui/icon";
import { T } from "~/i18n";

interface PasskeyItemProps {
  id: string;
  label: string | null;
  onDelete$: QRL<(id: string) => void>;
  onRename$: QRL<(id: string, label: string) => Promise<void>>;
  /** True for the account's only passkey: there is no other way in, so
   * removing it would lock the person out. The server refuses it too; the
   * disabled button spares them the error. */
  only: boolean;
}

function short(id: string): string {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

export const PasskeyItem = component$<PasskeyItemProps>(
  ({ id, label, onDelete$, onRename$, only }) => {
    const editing = useSignal(false);
    const draft = useSignal(label ?? "");
    const field = `passkey-name-${id}`;
    const name = label ? (
      <span>{label}</span>
    ) : (
      <span class="mono">
        <T id="passkey.unnamed" p={{ id: short(id) }} />
      </span>
    );

    return (
      <li class="passkey-item stack stack--tight">
        {editing.value ? (
          <form
            class="stack"
            preventdefault:submit
            onSubmit$={async () => {
              await onRename$(id, draft.value);
              editing.value = false;
            }}
          >
            <div class="field">
              <label class="field-control">
                <span class="field-label">
                  <T id="passkey.name" />
                </span>
                <input
                  id={field}
                  class="input"
                  bind:value={draft}
                  maxLength={64}
                  autoComplete="off"
                  aria-describedby={`${field}-hint`}
                />
              </label>
              <span id={`${field}-hint`} class="field-hint">
                <T id="passkey.name.hint" />
              </span>
            </div>
            <div class="cluster">
              <button
                type="submit"
                class="button button--small button--primary"
              >
                <T id="common.save" />
              </button>
              <button
                type="button"
                class="button button--small"
                onClick$={() => {
                  draft.value = label ?? "";
                  editing.value = false;
                }}
              >
                <T id="common.cancel" />
              </button>
            </div>
          </form>
        ) : (
          <div class="split">
            <div class="passkey-name grow">
              <Icon name="key" />
              {name}
            </div>
            <div class="cluster">
              <button
                type="button"
                class="button button--small"
                onClick$={() => {
                  editing.value = true;
                }}
              >
                <Icon name="pencil-simple" />
                <T id="passkey.rename" />
                <span class="sr-only"> {label ?? short(id)}</span>
              </button>
              <button
                type="button"
                class="button button--small button--danger"
                disabled={only}
                aria-describedby={only ? `${field}-only` : undefined}
                onClick$={() => onDelete$(id)}
              >
                <Icon name="trash" />
                <T id="passkey.remove" />
                <span class="sr-only"> {label ?? short(id)}</span>
              </button>
            </div>
          </div>
        )}
        {only && !editing.value && (
          <p id={`${field}-only`} class="quiet small">
            <T id="passkey.only" />
          </p>
        )}
      </li>
    );
  },
);
