import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { PasskeyItem } from "~/components/account/passkey-item";
import { RecoveryCodePanel } from "~/components/account/recovery-code";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { type Message, type MessageId, Said, T, titled } from "~/i18n";
import {
  deletePasskey,
  listPasskeys,
  renamePasskey,
  SessionEndedError,
} from "~/lib/api";
import type { PasskeySummary } from "~/lib/api-types";
import { failure } from "~/lib/errors";
import {
  addCredential,
  PASSKEY_EXISTS,
  type PasskeyPlace,
  WebAuthnError,
} from "~/lib/webauthn";

/** Where a new passkey can be kept. The last choice names no place: the
 * browser then asks in its own way. */
const PLACES: readonly {
  place: PasskeyPlace | null;
  label: MessageId;
  about: MessageId;
}[] = [
  {
    place: "client-device",
    label: "passkeys.where.device",
    about: "passkeys.where.device.about",
  },
  {
    place: "hybrid",
    label: "passkeys.where.phone",
    about: "passkeys.where.phone.about",
  },
  {
    place: "security-key",
    label: "passkeys.where.key",
    about: "passkeys.where.key.about",
  },
  {
    place: null,
    label: "passkeys.where.any",
    about: "passkeys.where.any.about",
  },
];

type Notice = {
  kind: "success" | "danger" | "info";
  message: Message;
} | null;

export default component$(() => {
  const nav = useNavigate();
  const passkeys = useSignal<PasskeySummary[]>([]);
  const notice = useSignal<Notice>(null);
  const adding = useSignal(false);
  /** Whether the person is being asked where the new passkey will be kept. */
  const choosing = useSignal(false);

  const refresh = $(async () => {
    try {
      passkeys.value = await listPasskeys();
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/");
        return;
      }
      notice.value = {
        kind: "danger",
        message: failure(err, "passkeys.load-failed"),
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

  const add = $(async (place: PasskeyPlace | null) => {
    adding.value = true;
    notice.value = null;
    try {
      await addCredential(place ?? undefined);
      choosing.value = false;
      notice.value = { kind: "success", message: { id: "passkeys.added" } };
      await refresh();
    } catch (err) {
      if (err instanceof WebAuthnError && err.code === PASSKEY_EXISTS) {
        // Not a failure of theirs: that place has one already. The choice
        // stays open for another place.
        notice.value = { kind: "info", message: { id: "passkeys.exists" } };
      } else {
        notice.value = {
          kind: "danger",
          message:
            err instanceof WebAuthnError && err.kind === "browser"
              ? { id: "passkeys.add-failed" }
              : failure(err, "passkeys.add-failed"),
        };
      }
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
            <T id="passkeys.lead" /> <T id="passkeys.several" />
          </p>
        </div>
        {!choosing.value && (
          <button
            type="button"
            class="button button--primary"
            onClick$={() => {
              choosing.value = true;
              notice.value = null;
            }}
          >
            <Icon name="plus" />
            <T id="passkeys.add" />
          </button>
        )}
      </div>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}

      {choosing.value && (
        <section class="card stack" aria-labelledby="where-title">
          <div class="stack stack--tight">
            <h2 id="where-title">
              <T id="passkeys.where.title" />
            </h2>
            <p class="quiet">
              <T id="passkeys.where.lead" />
            </p>
          </div>
          <ul class="places">
            {PLACES.map((option) => (
              <li key={option.label}>
                <button
                  type="button"
                  class="place"
                  data-place={option.place ?? "any"}
                  disabled={adding.value}
                  onClick$={() => add(option.place)}
                >
                  <span class="place-name">
                    <T id={option.label} />
                  </span>
                  <span class="quiet small">
                    <T id={option.about} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div class="cluster">
            <button
              type="button"
              class="button"
              disabled={adding.value}
              onClick$={() => {
                choosing.value = false;
              }}
            >
              <T id="common.cancel" />
            </button>
          </div>
        </section>
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
