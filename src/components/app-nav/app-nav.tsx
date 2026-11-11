import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

const LINKS = [
  { href: "/identities/", label: "Identities", icon: "id-card" },
  { href: "/passkeys/", label: "Passkeys", icon: "key" },
] as const;

/** Left navigation of the signed-in app shell (app#25). */
export const AppNav = component$(() => {
  const loc = useLocation();
  return (
    <nav class="app-nav" aria-label="Account">
      <ul>
        {LINKS.map((link) => {
          const current = loc.url.pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                class="app-nav-link"
                aria-current={current ? "page" : undefined}
              >
                <wa-icon name={link.icon} variant="solid"></wa-icon>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
