import { component$ } from "@qwik.dev/core";
import { Icon } from "./icon";
import { currentLocale, setLocale } from "~/i18n";

/**
 * Switches between English and French, and remembers it on this device.
 * The button names the other language, in that language.
 */
export const LanguageSwitch = component$(() => (
  <button
    type="button"
    class="link-button language-switch"
    onClick$={() => setLocale(currentLocale() === "fr" ? "en" : "fr")}
  >
    <Icon name="translate" />
    <span data-l="en" lang="fr">
      Français
    </span>
    <span data-l="fr" lang="en">
      English
    </span>
  </button>
));
