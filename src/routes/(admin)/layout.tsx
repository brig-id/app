import { $, component$, Slot, useSignal } from "@qwik.dev/core";
import { Shell } from "~/components/account/shell";
import { AdminTabs } from "~/components/admin/tabs";
import { Callout } from "~/components/ui/callout";
import { T } from "~/i18n";
import type { SessionResponse } from "~/lib/api-types";
import {
  INTERFACE_VERSION,
  type ServerVersion,
  serverVersion,
} from "~/lib/version";

/**
 * The administration: for the accounts that administer this server. The
 * server refuses every one of its requests to anyone else; this layout only
 * spares them a page of errors.
 */
export default component$(() => {
  /** `null` until the server said who this is. */
  const admin = useSignal<boolean | null>(null);
  /** What the server says it runs; `undefined` until it was asked. */
  const server = useSignal<ServerVersion | null | undefined>(undefined);
  return (
    <Shell
      onSession$={$(async (session: SessionResponse) => {
        admin.value = session.admin;
        // Asked once, and of a server that will answer: it tells its
        // version to its administrators only.
        if (session.admin && server.value === undefined) {
          server.value = await serverVersion().catch(() => null);
        }
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
        <AdminTabs />
        <Slot />
        {server.value !== undefined && (
          <p class="quiet small" data-value="version">
            {server.value ? (
              <T
                id="admin.version"
                p={{
                  edition: server.value.edition ?? "",
                  version: server.value.version ?? "",
                  interface: INTERFACE_VERSION,
                }}
              />
            ) : (
              <T
                id="admin.version.interface"
                p={{ interface: INTERFACE_VERSION }}
              />
            )}
          </p>
        )}
      </div>
    </Shell>
  );
});
