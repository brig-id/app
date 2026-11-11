import { component$, useSignal, type QRL } from "@builder.io/qwik";

interface PasskeyItemProps {
  id: string;
  label: string | null;
  onDelete$: QRL<(id: string) => void>;
  onRename$: QRL<(id: string, label: string) => Promise<void>>;
  /** True when this is the account's only passkey — brig·id is passkey-only
   * (no password fallback), so removing it would lock the user out. The
   * server refuses this too (409), but disabling the button here avoids
   * making the user hit that error at all. */
  disableRemove: boolean;
}

function truncate(id: string): string {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

export const PasskeyItem = component$<PasskeyItemProps>(
  ({ id, label, onDelete$, onRename$, disableRemove }) => {
    const editing = useSignal(false);
    const draft = useSignal(label ?? "");
    const name = label ?? `Passkey ${truncate(id)}`;

    return (
      <div class="passkey-item wa-split">
        <div class="wa-cluster wa-gap-s">
          <wa-icon name="key" variant="solid"></wa-icon>
          {editing.value ? (
            <form
              class="wa-cluster wa-gap-xs"
              preventdefault:submit
              onSubmit$={async () => {
                await onRename$(id, draft.value);
                editing.value = false;
              }}
            >
              <input
                class="passkey-label-input"
                bind:value={draft}
                maxLength={64}
                placeholder="e.g. Pixel 9, YubiKey"
                aria-label="Passkey name"
              />
              <button type="submit">Save</button>
              <button
                type="button"
                onClick$={() => {
                  draft.value = label ?? "";
                  editing.value = false;
                }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <span class="passkey-item-id">{name}</span>
          )}
        </div>
        {!editing.value && (
          <div class="wa-cluster wa-gap-xs">
            <button
              type="button"
              aria-label={`Rename ${name}`}
              onClick$={() => {
                editing.value = true;
              }}
            >
              Rename
            </button>
            <button
              type="button"
              class="wa-danger"
              disabled={disableRemove}
              aria-label={`Remove passkey ${truncate(id)}`}
              title={
                disableRemove
                  ? "Your only passkey — add another before removing this one"
                  : undefined
              }
              onClick$={() => onDelete$(id)}
            >
              Remove
            </button>
          </div>
        )}
      </div>
    );
  },
);
