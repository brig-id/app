import { component$ } from "@qwik.dev/core";
import { Icon } from "~/components/ui/icon";
import { RunningVersion } from "~/components/ui/running-version";
import { T } from "~/i18n";

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
 * made what the pages show. The same text signed out (in the sign-in frame),
 * in the account and in the administration (in their frame).
 */
export const AboutBody = component$(() => (
  <>
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
      <p>
        <T id="about.version" /> <RunningVersion />
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
  </>
));
