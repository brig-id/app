/**
 * The colour of an identity: one of the six colours white light splits into
 * (the mark of brig·id), given in the order of the identities, so that an
 * identity keeps its colour from page to page. Only for the person's eyes:
 * no application sees it.
 */
export const HUES = ["amber", "coral", "rose", "violet", "cyan", "green"] as const;
export type Hue = (typeof HUES)[number];

export function hueAt(index: number): Hue {
  return HUES[((index % HUES.length) + HUES.length) % HUES.length]!;
}

/** The colour of the identity `id` among `ids` (the account's order). */
export function hueOf(ids: readonly string[], id: string): Hue {
  return hueAt(Math.max(0, ids.indexOf(id)));
}
