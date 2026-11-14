/**
 * The one script in the document's head. It runs before anything is painted
 * and sets, on the document element: the language, the theme the person
 * chose if they did, and a mark when the browser asks to save data (the
 * stylesheet then loads no background image).
 *
 * Plain ES5 on purpose: it is inlined as written, fixed at build time, and
 * allowed by its hash in the Content Security Policy.
 */
import { LOCALE_SCRIPT } from "./i18n";
import { THEME_SCRIPT } from "./lib/theme";

const SAVE_DATA_SCRIPT = `var c=navigator.connection;if(c&&c.saveData)d.setAttribute("data-save-data","");`;

export const HEAD_SCRIPT = `(function(){var d=document.documentElement;${LOCALE_SCRIPT}${THEME_SCRIPT}${SAVE_DATA_SCRIPT}})();`;
