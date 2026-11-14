import { component$ } from "@qwik.dev/core";
import {
  DocumentHeadTags,
  RouterOutlet,
  useQwikRouter,
} from "@qwik.dev/router";
import { HEAD_SCRIPT } from "./head-script";
import geist from "./assets/fonts/geist-latin-wght-normal.woff2?url";

import "./global.css";

export default component$(() => {
  useQwikRouter();

  return (
    <>
      <head>
        <meta charset="utf-8" />
        {/* Before anything is painted: the language, the theme, and whether
            to save data. Its content is fixed at build time. */}
        <script dangerouslySetInnerHTML={HEAD_SCRIPT} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="dark light" />
        {/* The pages of a sign-in server have nothing to offer a search engine. */}
        <meta name="robots" content="noindex" />
        <link
          rel="preload"
          href={geist}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <DocumentHeadTags />
      </head>
      <body>
        <RouterOutlet />
      </body>
    </>
  );
});
