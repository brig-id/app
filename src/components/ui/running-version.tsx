import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { T } from "~/i18n";
import {
  INTERFACE_VERSION,
  type ServerVersion,
  serverVersion,
} from "~/lib/version";

/**
 * What runs here: the server's edition and version, and this interface's.
 * Shown on the About page. Read once, after the page is shown.
 */
export const RunningVersion = component$(() => {
  /** `undefined` until the server answered. */
  const server = useSignal<ServerVersion | null | undefined>(undefined);

  useVisibleTask$(async () => {
    server.value = await serverVersion().catch(() => null);
  });

  return (
    <span class="running-version" data-value="version">
      {server.value ? (
        <T
          id="version.running"
          p={{
            edition: server.value.edition,
            version: server.value.version,
            interface: INTERFACE_VERSION,
          }}
        />
      ) : (
        <T id="version.interface" p={{ interface: INTERFACE_VERSION }} />
      )}
    </span>
  );
});
