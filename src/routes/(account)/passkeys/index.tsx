import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { delay } from "helpers4/promise";
import { PasskeyItem } from "~/components/account/passkey-item";
import { RecoveryCodePanel } from "~/components/account/recovery-code";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { type Message, Said, T, titled } from "~/i18n";
import {
  deletePasskey,
  listPasskeys,
  renamePasskey,
  SessionEndedError,
} from "~/lib/api";
import type { PasskeySummary } from "~/lib/api-types";
import { failure } from "~/lib/errors";
import { addCredential, WebAuthnError } from "~/lib/webauthn";

type Notice = { kind: "success" | "danger"; message: Message } | null;

export default component$(() => {
  const nav = useNavigate();
  const passkeys = useSignal<PasskeySummary[]>([]);
  const notice = useSignal<Notice>(null);
  const adding = useSignal(false);

  const refresh = $(async () => {
    const load = async () => {
      try {
        passkeys.value = await listPasskeys();
        return true;
      } catch (err) {
        if (err instanceof SessionEndedError) {
          await nav("/");
          return true;
        }
        return false;
      }
    };
    if (await load()) return;
    // One more try after a pause: the first can fall on a rate limit right
    // after a ceremony.
    await delay(3500);
    if (!(await load())) {
      notice.value = {
        kind: "danger",
        message: { id: "passkeys.load-failed" },
      };
    }
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.passkeys"));
    await refresh();
  });

  const remove = $(async (id: string) => {
    try {
      await deletePasskey(id);
      notice.value = { kind: "success", message: { id: "passkeys.removed" } };
      await refresh();
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/");
        return;
      }
      notice.value = {
        kind: "danger",
        message: failure(err, "passkeys.remove-failed"),
      };
    }
  });

  const rename = $(async (id: string, label: string) => {
    try {
      await renamePasskey(id, label);
      notice.value = { kind: "success", message: { id: "passkeys.renamed" } };
      await refresh();
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/");
        return;
      }
      notice.value = {
        kind: "danger",
        message: failure(err, "passkeys.rename-failed"),
      };
    }
  });

  const add = $(async () => {
    adding.value = true;
    try {
      await addCredential();
      notice.value = { kind: "success", message: { id: "passkeys.added" } };
      await refresh();
    } catch (err) {
      notice.value = {
        kind: "danger",
        message:
          err instanceof WebAuthnError && err.kind === "browser"
            ? { id: "passkeys.add-failed" }
            : failure(err, "passkeys.add-failed"),
      };
    } finally {
      adding.value = false;
    }
  });

  return (
    <div class="page stack stack--loose">
      <div class="split">
        <div class="stack stack--tight grow">
          <h1>
            <T id="passkeys.title" />
          </h1>
          <p class="quiet">
            <T id="passkeys.lead" />
          </p>
        </div>
        <button
          type="button"
          class="button button--primary"
          disabled={adding.value}
          onClick$={add}
        >
          <Icon name="plus" />
          <T id="passkeys.add" />
        </button>
      </div>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}

      <section class="card">
        <ul class="passkey-list">
          {passkeys.value.map((passkey) => (
            <PasskeyItem
              key={passkey.id}
              id={passkey.id}
              label={passkey.label}
              onDelete$={remove}
              onRename$={rename}
              only={passkeys.value.length <= 1}
            />
          ))}
        </ul>
      </section>

      <section class="card">
        <RecoveryCodePanel />
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Passkeys · brig·id",
};
