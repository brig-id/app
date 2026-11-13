/**
 * The entry point of `pnpm preview`: a Node server over the built files, for
 * looking at a production build locally.
 */
import { createQwikRouter } from "@qwik.dev/router/middleware/node";
import render from "./entry.ssr";

export default createQwikRouter({ render });
