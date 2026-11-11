/**
 * The predefined icon library for identity logos (app#27). An identity's
 * logo is stored by the server as `icon:<style>:<name>`; the server checks
 * only that shape, this list is what the UI offers. Custom uploads come
 * later (`upload:<id>`, reserved server-side).
 */

export interface LibraryIcon {
  /** Stored value, e.g. `icon:solid:briefcase`. */
  ref: string;
  /** Accessible label. */
  label: string;
}

const solid = (name: string, label: string): LibraryIcon => ({
  ref: `icon:solid:${name}`,
  label,
});
const brand = (name: string, label: string): LibraryIcon => ({
  ref: `icon:brands:${name}`,
  label,
});

export const ICON_GROUPS: ReadonlyArray<{ title: string; icons: LibraryIcon[] }> = [
  {
    title: "People",
    icons: [
      solid("user", "Person"),
      solid("user-tie", "Professional"),
      solid("user-astronaut", "Astronaut"),
      solid("user-ninja", "Ninja"),
      solid("user-secret", "Incognito"),
      solid("masks-theater", "Masks"),
      solid("ghost", "Ghost"),
      solid("people-roof", "Family"),
      solid("children", "Children"),
      solid("people-group", "Group"),
    ],
  },
  {
    title: "Work & study",
    icons: [
      solid("briefcase", "Briefcase"),
      solid("building", "Office"),
      solid("landmark", "Institution"),
      solid("graduation-cap", "Studies"),
      solid("book", "Book"),
      solid("flask", "Lab"),
      solid("code", "Code"),
      solid("terminal", "Terminal"),
      solid("laptop-code", "Laptop"),
      solid("server", "Server"),
    ],
  },
  {
    title: "Hobbies",
    icons: [
      solid("palette", "Palette"),
      solid("camera", "Camera"),
      solid("music", "Music"),
      solid("gamepad", "Games"),
      solid("futbol", "Sport"),
      solid("bicycle", "Cycling"),
      solid("mountain", "Mountain"),
      solid("plane", "Travel"),
      solid("mug-hot", "Coffee"),
      solid("chess-knight", "Chess"),
    ],
  },
  {
    title: "Places & things",
    icons: [
      solid("house", "Home"),
      solid("globe", "World"),
      solid("cart-shopping", "Shopping"),
      solid("heart", "Heart"),
      solid("star", "Star"),
      solid("bolt", "Bolt"),
      solid("leaf", "Leaf"),
      solid("feather", "Feather"),
      solid("gem", "Gem"),
      solid("shield-halved", "Shield"),
    ],
  },
  {
    title: "Brands",
    icons: [
      brand("github", "GitHub"),
      brand("gitlab", "GitLab"),
      brand("discord", "Discord"),
      brand("mastodon", "Mastodon"),
      brand("linkedin", "LinkedIn"),
    ],
  },
];

export const ALL_ICONS: LibraryIcon[] = ICON_GROUPS.flatMap((g) => g.icons);

/** `icon:<style>:<name>` → the `wa-icon` attributes, or null if malformed. */
export function parseLogo(
  ref: string,
): { name: string; family?: string; variant?: string } | null {
  const match = /^icon:([a-z0-9-]+):([a-z0-9-]+)$/.exec(ref);
  if (!match) return null;
  const style = match[1]!;
  const name = match[2]!;
  return style === "brands" ? { name, family: "brands" } : { name, variant: style };
}

/** The accessible label of a library icon, falling back to its name. */
export function logoLabel(ref: string): string {
  return ALL_ICONS.find((i) => i.ref === ref)?.label ?? parseLogo(ref)?.name ?? "Icon";
}
