import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { ssgAdapter } from "@qwik.dev/router/adapters/ssg/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// The interface is generated once, as static files, and served by a brig·id
// server from its own origin. Each server has its own domain, set when it
// runs, so there is no real origin to give at build time: the value below
// only satisfies the adapter. No sitemap: these pages are not to be indexed.
export default extendConfig(baseConfig, () => {
  return {
    // Pinned so that a tool starting Vite from this directory (an editor's
    // test runner, for instance) still finds `src/routes`.
    root: resolve(__dirname, "../.."),
    build: {
      ssr: true,
      rolldownOptions: {
        input: ["@qwik-router-config"],
      },
    },
    plugins: [
      ssgAdapter({
        origin: "https://brigid.invalid",
        sitemapOutFile: null,
      }),
    ],
  };
});
