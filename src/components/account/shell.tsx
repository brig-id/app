import {
  $,
  component$,
  Slot,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@qwik.dev/core";
import { Link, useLocation, useNavigate } from "@qwik.dev/router";
import { IDENTITIES_MENU } from "~/components/account/identities-context";
import { Callout } from "~/components/ui/callout";
import { Icon, type IconName } from "~/components/ui/icon";
import { LanguageSwitch } from "~/components/ui/language-switch";
import { ThemeSwitch } from "~/components/ui/theme-switch";
import { type MessageId, T } from "~/i18n";
import {
  checkSession,
  listIdentities,
  SessionEndedError,
  signOut as endSession,
} from "~/lib/api";
import type { Identity, SessionResponse } from "~/lib/api-types";

interface NavLink {
  href: string;
  label: MessageId;
  icon: IconName;
  /** Its own pages, shown under it while one of them is open. */
  sub?: readonly { href: string; label: MessageId }[];
}

const LINKS: readonly NavLink[] = [
  {
    href: "/identities/",
    label: "nav.identities",
    icon: "identification-card",
  },
  { href: "/passkeys/", label: "nav.passkeys", icon: "key" },
  {
    href: "/account/",
    label: "nav.account",
    icon: "user-circle",
    sub: [
      { href: "/account/#export-title", label: "nav.account.export" },
      { href: "/account/#delete-title", label: "nav.account.delete" },
    ],
  },
  { href: "/info/", label: "nav.about", icon: "info" },
];

/** The pages of the administration, when the frame is in that mode. */
const ADMIN_LINKS: readonly NavLink[] = [
  { href: "/admin/", label: "admin.tab.accounts", icon: "user-circle" },
  {
    href: "/admin/applications/",
    label: "admin.tab.applications",
    icon: "key",
    sub: [{ href: "/admin/websites/", label: "admin.tab.websites" }],
  },
  { href: "/admin/sign-up/", label: "admin.tab.signup", icon: "plus" },
  { href: "/admin/log/", label: "admin.tab.log", icon: "list-bullets" },
  { href: "/admin/about/", label: "nav.about", icon: "info" },
];

/** Where an account finishes being set up. */
const ONBOARDING = "/welcome/";

/** How often an open page checks its session, so that one that ended (left
 * unused, at the end of its life, signed out elsewhere) sends the person to
 * sign in. Each request also keeps the session alive while it is in use. */
const CHECK_EVERY_MS = 5 * 60 * 1000;

/**
 * The frame of the pages of someone at home: the account part, and the
 * administration for those who administer. Every page here needs the
 * account's session; it lives in a cookie scripts cannot read, so the page
 * asks the server whether it is still good.
 *
 * `onSession$` is told what the server answered, each time it is asked.
 */
export const Shell = component$<{
  onSession$?: QRL<(session: SessionResponse) => void>;
  /** `admin`: the administration, a place of its own with its own
   * navigation, and a way back to one's account. */
  mode?: "account" | "admin";
}>(({ onSession$, mode = "account" }) => {
  const loc = useLocation();
  const nav = useNavigate();
  /** Whether the account administers this server: one more entry then. */
  const admin = useSignal(false);
  /** The identities, for the menu under "Identities". */
  const identities = useSignal<Identity[]>([]);
  const changed = useSignal(0);
  useContextProvider(IDENTITIES_MENU, { list: identities, changed });
  /** The identity whose page is open. Read from the browser: on a page
   * built ahead of time, the router's address has no query string. */
  const openId = useSignal("");
  useVisibleTask$(({ track }) => {
    track(() => loc.url.href);
    openId.value = new URLSearchParams(window.location.search).get("id") ?? "";
  });

  useVisibleTask$(async ({ track }) => {
    const path = track(() => loc.url.pathname);
    track(() => changed.value);
    if (mode !== "account" || !path.startsWith("/identities/")) return;
    try {
      identities.value = await listIdentities();
    } catch {
      // The page itself says what went wrong; the menu just stays short.
    }
  });

  useVisibleTask$(async ({ track, cleanup }) => {
    track(() => loc.url.pathname);
    const check = async () => {
      try {
        const session = await checkSession();
        admin.value = session.admin;
        if (onSession$) await onSession$(session);
        // An account without its recovery code is still in its onboarding,
        // whichever page it opened: the server closes the others to it.
        if (!session.recovery_code && loc.url.pathname !== ONBOARDING) {
          await nav(ONBOARDING);
        }
      } catch (err) {
        if (err instanceof SessionEndedError) await nav("/");
      }
    };
    const timer = setInterval(() => void check(), CHECK_EVERY_MS);
    cleanup(() => clearInterval(timer));
    await check();
  });

  /** Signing out failed: the session is still open, and the person is
   * told, not sent to the sign-in page as if it were closed. */
  const stillSignedIn = useSignal(false);

  const signOut = $(async () => {
    stillSignedIn.value = false;
    try {
      await endSession();
    } catch {
      stillSignedIn.value = true;
      return;
    }
    await nav("/");
  });

  return (
    <div class="account" data-mode={mode}>
      <a class="skip-link" href="#content">
        <T id="common.skip" />
      </a>
      <header class="account-header">
        <div class="cluster">
          <Link href="/identities/" class="brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            brig·id
          </Link>
          {admin.value && (
            <div class="mode-pills">
              <Link
                href="/identities/"
                aria-current={mode === "account" ? "page" : undefined}
              >
                <T id="nav.to-account" />
              </Link>
              <Link
                href="/admin/"
                aria-current={mode === "admin" ? "page" : undefined}
              >
                <T id="nav.admin" />
              </Link>
            </div>
          )}
        </div>
        <div class="cluster">
          <LanguageSwitch />
          <ThemeSwitch />
          <button type="button" class="button button--small" onClick$={signOut}>
            <Icon name="sign-out" />
            <T id="nav.signout" />
          </button>
        </div>
      </header>
      <nav class="account-nav" aria-labelledby="account-nav-title">
        <h2 id="account-nav-title" class="sr-only">
          <T id="nav.label" />
        </h2>
        <ul>
          {(mode === "admin" ? ADMIN_LINKS : LINKS).map((link) => {
            const path = loc.url.pathname;
            const here =
              link.href === "/admin/"
                ? path === "/admin/"
                : path.startsWith(link.href) ||
                  (link.sub ?? []).some((s) =>
                    path.startsWith(s.href.split("#")[0]!),
                  );
            const open =
              here &&
              (link.href === "/identities/" || (link.sub ?? []).length > 0);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={path === link.href ? "page" : undefined}
                  class={here ? "is-here" : undefined}
                >
                  <Icon name={link.icon} />
                  <T id={link.label} />
                </Link>
                {open && (
                  <ul class="subnav">
                    {link.href === "/identities/" ? (
                      <>
                        <li>
                          <Link
                            href="/identities/compare/"
                            aria-current={
                              path === "/identities/compare/"
                                ? "page"
                                : undefined
                            }
                          >
                            <T id="nav.identities.compare" />
                          </Link>
                        </li>
                        {identities.value.map((identity) => {
                          const href = `/identities/details/?id=${encodeURIComponent(identity.id)}`;
                          const current =
                            path === "/identities/details/" &&
                            openId.value === identity.id;
                          return (
                            <li key={identity.id}>
                              <Link
                                href={href}
                                aria-current={current ? "page" : undefined}
                              >
                                {identity.name}
                              </Link>
                            </li>
                          );
                        })}
                        <li>
                          <Link
                            href="/identities/new/"
                            aria-current={
                              path === "/identities/new/" ? "page" : undefined
                            }
                          >
                            <T id="nav.identities.new" />
                          </Link>
                        </li>
                      </>
                    ) : (
                      (link.sub ?? []).map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            aria-current={
                              path === sub.href ? "page" : undefined
                            }
                          >
                            <T id={sub.label} />
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <main id="content" class="account-main" tabIndex={-1}>
        {stillSignedIn.value && (
          <div class="page">
            <Callout kind="danger" alert>
              <T id="nav.signout.failed" />
            </Callout>
          </div>
        )}
        <Slot />
      </main>
    </div>
  );
});
