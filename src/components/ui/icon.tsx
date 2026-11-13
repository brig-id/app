import { ICON_SIZE, LOGO_ICONS, UI_ICONS } from "./icons.gen";

export type IconName = keyof typeof UI_ICONS;

const svg = (body: string, cls: string) => (
  <svg
    class={cls}
    viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    // Static drawings generated at build time from the Phosphor set
    // (`scripts/icons.mjs`): never a value that came from a person or a server.
    dangerouslySetInnerHTML={body}
  />
);

/**
 * An icon of the interface, drawn in the page: nothing is fetched. Always
 * decoration: the text next to it says what it means.
 */
export const Icon = (props: { name: IconName; class?: string }) =>
  svg(UI_ICONS[props.name], `icon ${props.class ?? ""}`.trim());

/** A logo of the library, by its Phosphor name; the person icon otherwise. */
export const LogoIcon = (props: { name: string | null }) =>
  svg(
    (props.name !== null && LOGO_ICONS[props.name]) || LOGO_ICONS["user"]!,
    "icon",
  );
