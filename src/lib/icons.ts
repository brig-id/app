/**
 * The icon library for identity logos. A logo is stored by the server as
 * `icon:ph:<name>`, the name of an icon of the Phosphor set; the server
 * checks that shape only, and this list is what the interface offers.
 * Labels are messages (`icon.<name>` in `src/i18n/messages.ts`).
 */

export interface IconGroup {
  /** Names the group's title: the message `icons.group.<key>`. */
  key: "people" | "work" | "hobbies" | "things" | "brands";
  /** Phosphor names. */
  icons: readonly string[];
}

export const ICON_GROUPS: readonly IconGroup[] = [
  {
    key: "people",
    icons: [
      "user",
      "user-circle-gear",
      "rocket-launch",
      "sword",
      "detective",
      "mask-happy",
      "ghost",
      "house-line",
      "baby",
      "users-three",
    ],
  },
  {
    key: "work",
    icons: [
      "briefcase",
      "buildings",
      "bank",
      "graduation-cap",
      "book-open",
      "flask",
      "code",
      "terminal-window",
      "laptop",
      "hard-drives",
    ],
  },
  {
    key: "hobbies",
    icons: [
      "palette",
      "camera",
      "music-notes",
      "game-controller",
      "soccer-ball",
      "bicycle",
      "mountains",
      "airplane-tilt",
      "coffee",
      "horse",
    ],
  },
  {
    key: "things",
    icons: [
      "house",
      "globe-hemisphere-west",
      "shopping-cart",
      "heart",
      "star",
      "lightning",
      "leaf",
      "feather",
      "diamond",
      "shield-check",
    ],
  },
  {
    key: "brands",
    icons: [
      "github-logo",
      "gitlab-logo",
      "discord-logo",
      "mastodon-logo",
      "linkedin-logo",
    ],
  },
];

/** Every Phosphor name the picker offers. */
export const LOGO_NAMES: readonly string[] = ICON_GROUPS.flatMap(
  (g) => g.icons,
);

/** The logo of an identity that has none the library knows. */
export const DEFAULT_LOGO = "icon:ph:user";

/** The reference stored for a library icon. */
export const logoRef = (name: string): string => `icon:ph:${name}`;

/** `icon:ph:<name>` → the Phosphor name, or null when it is not a logo of
 * the library (malformed, or a name this version does not ship). */
export function logoName(ref: string): string | null {
  const match = /^icon:ph:([a-z0-9-]{1,64})$/.exec(ref);
  if (!match) return null;
  return LOGO_NAMES.includes(match[1]!) ? match[1]! : null;
}
