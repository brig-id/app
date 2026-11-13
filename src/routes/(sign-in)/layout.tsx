import { component$, Slot } from "@qwik.dev/core";
import { LanguageSwitch } from "~/components/ui/language-switch";
import { T } from "~/i18n";

/**
 * The sign-in part: someone arriving. One card over a still image; the
 * pages are plain HTML until the passkey step, and import nothing from the
 * account part (`src/architecture.spec.ts`).
 */
export default component$(() => (
  <div class="signin">
    <div class="signin-bg" aria-hidden="true"></div>
    <header class="signin-header">
      <a href="/" class="brand">
        brig·id
      </a>
    </header>
    <main class="signin-main">
      <Slot />
    </main>
    <footer class="signin-footer">
      <a href="/about/">
        <T id="nav.about" />
      </a>
      <LanguageSwitch />
    </footer>
  </div>
));
