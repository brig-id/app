import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { type DocumentHead, useNavigate } from "@builder.io/qwik-city";
import { PasskeyItem } from "~/components/passkey-item/passkey-item";
import { wa, useWaClick } from "~/lib/wa";
import type { PasskeySummary } from "~/lib/api-types";
import {
  addCredential,
  clearAuth,
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
  const signOutRef = useSignal<HTMLElement>();
  const addButtonRef = useSignal<HTMLElement>();

  useVisibleTask$(() => {
    void Promise.all([
      wa.card(),
      wa.input(),
      wa.button(),
      wa.callout(),
      wa.icon(),
    ]);
  });

  const refresh = $(async () => {
    const token = loadToken();
    const userId = loadUserId();
    if (!token || !userId) {
      await nav("/login/");
      return;
    }
    const fetchPasskeys = () =>
      fetch(`/auth/passkeys?user_id=${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    let response = await fetchPasskeys();
    if (response.status === 429) {
      // This call typically lands right after register+login (or a delete),
      // which can already have spent most of the /auth/* rate-limit burst —
      // without a retry here, a 429 leaves the list silently stale even
      // though the action that triggered this refresh actually succeeded.
      // The limiter refills one token every 3s (brigid-api's
      // GovernorConfigBuilder), so a single backoff is enough.
      await new Promise((resolve) => setTimeout(resolve, 3500));
      response = await fetchPasskeys();
    }
    if (!response.ok) {
      message.value = { kind: "error", text: "Unable to load passkeys." };
      return;
    }
    passkeys.value = (await response.json()) as PasskeySummary[];
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

  const handleSignOut = $(async () => {
    const token = loadToken();
    if (token) {
      await fetch("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    clearAuth();
    await nav("/login/");
  });

  useWaClick(signOutRef, handleSignOut);
  useWaClick(addButtonRef, handleAdd);

  return (
    <wa-card class="auth-card auth-card--wide">
      <div class="wa-stack">
        <div class="wa-split">
          <h1 class="wa-heading-l">Your passkeys</h1>
          <wa-button ref={signOutRef} appearance="outlined">
            Sign out
          </wa-button>
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

        <div class="wa-stack wa-gap-xs">
          {passkeys.value.map((passkey) => (
            <PasskeyItem
              key={passkey.id}
              id={passkey.id}
              onDelete$={handleDelete}
            />
          ))}
        </div>

        <div class="wa-flank:end wa-gap-xs">
          <wa-button ref={addButtonRef} variant="brand" loading={adding.value}>
            Add a passkey
          </wa-button>
        </div>
      </div>
    </wa-card>
  );
});

export const head: DocumentHead = {
  title: "Passkeys — brig·id",
};
