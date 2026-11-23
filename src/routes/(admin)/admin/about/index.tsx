import { component$, useVisibleTask$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { AboutBody } from "~/components/ui/about-body";
import { titled } from "~/i18n";

/** About, from the administration: in its frame, with its menu. */
export default component$(() => {
  useVisibleTask$(({ cleanup }) => {
    cleanup(titled("title.about"));
  });
  return (
    <div class="stack stack--loose about-page">
      <AboutBody />
    </div>
  );
});

export const head: DocumentHead = {
  title: "About · brig·id",
};
