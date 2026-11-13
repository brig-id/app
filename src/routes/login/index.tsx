import { component$ } from "@qwik.dev/core";
import type { DocumentHead, DocumentMeta } from "@qwik.dev/router";
import { T } from "~/i18n";

/** The earlier address of this page: links and bookmarks still lead here.
 * The browser is sent on at once, with no script. */
export default component$(() => (
  <main class="signin-main">
    <p>
      <a href="/">
        <T id="common.continue" />
      </a>
    </p>
  </main>
));

export const head: DocumentHead = {
  title: "brig·id",
  // The attribute is written as HTML spells it: the framework's own
  // spelling (httpEquiv) is rendered as it is, and means nothing to a browser.
  meta: [{ "http-equiv": "refresh", content: "0; url=/" } as DocumentMeta],
};
