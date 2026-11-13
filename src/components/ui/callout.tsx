import { component$, Slot } from "@qwik.dev/core";
import { Icon, type IconName } from "./icon";

type Kind = "danger" | "warning" | "success" | "info";

const ICONS: Record<Kind, IconName> = {
  danger: "warning-circle",
  warning: "warning",
  success: "check-circle",
  info: "info",
};

/**
 * A message set apart from the page. `alert` announces it to a screen reader
 * as soon as it appears (an error, the result of an action); leave it out
 * for a note that is simply part of the page.
 */
export const Callout = component$<{ kind: Kind; alert?: boolean }>(
  ({ kind, alert = false }) => (
    <div
      class={`callout callout--${kind}`}
      role={alert ? (kind === "success" ? "status" : "alert") : undefined}
    >
      <Icon name={ICONS[kind]} />
      <div class="callout-body">
        <Slot />
      </div>
    </div>
  ),
);
