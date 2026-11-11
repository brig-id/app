import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import {
  createRecoveryCode,
  recoveryStatus,
  SessionEndedError,
} from "~/lib/api";
import type { RecoveryStatus } from "~/lib/api-types";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** The text of the downloaded file: the code and how to use it. */
function codeFile(code: string, server: string): string {
  return [
    "brig·id recovery code",
    "",
    code,
    "",
    `Server: ${server}`,
    "",
    "If you lose every passkey of your account, open",
    `https://${server}/recover/ and enter this code to add a new passkey.`,
    "It works once; you'll then get a new one.",
    "Anyone with this code can add a passkey to your account: keep it private.",
    "",
  ].join("\n");
}

/**
 * The account's recovery code (ADR-004, app#33/#36): its status, and a new
 * code shown once, to copy or download.
 *
 * `onboarding`: creates a code right away when the account has none, and
 * reports through `onSaved$` once the user confirms they kept it.
 */
export const RecoveryCodePanel = component$<{
  onboarding?: boolean;
  onSaved$?: QRL<(saved: boolean) => void>;
}>(({ onboarding = false, onSaved$ }) => {
  const nav = useNavigate();
  const status = useSignal<RecoveryStatus | null>(null);
  const code = useSignal<string | null>(null);
  const busy = useSignal(false);
  const copied = useSignal(false);
  const saved = useSignal(false);
  const error = useSignal<string | null>(null);

  const fail = $(async (err: unknown) => {
    if (err instanceof SessionEndedError) {
      await nav("/login/");
      return;
    }
    error.value = err instanceof Error ? err.message : "Unexpected error.";
  });

  const create = $(async () => {
    if (
      status.value?.code_created_at &&
      !confirm("Replace your recovery code? The current one will stop working.")
    ) {
      return;
    }
    busy.value = true;
    error.value = null;
    try {
      code.value = await createRecoveryCode();
      copied.value = false;
      saved.value = false;
      if (onSaved$) await onSaved$(false);
      status.value = await recoveryStatus();
    } catch (err) {
      await fail(err);
    } finally {
      busy.value = false;
    }
  });

  useVisibleTask$(async () => {
    try {
      status.value = await recoveryStatus();
      if (onboarding && !status.value.code_created_at) await create();
    } catch (err) {
      await fail(err);
    }
  });

  return (
    <section class="recovery-code wa-stack" aria-labelledby="recovery-title">
      <h2 id="recovery-title" class="wa-heading-m">
        Recovery code
      </h2>
      <p class="quiet">
        If you lose every passkey, this code lets you add a new one. It is the
        only way back into your account: nobody can reset it for you.
      </p>

      {error.value && (
        <wa-callout variant="danger" role="alert">
          <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
          {error.value}
        </wa-callout>
      )}

      {code.value ? (
        <div class="wa-stack wa-gap-s">
          <wa-callout variant="warning">
            <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
            Shown only now. Keep it somewhere safe, apart from your devices: a
            password manager, or printed.
          </wa-callout>
          <code class="recovery-code-value" aria-label="Your recovery code">
            {code.value}
          </code>
          <div class="wa-cluster wa-gap-xs">
            <button
              type="button"
              onClick$={async () => {
                await navigator.clipboard.writeText(code.value ?? "");
                copied.value = true;
              }}
            >
              {copied.value ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick$={() => {
                const blob = new Blob(
                  [codeFile(code.value ?? "", window.location.hostname)],
                  { type: "text/plain" },
                );
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `brig-id-recovery-code-${window.location.hostname}.txt`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              Download
            </button>
          </div>
          <label class="wa-cluster wa-gap-xs">
            <input
              type="checkbox"
              checked={saved.value}
              onChange$={async (_, el) => {
                saved.value = el.checked;
                if (onSaved$) await onSaved$(el.checked);
              }}
            />
            I saved my recovery code
          </label>
        </div>
      ) : (
        status.value && (
          <p>
            {status.value.code_created_at
              ? `You have a recovery code, created on ${formatDate(status.value.code_created_at)}.`
              : "You have no recovery code."}
            {status.value.last_used_at &&
              ` Your account was last recovered on ${formatDate(status.value.last_used_at)}.`}
          </p>
        )
      )}

      {!code.value && status.value && (
        <div>
          <button
            type="button"
            class={status.value.code_created_at ? undefined : "wa-brand"}
            disabled={busy.value}
            onClick$={create}
          >
            {status.value.code_created_at
              ? "Create a new code"
              : "Create a recovery code"}
          </button>
        </div>
      )}
    </section>
  );
});
