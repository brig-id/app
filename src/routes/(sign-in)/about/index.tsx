import { component$, useVisibleTask$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { AboutBody } from "~/components/ui/about-body";
import { Icon } from "~/components/ui/icon";
import { T, titled } from "~/i18n";

/** About, signed out: in the frame of the sign-in pages. */
export default component$(() => {
  useVisibleTask$(({ cleanup }) => {
    cleanup(titled("title.about"));
  });

  return (
    <section class="card signin-card signin-card--wide stack stack--loose">
      <AboutBody />
      <p class="signin-links signin-links--center">
        <a href="/">
          <Icon name="arrow-left" /> <T id="about.back" />
        </a>
      </p>
    </section>
  );
});

export const head: DocumentHead = {
  title: "About · brig·id",
};
