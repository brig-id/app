import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@qwik.dev/core";
import { useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { dateParam, type Message, Said, T, tr } from "~/i18n";
import {
  createRecoveryCode,
  recoveryStatus,
  SessionEndedError,
} from "~/lib/api";
import type { RecoveryStatus } from "~/lib/api-types";
import { failure } from "~/lib/errors";

/**
 * The account's recovery code: its status, and a new code shown once, to
 * copy or download.
 *
 * `onboarding`: creates a code right away when the account has none, and
 * reports through `onKept$` once the person confirms they kept it.
 */
export const RecoveryCodePanel = component$<{
  onboarding?: boolean;
  onKept$?: QRL<(kept: boolean) => void>;
}>(({ onboarding = false, onKept$ }) => {
  const nav = useNavigate();
  const status = useSignal<RecoveryStatus | null>(null);
  const code = useSignal<string | null>(null);
  const busy = useSignal(false);
  const replacing = useSignal(false);
  const copied = useSignal(false);
  const kept = useSignal(false);
  const error = useSignal<Message | null>(null);

  const fail = $(async (err: unknown) => {
    if (err instanceof SessionEndedError) {
      await nav("/");
      return;
    }
    error.value = failure(err, "error.unexpected");
  });

  const create = $(async () => {
    busy.value = true;
    replacing.value = false;
    error.value = null;
    try {
      code.value = await createRecoveryCode();
      copied.value = false;
      kept.value = false;
      if (onKept$) await onKept$(false);
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
    <section class="stack" aria-labelledby="recovery-title">
      <div class="stack stack--tight">
        <h2 id="recovery-title">
          <T id="recovery.title" />
        </h2>
        <p class="quiet">
          <T id="recovery.lead" />
        </p>
      </div>

      {error.value && (
        <Callout kind="danger" alert>
          <Said message={error.value} />
        </Callout>
      )}

      {code.value ? (
        <div class="stack">
          <Callout kind="warning">
            <T id="recovery.once" />
          </Callout>
          <fieldset>
            <legend class="sr-only">
              <T id="recovery.value" />
            </legend>
            <code class="recovery-value">{code.value}</code>
          </fieldset>
          <div class="cluster">
            <button
              type="button"
              class="button button--small"
              onClick$={async () => {
                await navigator.clipboard.writeText(code.value ?? "");
                copied.value = true;
              }}
            >
              <Icon name={copied.value ? "check" : "copy"} />
              <T id={copied.value ? "recovery.copied" : "recovery.copy"} />
            </button>
            <button
              type="button"
              class="button button--small"
              onClick$={() => {
                const server = window.location.hostname;
                const blob = new Blob(
                  [tr("recovery.file", { code: code.value ?? "", server })],
                  { type: "text/plain;charset=utf-8" },
                );
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `brig-id-recovery-code-${server}.txt`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              <Icon name="download-simple" />
              <T id="recovery.download" />
            </button>
          </div>
          <label class="check">
            <input
              type="checkbox"
              checked={kept.value}
              onChange$={async (_, el) => {
                kept.value = el.checked;
                if (onKept$) await onKept$(el.checked);
              }}
            />
            <span>
              <T id="recovery.kept" />
            </span>
          </label>
        </div>
      ) : (
        status.value && (
          <p>
            {status.value.code_created_at ? (
              <T
                id="recovery.has"
                p={{ date: dateParam(status.value.code_created_at) }}
              />
            ) : (
              <T id="recovery.none" />
            )}
            {status.value.last_used_at && (
              <>
                {" "}
                <T
                  id="recovery.last-used"
                  p={{ date: dateParam(status.value.last_used_at) }}
                />
              </>
            )}
          </p>
        )
      )}

      {!code.value && status.value && !replacing.value && (
        <div>
          <button
            type="button"
            class={
              status.value.code_created_at
                ? "button button--small"
                : "button button--primary"
            }
            disabled={busy.value}
            onClick$={() => {
              // A code that exists stops working when replaced: asked first.
              if (status.value?.code_created_at) replacing.value = true;
              else return create();
            }}
          >
            <T
              id={
                status.value.code_created_at
                  ? "recovery.replace"
                  : "recovery.create"
              }
            />
          </button>
        </div>
      )}

      {replacing.value && (
        <div class="confirm stack">
          <p>
            <T id="recovery.replace.confirm" />
          </p>
          <div class="cluster">
            <button
              type="button"
              class="button button--small button--danger"
              disabled={busy.value}
              onClick$={create}
            >
              <T id="recovery.replace.yes" />
            </button>
            <button
              type="button"
              class="button button--small"
              onClick$={() => {
                replacing.value = false;
              }}
            >
              <T id="common.cancel" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
});
