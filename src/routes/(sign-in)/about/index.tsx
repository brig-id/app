import { component$, useVisibleTask$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { Icon } from "~/components/ui/icon";
import { T, titled } from "~/i18n";

const NewTab = () => (
  <>
    {" "}
    <Icon name="arrow-square-out" />
    <span class="sr-only">
      {" "}
      <T id="common.new-tab" />
    </span>
  </>
);

/**
 * About: what runs here, under which licence, where its source is, and who
 * made what the pages show. The interface is free software served to people
 * over a network: the way to its source is part of it.
 */
export default component$(() => {
  useVisibleTask$(({ cleanup }) => {
    cleanup(titled("title.about"));
  });

  return (
    <section class="card signin-card signin-card--wide stack stack--loose">
      <h1>
        <T id="about.title" />
      </h1>
      <div class="stack">
        <p>
          <T id="about.what" />
        </p>
        <p>
          <T id="about.licence" />
        </p>
        <p>
          <a
            href="https://github.com/brig-id"
            target="_blank"
            rel="noopener noreferrer"
          >
            <T id="about.source" />
            <NewTab />
          </a>
        </p>
        <p class="quiet">
          <T id="about.nothing-external" />
        </p>
      </div>
      <div class="stack stack--tight">
        <h2>
          <T id="about.credits" />
        </h2>
        <ul class="credits">
          <li>
            <T id="about.credit.background" />{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Prism_tribeam_1.jpg"
              target="_blank"
              rel="noopener noreferrer"
            >
              <T id="about.credit.file" />
              <NewTab />
            </a>{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Dingle_cliff_%28Unsplash%29.jpg"
              target="_blank"
              rel="noopener noreferrer"
            >
              <T id="about.credit.file-light" />
              <NewTab />
            </a>
          </li>
          <li>
            <T id="about.credit.fonts" />
          </li>
          <li>
            <T id="about.credit.icons" />
          </li>
        </ul>
      </div>
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
