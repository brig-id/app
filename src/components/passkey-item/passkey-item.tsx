import { $, component$, useSignal, type QRL } from "@builder.io/qwik";
import { useWaClick } from "~/lib/wa";

interface PasskeyItemProps {
  id: string;
  onDelete$: QRL<(id: string) => void>;
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
  ({ id, onDelete$, disableRemove }) => {
    const removeRef = useSignal<HTMLElement>();
    useWaClick(
      removeRef,
      $(() => onDelete$(id)),
    );

    return (
      <div class="passkey-item wa-split">
        <div class="wa-cluster wa-gap-s">
          <wa-icon name="key" variant="solid"></wa-icon>
          <span class="passkey-item-id">{truncate(id)}</span>
        </div>
        <wa-button
          ref={removeRef}
          variant="danger"
          appearance="outlined"
          size="s"
          disabled={disableRemove}
          aria-label={`Remove passkey ${truncate(id)}`}
          title={
            disableRemove
              ? "Your only passkey — add another before removing this one"
              : undefined
          }
        >
          Remove
        </wa-button>
      </div>
    );
  },
);
