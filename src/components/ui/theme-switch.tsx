import { component$ } from "@qwik.dev/core";
import { Icon } from "./icon";
import { T } from "~/i18n";
import { currentTheme, setTheme } from "~/lib/theme";

/**
 * Switches between the dark and the light theme, and remembers it on this
 * device. The button names the other theme; the stylesheet shows the label
 * that fits the theme in use.
 */
export const ThemeSwitch = component$(() => (
  <button
    type="button"
    class="link-button theme-switch"
    onClick$={() => setTheme(currentTheme() === "light" ? "dark" : "light")}
  >
    <span class="when-dark">
      <Icon name="sun" />
      <T id="theme.light" />
    </span>
    <span class="when-light">
      <Icon name="moon" />
      <T id="theme.dark" />
    </span>
  </button>
));
