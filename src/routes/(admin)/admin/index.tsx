import { $, component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { dateParam, type MessageId, Said, T, titled } from "~/i18n";
import {
  listAccounts,
  removeAccount,
  setAdministrator,
  suspendAccount,
  unsuspendAccount,
} from "~/lib/admin";
import { done, type Notice, notDone } from "~/lib/admin-notice";
import { SessionEndedError } from "~/lib/api";
import type { AdminAccount } from "~/lib/api-types";

/**
 * The accounts of the server, as its administrators see them: that they
 * exist, when, with how many passkeys. Never what they hold.
 */
export default component$(() => {
  const nav = useNavigate();
  const accounts = useSignal<AdminAccount[]>([]);
  const loaded = useSignal(false);
  const notice = useSignal<Notice>(null);
  /** The account and the action being confirmed: `suspend:<id>`. */
  const asking = useSignal<string | null>(null);
  const busy = useSignal(false);

  const refresh = $(async () => {
    try {
      accounts.value = await listAccounts();
    } catch (err) {
      if (err instanceof SessionEndedError) await nav("/");
      else notice.value = notDone(err);
    } finally {
      loaded.value = true;
    }
  });

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.admin"));
    await refresh();
  });

  /** Makes a change, says what happened, and reads the list again. */
  const change = $(
    async (
      account: AdminAccount,
      what: "suspend" | "unsuspend" | "grant" | "withdraw" | "delete",
    ) => {
      const said: Record<typeof what, MessageId> = {
        suspend: "admin.account.suspended.done",
        unsuspend: "admin.account.unsuspended.done",
        grant: "admin.account.granted",
        withdraw: "admin.account.withdrawn",
        delete: "admin.account.deleted",
      };
      busy.value = true;
      notice.value = null;
      try {
        if (what === "suspend") await suspendAccount(account.id);
        else if (what === "unsuspend") await unsuspendAccount(account.id);
        else if (what === "delete") await removeAccount(account.id);
        else await setAdministrator(account.id, what === "grant");
        asking.value = null;
        notice.value = done({ id: said[what], p: { name: account.username } });
        await refresh();
      } catch (err) {
        if (err instanceof SessionEndedError) await nav("/");
        else notice.value = notDone(err);
      } finally {
        busy.value = false;
      }
    },
  );

  return (
    <>
      <div class="stack stack--tight">
        <h1>
          <T id="admin.accounts.title" />
        </h1>
        <p class="quiet">
          <T id="admin.accounts.lead" />
        </p>
        <p class="quiet small">
          <T id="admin.accounts.no-reset" />
        </p>
      </div>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}
      {!loaded.value && (
        <output class="quiet">
          <T id="common.loading" />
        </output>
      )}

      <ul class="identity-list">
        {accounts.value.map((account) => (
          <li
            key={account.id}
            class="card identity-row stack"
            data-account={account.username}
          >
            <div class="split">
              <div class="stack stack--tight grow">
                <div class="cluster">
                  <span class="identity-name mono">{account.username}</span>
                  {account.own && (
                    <span class="tag">
                      <T id="admin.account.you" />
                    </span>
                  )}
                  {account.admin && (
                    <span class="tag tag--strong">
                      <T id="admin.account.admin" />
                    </span>
                  )}
                  {account.suspended_at !== null && (
                    <span class="tag tag--strong">
                      <T id="admin.account.suspended" />
                    </span>
                  )}
                </div>
                <span class="quiet small">
                  <T
                    id="admin.account.created"
                    p={{ date: dateParam(account.created_at) }}
                  />
                  {" · "}
                  {account.last_sign_in_at === null ? (
                    <T id="admin.account.never" />
                  ) : (
                    <T
                      id="admin.account.last"
                      p={{ date: dateParam(account.last_sign_in_at) }}
                    />
                  )}
                </span>
                <span class="quiet small">
                  <T
                    id="admin.account.passkeys"
                    p={{ count: account.passkeys }}
                  />
                  {" · "}
                  <T
                    id={
                      account.recovery_code
                        ? "admin.account.recovery.yes"
                        : "admin.account.recovery.no"
                    }
                  />
                </span>
              </div>
              <div class="cluster">
                {account.admin ? (
                  <button
                    type="button"
                    class="button button--small"
                    disabled={busy.value}
                    onClick$={() => change(account, "withdraw")}
                  >
                    <T id="admin.account.withdraw" />
                    <span class="sr-only"> ({account.username})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    class="button button--small"
                    disabled={busy.value || account.suspended_at !== null}
                    onClick$={() => change(account, "grant")}
                  >
                    <T id="admin.account.grant" />
                    <span class="sr-only"> ({account.username})</span>
                  </button>
                )}
                {!account.own &&
                  (account.suspended_at === null ? (
                    <button
                      type="button"
                      class="button button--small"
                      aria-expanded={asking.value === `suspend:${account.id}`}
                      onClick$={() => {
                        asking.value =
                          asking.value === `suspend:${account.id}`
                            ? null
                            : `suspend:${account.id}`;
                      }}
                    >
                      <T id="admin.account.suspend" />
                      <span class="sr-only"> ({account.username})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      class="button button--small"
                      disabled={busy.value}
                      onClick$={() => change(account, "unsuspend")}
                    >
                      <T id="admin.account.unsuspend" />
                      <span class="sr-only"> ({account.username})</span>
                    </button>
                  ))}
                {!account.own && (
                  <button
                    type="button"
                    class="button button--small button--danger"
                    aria-expanded={asking.value === `delete:${account.id}`}
                    onClick$={() => {
                      asking.value =
                        asking.value === `delete:${account.id}`
                          ? null
                          : `delete:${account.id}`;
                    }}
                  >
                    <T id="admin.account.delete" />
                    <span class="sr-only"> ({account.username})</span>
                  </button>
                )}
              </div>
            </div>
            {(asking.value === `suspend:${account.id}` ||
              asking.value === `delete:${account.id}`) && (
              <div class="confirm stack">
                <p>
                  <T
                    id={
                      asking.value.startsWith("suspend")
                        ? "admin.account.suspend.confirm"
                        : "admin.account.delete.confirm"
                    }
                    p={{ name: account.username }}
                  />
                </p>
                <div class="cluster">
                  <button
                    type="button"
                    class="button button--small button--danger"
                    disabled={busy.value}
                    onClick$={() =>
                      change(
                        account,
                        asking.value?.startsWith("suspend")
                          ? "suspend"
                          : "delete",
                      )
                    }
                  >
                    <T
                      id={
                        asking.value.startsWith("suspend")
                          ? "admin.account.suspend.yes"
                          : "admin.account.delete.yes"
                      }
                    />
                  </button>
                  <button
                    type="button"
                    class="button button--small"
                    onClick$={() => {
                      asking.value = null;
                    }}
                  >
                    <T id="common.cancel" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p class="quiet small">
        <T id="admin.confirm.hint" />
      </p>
    </>
  );
});

export const head: DocumentHead = {
  title: "Administration · brig·id",
};
