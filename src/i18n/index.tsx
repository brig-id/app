/**
 * English and French.
 *
 * The interface is built once, as static files, so a page cannot be rendered
 * in the reader's language by the server. Instead **both languages are in
 * the page** and a rule of the stylesheet shows one, chosen by the `lang` of
 * the document: a script in the head sets it before the first paint, from
 * the person's remembered choice or the browser's languages. Nothing
 * flashes, and switching language downloads nothing.
 *
 * A text that cannot hold markup (the document's title, a file to download)
 * is read at run time with `tr`.
 */
import { MESSAGES, type MessageId } from "./messages";

export type { MessageId };
export type Locale = "en" | "fr";
export const LOCALES: readonly Locale[] = ["en", "fr"];
export const DEFAULT_LOCALE: Locale = "en";

/** A value put into a message: the same in both languages, or one each
 * (a date, a translated name). */
export type Param = string | number | Record<Locale, string>;
export type Params = Record<string, Param>;

/** A message with its parameters: what an error or a notice holds, so that
 * it is shown in whichever language the page is in. */
export interface Message {
  id: MessageId;
  p?: Params;
  /** The server's own words, shown as a detail, untranslated. */
  detail?: string;
}

const STORAGE_KEY = "brigid.lang";

/** French punctuation takes a non-breaking space; the table is written with
 * plain ones. */
function french(text: string): string {
  return text
    .replace(/ ([:;»])/g, " $1")
    .replace(/ ([?!])/g, " $1")
    .replace(/« /g, "« ");
}

/** Whether `id` names a message: for ids built from data (a template's
 * key, an icon's name), which a newer server may know before the interface. */
export function isMessage(id: string): id is MessageId {
  return Object.hasOwn(MESSAGES, id);
}

export function raw(id: MessageId, locale: Locale): string {
  const [en, fr] = MESSAGES[id];
  return locale === "fr" ? french(fr) : en;
}

function fill(text: string, locale: Locale, params?: Params): string {
  return text.replace(/\{([a-z-]+)\}/g, (whole, name: string) => {
    const value = params?.[name];
    if (value === undefined) return whole;
    return typeof value === "object" ? value[locale] : String(value);
  });
}

/** The message as plain text. */
export function format(id: MessageId, locale: Locale, params?: Params): string {
  return fill(raw(id, locale).replace(/\*\*/g, ""), locale, params);
}

/** The message cut at its `**bold**` marks. Parameters are filled after the
 * cut, so a value can never add a mark. */
export function segments(
  id: MessageId,
  locale: Locale,
  params?: Params,
): { text: string; strong: boolean }[] {
  return raw(id, locale)
    .split("**")
    .map((part, i) => ({
      text: fill(part, locale, params),
      strong: i % 2 === 1,
    }))
    .filter((s) => s.text.length > 0);
}

/**
 * A message, in both languages; the stylesheet shows the document's.
 * `<T id="signin.title" />`, `<T id="continue.title" p={{ app: name }} />`.
 */
export const T = (props: { id: MessageId; p?: Params }) => (
  <>
    {LOCALES.map((locale) => (
      <span key={locale} data-l={locale} lang={locale}>
        {segments(props.id, locale, props.p).map((s, i) =>
          s.strong ? <strong key={i}>{s.text}</strong> : s.text,
        )}
      </span>
    ))}
  </>
);

/** A stored `Message`, with the server's words when there are some. */
export const Said = (props: { message: Message }) => (
  <>
    <T id={props.message.id} p={props.message.p} />
    {props.message.detail && (
      <span class="said-detail">
        {" "}
        <T id="error.server-said" /> <q lang="en">{props.message.detail}</q>
      </span>
    )}
  </>
);

/** A date, written out in each language. */
export function dateParam(iso: string): Record<Locale, string> {
  const date = new Date(iso);
  const write = (locale: Locale) =>
    date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  return { en: write("en"), fr: write("fr") };
}

// -- run time -------------------------------------------------------------------

const isLocale = (value: unknown): value is Locale =>
  value === "en" || value === "fr";

/** The language of the document. Browser only. */
export function currentLocale(): Locale {
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/** A message as text, in the document's language. Browser only. */
export function tr(id: MessageId, params?: Params): string {
  return format(id, currentLocale(), params);
}

/** Switches the document to `locale` and remembers it on this device. */
export function setLocale(locale: Locale): void {
  document.documentElement.lang = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage refused (private mode): the choice holds for this page.
  }
  document.dispatchEvent(new CustomEvent("brigid:locale"));
}

/** Sets the document's title, in its language, and keeps it right when the
 * language is switched. Returns what undoes it. Browser only. */
export function titled(id: MessageId): () => void {
  const write = () => {
    document.title = `${tr(id)} · brig·id`;
  };
  write();
  document.addEventListener("brigid:locale", write);
  return () => document.removeEventListener("brigid:locale", write);
}

/**
 * Runs in the document's head, before anything is painted: the remembered
 * language, else the first of the browser's languages the interface speaks,
 * else English. It also notes a request to save data, so that the
 * stylesheet loads no background image (`styles/sign-in.css`).
 *
 * Plain ES5 on purpose: it is inlined as written, and allowed by its hash in
 * the Content Security Policy.
 */
export const HEAD_SCRIPT = `(function(){var d=document.documentElement,l=null;try{l=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})}catch(e){}if(l!=="en"&&l!=="fr"){l=null;var n=navigator.languages||[navigator.language||""];for(var i=0;i<n.length&&!l;i++){var c=String(n[i]).slice(0,2).toLowerCase();if(c==="en"||c==="fr")l=c}}d.lang=l||"en";var c=navigator.connection;if(c&&c.saveData)d.setAttribute("data-save-data","")})();`;
