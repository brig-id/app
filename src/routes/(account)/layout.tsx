import { component$, Slot } from "@qwik.dev/core";
import { Shell } from "~/components/account/shell";

/** The account part: someone at home. */
export default component$(() => (
  <Shell>
    <Slot />
  </Shell>
));
