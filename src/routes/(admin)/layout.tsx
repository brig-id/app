import { $, component$, Slot, useSignal } from "@qwik.dev/core";
import { Shell } from "~/components/account/shell";
import { Callout } from "~/components/ui/callout";
import { T } from "~/i18n";
import type { SessionResponse } from "~/lib/api-types";

/**
 * The administration: for the accounts that administer this server. The
 * server refuses every one of its requests to anyone else; this layout only
 * spares them a page of errors.
 */
export default component$(() => {
  /** `null` until the server said who this is. */
  const admin = useSignal<boolean | null>(null);
  return (
    <Shell
      mode="admin"
      onSession$={$((session: SessionResponse) => {
        admin.value = session.admin;
      })}
    >
      {admin.value === null && (
        <div class="page">
          <output class="quiet">
            <T id="common.loading" />
          </output>
        </div>
      )}
      {admin.value === false && (
        <div class="page stack stack--loose">
          <h1>
            <T id="admin.tabs.label" />
          </h1>
          <Callout kind="info">
            <T id="admin.not-admin" />
          </Callout>
        </div>
      )}
      {/* The pages are always there, hidden from anyone who is not known to
          be an administrator: what a page does when it is first seen (ask
          the server for its list) waits until it is shown, so someone else
          sends no request the server would refuse. */}
      <div class="page stack stack--loose" hidden={admin.value !== true}>
        <Slot />
      </div>
    </Shell>
  );
});
