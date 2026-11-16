import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { type DocumentHead, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { dateParam, isMessage, Said, T, titled } from "~/i18n";
import { adminLog } from "~/lib/admin";
import { type Notice, notDone } from "~/lib/admin-notice";
import { SessionEndedError } from "~/lib/api";
import type { AdminLogEntry } from "~/lib/api-types";

/**
 * What administrators did, and what was done on the machine. The log keeps
 * identifiers, not names: an account deleted since is named nowhere.
 */
export default component$(() => {
  const nav = useNavigate();
  const entries = useSignal<AdminLogEntry[] | null>(null);
  const notice = useSignal<Notice>(null);

  useVisibleTask$(async ({ cleanup }) => {
    cleanup(titled("title.admin"));
    try {
      entries.value = await adminLog();
    } catch (err) {
      if (err instanceof SessionEndedError) await nav("/");
      else notice.value = notDone(err);
    }
  });

  return (
    <>
      <div class="stack stack--tight">
        <h1>
          <T id="admin.log.title" />
        </h1>
        <p class="quiet">
          <T id="admin.log.lead" />
        </p>
      </div>

      {notice.value && (
        <Callout kind={notice.value.kind} alert>
          <Said message={notice.value.message} />
        </Callout>
      )}
      {entries.value === null && !notice.value && (
        <output class="quiet">
          <T id="common.loading" />
        </output>
      )}
      {entries.value?.length === 0 && (
        <p class="quiet">
          <T id="admin.log.none" />
        </p>
      )}

      <ol class="log">
        {(entries.value ?? []).map((entry, i) => {
          // A newer server may log an action this interface has no words
          // for: its own name is shown then.
          const action = `admin.log.action.${entry.action.replace(".", "-")}`;
          return (
            <li key={i} class="log-entry" data-action={entry.action}>
              <span>
                <strong>
                  {isMessage(action) ? (
                    <T id={action} />
                  ) : (
                    <span class="mono">{entry.action}</span>
                  )}
                </strong>
                {entry.detail && <span class="quiet"> · {entry.detail}</span>}
              </span>
              {entry.about_account && (
                <span class="small">
                  {entry.account_username === null ? (
                    <T id="admin.log.account.deleted" />
                  ) : (
                    <T
                      id="admin.log.account"
                      p={{ name: entry.account_username }}
                    />
                  )}
                </span>
              )}
              <span class="quiet small">
                {dateParam(entry.at).en === "" ? null : (
                  <DateOf at={entry.at} />
                )}
                {" · "}
                {entry.by === "machine" ? (
                  <T id="admin.log.by.machine" />
                ) : entry.by_username === null ? (
                  <T id="admin.log.by.deleted" />
                ) : (
                  <T id="admin.log.by" p={{ name: entry.by_username }} />
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
});

/** A date, in each language. */
const DateOf = (props: { at: number }) => {
  const date = dateParam(props.at);
  return (
    <>
      <span data-l="en" lang="en">
        {date.en}
      </span>
      <span data-l="fr" lang="fr">
        {date.fr}
      </span>
    </>
  );
};

export const head: DocumentHead = {
  title: "Administration · brig·id",
};
