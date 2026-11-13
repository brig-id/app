/**
 * The entry point of server-side rendering. brig·id's interface is built once,
 * as static files (see `adapters/static`), and served by the server as they
 * are: this runs at build time and in `pnpm dev`, never in production.
 */
import { createRenderer } from "@qwik.dev/router";
import Root from "./root";

export default createRenderer((opts) => {
  return {
    jsx: <Root />,
    options: {
      ...opts,
      containerAttributes: {
        // English is what the static files hold; the script in the document
        // head switches to French before the first paint (`src/i18n`).
        lang: "en",
        ...opts.containerAttributes,
      },
      serverData: {
        ...opts.serverData,
      },
    },
  };
});
