import { component$ } from "@qwik.dev/core";
import { Link, useLocation } from "@qwik.dev/router";
import { type MessageId, T } from "~/i18n";

const TABS: readonly { href: string; label: MessageId }[] = [
  { href: "/admin/", label: "admin.tab.accounts" },
  { href: "/admin/applications/", label: "admin.tab.applications" },
  { href: "/admin/sign-up/", label: "admin.tab.signup" },
  { href: "/admin/log/", label: "admin.tab.log" },
];

/** The four pages of the administration. */
export const AdminTabs = component$(() => {
  const loc = useLocation();
  return (
    <nav class="tabs" aria-labelledby="admin-tabs-title">
      <h2 id="admin-tabs-title" class="sr-only">
        <T id="admin.tabs.label" />
      </h2>
      <ul>
        {TABS.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={loc.url.pathname === tab.href ? "page" : undefined}
            >
              <T id={tab.label} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
});
