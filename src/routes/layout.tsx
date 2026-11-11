import { $, component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { AppNav } from "~/components/app-nav/app-nav";
import { checkSession, refreshSession, SessionEndedError } from "~/lib/api";
import { wa } from "~/lib/wa";
import { clearAuth, loadToken } from "~/lib/webauthn";

/** Pages shown signed out: centered card layout, no navigation. */
const PUBLIC_PATHS = new Set(["/", "/login/", "/register/"]);

/** Tokens live an hour; refresh well before, while the app is open. */
const REFRESH_EVERY_MS = 30 * 60 * 1000;

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const signedInShell = !PUBLIC_PATHS.has(loc.url.pathname);

  useVisibleTask$(() => {
    void wa.page();
  });

  // Signed-in pages: make sure the session is still good (the account may
  // be gone, the token expired or revoked) and keep it fresh (core#47).
  useVisibleTask$(async ({ track, cleanup }) => {
    track(() => loc.url.pathname);
    if (PUBLIC_PATHS.has(loc.url.pathname)) return;
    if (!loadToken()) {
      await nav("/login/");
      return;
    }
    try {
      await checkSession();
    } catch (err) {
      if (err instanceof SessionEndedError) await nav("/login/");
      return;
    }
    const timer = setInterval(() => {
      refreshSession().catch(async (err) => {
        if (err instanceof SessionEndedError) await nav("/login/");
      });
    }, REFRESH_EVERY_MS);
    cleanup(() => clearInterval(timer));
  });

  const signOut = $(async () => {
    const token = loadToken();
    if (token) {
      await fetch("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    clearAuth();
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
