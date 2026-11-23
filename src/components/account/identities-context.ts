import { createContextId, type Signal } from "@qwik.dev/core";
import type { Identity } from "~/lib/api-types";

/**
 * The account's identities as the frame's menu shows them. A page that
 * creates, renames or deletes one bumps `changed`: the menu reads them again.
 */
export interface IdentitiesMenu {
  list: Signal<Identity[]>;
  changed: Signal<number>;
}

export const IDENTITIES_MENU = createContextId<IdentitiesMenu>(
  "brigid.identities-menu",
);
