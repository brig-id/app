import { $, component$, Slot, useVisibleTask$ } from "@qwik.dev/core";
import { Link, useLocation, useNavigate } from "@qwik.dev/router";
import { Icon, type IconName } from "~/components/ui/icon";
import { LanguageSwitch } from "~/components/ui/language-switch";
import { type MessageId, T } from "~/i18n";
import {
  checkSession,
  SessionEndedError,
  signOut as endSession,
} from "~/lib/api";

const LINKS: readonly { href: string; label: MessageId; icon: IconName }[] = [
  {
    href: "/identities/",
    label: "nav.identities",
    icon: "identification-card",
  },
  { href: "/passkeys/", label: "nav.passkeys", icon: "key" },
];

/** How often an open page checks its session, so that one that ended (left
 * unused, at the end of its life, signed out elsewhere) sends the person to
 * sign in. Each request also keeps the session alive while it is in use. */
const CHECK_EVERY_MS = 5 * 60 * 1000;

/**
 * The account part: someone at home. Every page here needs the account's
 * session; it lives in a cookie scripts cannot read, so the page asks the
 * server whether it is still good.
 */
export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();

  useVisibleTask$(async ({ track, cleanup }) => {
    track(() => loc.url.pathname);
    const check = async () => {
      try {
        await checkSession();
      } catch (err) {
        if (err instanceof SessionEndedError) await nav("/");
      }
    };
    const timer = setInterval(() => void check(), CHECK_EVERY_MS);
    cleanup(() => clearInterval(timer));
    await check();
  });

  const signOut = $(async () => {
    await endSession().catch(() => undefined);
    await nav("/");
  });

  return (
    <div class="account">
      <a class="skip-link" href="#content">
        <T id="common.skip" />
      </a>
      <header class="account-header">
        <Link href="/identities/" class="brand">
          brig·id
        </Link>
        <div class="cluster">
          <LanguageSwitch />
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
        </ul>
      </nav>
      <main id="content" class="account-main" tabIndex={-1}>
        <Slot />
      </main>
    </div>
  );
});
