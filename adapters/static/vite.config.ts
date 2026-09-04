import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { staticAdapter } from "@builder.io/qwik-city/adapters/static/vite";
import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// brig·id is self-hosted — each `leaf` instance picks its own domain via
// `LEAF_SERVER__DOMAIN` at runtime, so there's no single real origin to bake
// in at build time. The value below only feeds the `<link rel="canonical">`
// tag (see `src/components/router-head/router-head.tsx`) and would-be
// sitemap entries on these auth pages, which aren't meant to be publicly
// indexed anyway — sitemap generation is disabled outright below.
export default extendConfig(baseConfig, () => {
  return {
    // qwikCity()'s routesDir defaults to resolve(root, "src/routes"), and
    // Vite's `root` itself defaults to `process.cwd()` when unset — fine
    // when this config is loaded via `vite build -c adapters/static/vite.config.ts`
    // from the package root (pnpm's cwd), but any tool that spawns Vite
    // with cwd set to this file's own directory instead (e.g. the VS Code
    // Vitest extension resolving every vite.config.ts it finds) then looks
    // for routes under adapters/static/src/routes, which doesn't exist.
    // Pinning root to this file's real ancestor makes resolution
    // independent of the caller's cwd.
    root: resolve(__dirname, "../.."),
    build: {
      ssr: true,
      rollupOptions: {
        input: ["@qwik-city-plan"],
      },
    },
    plugins: [
      staticAdapter({
        origin: "https://brigid.invalid",
        sitemapOutFile: null,
      }),
    ],
  };
});
