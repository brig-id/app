import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { Icon } from "~/components/ui/icon";
import { type Message, Said, T, titled } from "~/i18n";
import { listApplications, listIdentities, SessionEndedError } from "~/lib/api";
import type { IdentityApplication } from "~/lib/api-types";
import { failure } from "~/lib/errors";
import { buildExport, exportFileName } from "~/lib/export";
import { currentServer } from "~/lib/server";
import { deleteAccount, markDeleted, WebAuthnError } from "~/lib/webauthn";

type Notice = { kind: "success" | "danger" | "info"; message: Message } | null;

/**
 * The account itself: take one's data away, and leave.
 *
 * The export is made here, in the browser, from what the account's pages
 * already read. Deleting asks for the passkey again, for that purpose: the
 * session alone does not delete an account.
 */
export default component$(() => {
  const nav = useNavigate();
  const busy = useSignal(false);
  const understood = useSignal(false);
  const exported = useSignal<Notice>(null);
  const notice = useSignal<Notice>(null);

  useVisibleTask$(({ cleanup }) => {
    cleanup(titled("title.account"));
  });

  const download = $(async () => {
    busy.value = true;
    exported.value = null;
    try {
      const identities = await listIdentities();
      const applications: Record<string, IdentityApplication[]> =
        Object.fromEntries(
          await Promise.all(
            identities.map(
              async (identity) =>
                [identity.id, await listApplications(identity.id)] as const,
            ),
          ),
        );
      const now = new Date();
      const server = currentServer();
      const file = exportFileName(server, now);
      const blob = new Blob(
        [
          `${JSON.stringify(buildExport(server, now, identities, applications), null, 2)}\n`,
        ],
        { type: "application/json" },
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file;
      a.click();
      URL.revokeObjectURL(a.href);
      exported.value = {
        kind: "success",
        message: { id: "account.export.done", p: { file } },
      };
    } catch (err) {
      if (err instanceof SessionEndedError) {
        await nav("/");
        return;
      }
      exported.value = {
        kind: "danger",
        message: failure(err, "account.export.failed"),
      };
    } finally {
      busy.value = false;
    }
  });

  const remove = $(async () => {
    busy.value = true;
    notice.value = null;
    try {
      await deleteAccount();
      markDeleted();
      await nav("/");
    } catch (err) {
      notice.value =
        err instanceof WebAuthnError && err.kind === "browser"
          ? { kind: "info", message: { id: "account.delete.cancelled" } }
          : { kind: "danger", message: failure(err, "account.delete.failed") };
    } finally {
      busy.value = false;
    }
  });

  return (
    <div class="page stack stack--loose">
      <div class="stack stack--tight">
        <h1>
          <T id="account.title" />
        </h1>
        <p class="quiet">
          <T id="account.lead" />
        </p>
      </div>

      <section class="card stack" aria-labelledby="export-title">
        <h2 id="export-title">
          <T id="account.export.title" />
        </h2>
        <p class="quiet">
          <T id="account.export.lead" />
        </p>
        {exported.value && (
          <Callout kind={exported.value.kind} alert>
            <Said message={exported.value.message} />
          </Callout>
        )}
        <div class="cluster">
          <button
            type="button"
            class="button"
            disabled={busy.value}
            onClick$={download}
          >
            <Icon name="download-simple" />
            <T id="account.export.button" />
          </button>
        </div>
      </section>

      <section class="card stack" aria-labelledby="delete-title">
        <h2 id="delete-title">
          <T id="account.delete.title" />
        </h2>
        <p>
          <T id="account.delete.removes" />
        </p>
        <p>
          <T id="account.delete.keeps" />
        </p>
        <p class="quiet small">
          <T id="account.delete.passkey" />
        </p>
        {notice.value && (
          <Callout kind={notice.value.kind} alert>
            <Said message={notice.value.message} />
          </Callout>
        )}
        <label class="check">
          <input
            type="checkbox"
            checked={understood.value}
            onChange$={(_, input) => {
              understood.value = input.checked;
            }}
          />
          <span>
            <T id="account.delete.understood" />
          </span>
        </label>
        <div class="cluster">
          <button
            type="button"
            class="button button--danger"
            disabled={busy.value || !understood.value}
            onClick$={remove}
          >
            <Icon name="trash" />
            <T id="account.delete.button" />
          </button>
        </div>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Account · brig·id",
};
