import {
  $,
  component$,
  Slot,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@qwik.dev/core";
import { Link, useLocation, useNavigate } from "@qwik.dev/router";
import { Callout } from "~/components/ui/callout";
import { Icon, type IconName } from "~/components/ui/icon";
import { LanguageSwitch } from "~/components/ui/language-switch";
import { ThemeSwitch } from "~/components/ui/theme-switch";
import { type MessageId, T } from "~/i18n";
import {
  checkSession,
  SessionEndedError,
  signOut as endSession,
} from "~/lib/api";
import type { SessionResponse } from "~/lib/api-types";

const LINKS: readonly { href: string; label: MessageId; icon: IconName }[] = [
  {
    href: "/identities/",
    label: "nav.identities",
    icon: "identification-card",
  },
  { href: "/passkeys/", label: "nav.passkeys", icon: "key" },
  { href: "/account/", label: "nav.account", icon: "user-circle" },
];

/** The pages of the administration, when the frame is in that mode. */
const ADMIN_LINKS: readonly {
  href: string;
  label: MessageId;
  icon: IconName;
}[] = [
  { href: "/admin/", label: "admin.tab.accounts", icon: "user-circle" },
  {
    href: "/admin/applications/",
    label: "admin.tab.applications",
    icon: "key",
  },
  { href: "/admin/websites/", label: "admin.tab.websites", icon: "globe" },
  { href: "/admin/sign-up/", label: "admin.tab.signup", icon: "plus" },
  { href: "/admin/log/", label: "admin.tab.log", icon: "info" },
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
            brig·id
          </Link>
          {mode === "admin" && (
            <span class="mode-badge">
              <Icon name="gear" />
              <T id="nav.admin" />
            </span>
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
        {mode === "admin" ? (
          <ul>
            {ADMIN_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={
                    loc.url.pathname === link.href ? "page" : undefined
                  }
                >
                  <Icon name={link.icon} />
                  <T id={link.label} />
                </Link>
              </li>
            ))}
            <li class="mode-switch">
              <Link href="/identities/">
                <Icon name="arrows-left-right" />
                <T id="nav.to-account" />
              </Link>
            </li>
          </ul>
        ) : (
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={
                    loc.url.pathname.startsWith(link.href) ? "page" : undefined
                  }
                >
                  <Icon name={link.icon} />
                  <T id={link.label} />
                </Link>
              </li>
            ))}
            <li>
              <a href="/about/">
                <Icon name="info" />
                <T id="nav.about" />
              </a>
            </li>
            {admin.value && (
              <li class="mode-switch">
                <Link href="/admin/">
                  <Icon name="arrows-left-right" />
                  <T id="nav.admin" />
                </Link>
              </li>
            )}
          </ul>
        )}
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
