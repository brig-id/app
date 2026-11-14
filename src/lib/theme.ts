/**
 * Dark or light. The theme follows the system's preference until the person
 * chooses one; the choice is remembered on this device and applied before the
 * first paint by the script in the head (`src/head-script.ts`).
 */
export type Theme = "dark" | "light";

const STORAGE_KEY = "brigid.theme";

/** The theme in use. Browser only. */
export function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "dark" || chosen === "light") return chosen;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

/** Switches to `theme` and remembers it. */
export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage refused (private mode): the choice holds for this page.
  }
}

/** The theme part of the script in the head. `d` is the document element. */
export const THEME_SCRIPT = `var t=null;try{t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})}catch(e){}if(t==="dark"||t==="light")d.setAttribute("data-theme",t);`;
