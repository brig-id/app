import { type MessageId, tr } from "~/i18n";

/**
 * Archetypes: starting points for a new identity. They only fill its name,
 * icon and description, all of which stay editable; nothing remembers which
 * archetype an identity came from. They belong to the interface: the server
 * receives an identity's values, never an archetype.
 */
export interface Archetype {
  key: string;
  group: ArchetypeGroup;
  /** An `icon:ph:<name>` reference (`ICONS` in `icons.gen.ts`). */
  logo: string;
  /** Proposed by the onboarding of a new account. */
  starter?: true;
}

/** The groups, in display order. */
export const GROUPS = ["everyday", "work", "leisure", "online"] as const;
export type ArchetypeGroup = (typeof GROUPS)[number];

/** Every archetype, in display order. Each has its own icon, so that the
 * page can leave out the ones an account already uses. */
export const ARCHETYPES: readonly Archetype[] = [
  { key: "public", group: "everyday", logo: "icon:ph:globe-hemisphere-west", starter: true },
  { key: "personal", group: "everyday", logo: "icon:ph:user", starter: true },
  { key: "family", group: "everyday", logo: "icon:ph:house-line" },
  { key: "friends", group: "everyday", logo: "icon:ph:users-three" },
  { key: "shopping", group: "everyday", logo: "icon:ph:shopping-cart" },
  { key: "work", group: "work", logo: "icon:ph:briefcase", starter: true },
  { key: "freelance", group: "work", logo: "icon:ph:laptop" },
  { key: "job-search", group: "work", logo: "icon:ph:rocket-launch" },
  { key: "student", group: "work", logo: "icon:ph:graduation-cap" },
  { key: "volunteering", group: "work", logo: "icon:ph:heart" },
  { key: "gaming", group: "leisure", logo: "icon:ph:game-controller" },
  { key: "music", group: "leisure", logo: "icon:ph:music-notes" },
  { key: "sport", group: "leisure", logo: "icon:ph:soccer-ball" },
  { key: "travel", group: "leisure", logo: "icon:ph:airplane-tilt" },
  { key: "reading", group: "leisure", logo: "icon:ph:book-open" },
  { key: "creative", group: "leisure", logo: "icon:ph:palette" },
  { key: "developer", group: "online", logo: "icon:ph:code" },
  { key: "social", group: "online", logo: "icon:ph:mask-happy" },
  { key: "forums", group: "online", logo: "icon:ph:feather" },
  { key: "isolated", group: "online", logo: "icon:ph:detective" },
  { key: "testing", group: "online", logo: "icon:ph:flask" },
];

/** Its name and description, in the page's language. */
export function archetypeWords(a: Archetype): { name: string; about: string } {
  return {
    name: tr(`archetype.${a.key}` as MessageId),
    about: tr(`archetype.${a.key}.about` as MessageId),
  };
}
