import { $, component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { AppNav } from "~/components/app-nav/app-nav";
import {
  checkSession,
  SessionEndedError,
  signOut as endSession,
} from "~/lib/api";
import { wa } from "~/lib/wa";

/** Pages shown signed out: centered card layout, no navigation. */
const PUBLIC_PATHS = new Set([
  "/",
  "/login/",
  "/register/",
  "/recover/",
  // A site's request: the page signs the person in itself when needed.
  "/continue/",
]);

/** How often an open signed-in page checks its session, so one that ended
 * (idle, lifetime, signed out elsewhere) sends the user to sign in. Each
 * request also keeps the session alive, as long as it is in use. */
const CHECK_EVERY_MS = 5 * 60 * 1000;

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const signedInShell = !PUBLIC_PATHS.has(loc.url.pathname);

  useVisibleTask$(() => {
    void wa.page();
  });

  // Signed-in pages: the session lives in an HttpOnly cookie (ADR-005), so
  // the page asks the server whether it is still good.
  useVisibleTask$(async ({ track, cleanup }) => {
    track(() => loc.url.pathname);
    if (PUBLIC_PATHS.has(loc.url.pathname)) return;
    const check = async () => {
      try {
        await checkSession();
      } catch (err) {
        if (err instanceof SessionEndedError) await nav("/login/");
      }
    };
    await check();
    const timer = setInterval(() => void check(), CHECK_EVERY_MS);
    cleanup(() => clearInterval(timer));
  });

  const signOut = $(async () => {
    await endSession().catch(() => undefined);
    await nav("/login/");
  });

  if (!signedInShell) {
    return (
      <wa-page class="wa-cloak" mobile-breakpoint="768">
        <header slot="header" class="app-header">
          <a href="/" class="app-brand">
            brig·id
          </a>
        </header>
        <main>
          <Slot />
        </main>
      </wa-page>
    );
  }

  return (
    <wa-page class="wa-cloak app-shell" mobile-breakpoint="768">
      <header slot="header" class="app-header wa-split">
        <a href="/identities/" class="app-brand">
          brig·id
        </a>
        <button type="button" onClick$={signOut}>
          Sign out
        </button>
      </header>
      <div slot="navigation">
        <AppNav />
      </div>
      <main>
        <Slot />
      </main>
    </wa-page>
  );
});
