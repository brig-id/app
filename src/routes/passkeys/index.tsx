import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { delay } from "helpers4/promise";
import { type DocumentHead, useNavigate } from "@builder.io/qwik-city";
import { PasskeyItem } from "~/components/passkey-item/passkey-item";
import { wa } from "~/lib/wa";
import type { PasskeySummary } from "~/lib/api-types";
import { listPasskeys, renamePasskey, SessionEndedError } from "~/lib/api";
import {
  addCredential,
  deletePasskey,
  loadToken,
  loadUserId,
  WebAuthnError,
} from "~/lib/webauthn";

export default component$(() => {
  const nav = useNavigate();
  const passkeys = useSignal<PasskeySummary[]>([]);
  const message = useSignal<{ kind: "success" | "error"; text: string } | null>(
    null,
  );
  const adding = useSignal(false);

  useVisibleTask$(() => {
    void Promise.all([wa.card(), wa.callout(), wa.icon()]);
  });

  const refresh = $(async () => {
    const load = async () => {
      try {
        passkeys.value = await listPasskeys();
        return true;
      } catch (err) {
        if (err instanceof SessionEndedError) {
          await nav("/login/");
          return true;
        }
        return false;
      }
    };
    if (await load()) return;
    // This call often lands right after register+login (or a delete), which
    // can already have spent most of the /auth/* rate-limit burst; the
    // limiter refills one request every 3 s, so one backoff is enough.
    await delay(3500);
    if (!(await load())) {
      message.value = { kind: "error", text: "Unable to load passkeys." };
    }
  });

  useVisibleTask$(async () => {
    await refresh();
  });

  const handleDelete = $(async (passkeyId: string) => {
    const token = loadToken();
    const userId = loadUserId();
    if (!token || !userId) return;
    try {
      await deletePasskey(passkeyId, userId, token);
      message.value = { kind: "success", text: "Passkey removed." };
      await refresh();
    } catch {
      message.value = { kind: "error", text: "Failed to remove passkey." };
    }
  });

  const handleRename = $(async (passkeyId: string, label: string) => {
    try {
      await renamePasskey(passkeyId, label);
      message.value = { kind: "success", text: "Passkey renamed." };
      await refresh();
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/login/");
        return;
      }
      message.value = {
        kind: "error",
        text: err instanceof Error ? err.message : "Failed to rename passkey.",
      };
    }
  });

  const handleAdd = $(async () => {
    const token = loadToken();
    const userId = loadUserId();
    if (!token || !userId) return;
    adding.value = true;
    try {
      await addCredential(userId, token);
      message.value = { kind: "success", text: "Passkey added." };
      await refresh();
    } catch (err) {
      message.value = {
        kind: "error",
        text:
          err instanceof WebAuthnError ? err.message : "Failed to add passkey.",
      };
    } finally {
      adding.value = false;
    }
  });

  return (
    <div class="page wa-stack">
      <div class="wa-split">
        <div>
          <h1 class="wa-heading-l">Your passkeys</h1>
          <p class="quiet">
            The devices that unlock your account. Name them to tell them apart.
          </p>
        </div>
        <button
          type="button"
          class="wa-brand"
          disabled={adding.value}
          onClick$={handleAdd}
        >
          Add a passkey
        </button>
      </div>

      {message.value && (
        <wa-callout
          variant={message.value.kind === "success" ? "success" : "danger"}
          role="alert"
        >
          <wa-icon
            slot="icon"
            name={
              message.value.kind === "success"
                ? "circle-check"
                : "circle-exclamation"
            }
          ></wa-icon>
          {message.value.text}
        </wa-callout>
      )}

      <wa-card>
        <div class="wa-stack wa-gap-xs">
          {passkeys.value.map((passkey) => (
            <PasskeyItem
              key={passkey.id}
              id={passkey.id}
              label={passkey.label}
              onDelete$={handleDelete}
              onRename$={handleRename}
              disableRemove={passkeys.value.length <= 1}
            />
          ))}
        </div>
      </wa-card>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Passkeys — brig·id",
};
