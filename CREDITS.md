# Credits

What the interface ships that the project did not make. Each is redistributable inside
the interface's licence; the About page of the interface (`/about/`) says the same to the
people who use it.

## Background image

| File                                        | Work              | Author     | Licence                                                                                  | Source                                                                           |
| ------------------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/assets/backgrounds/prism-*.{avif,jpg}` | _Prism tribeam 1_ | Kelvinsong | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain dedication) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Prism_tribeam_1.jpg) |

Checked on the file's page on 2026-11-13. The original (4592 × 3056) was cropped to 3:2
and resized to 960 and 1920 pixels wide, as AVIF with a JPEG fallback. Decoration only:
the pages read the same without it, and it is not loaded when the browser asks to save
data.

## Fonts

| Files                                 | Family     | Author                             | Licence                   |
| ------------------------------------- | ---------- | ---------------------------------- | ------------------------- |
| `src/assets/fonts/geist-*.woff2`      | Geist      | The Geist Project Authors (Vercel) | SIL Open Font License 1.1 |
| `src/assets/fonts/geist-mono-*.woff2` | Geist Mono | The Geist Project Authors (Vercel) | SIL Open Font License 1.1 |

The licence text is `src/assets/fonts/OFL-Geist.txt`. The files are the Latin and Latin
Extended subsets of the variable fonts, as published in the `@fontsource-variable/geist`
and `@fontsource-variable/geist-mono` npm packages, unmodified.

## Icons

[Phosphor Icons](https://phosphoricons.com), MIT License, copyright Phosphor Icons. The
drawings the interface uses are copied at build time from `@iconify-json/ph` into
`src/components/ui/icons.gen.ts` (`scripts/icons.mjs`).

Brand logos in the identity logo library (GitHub, GitLab, Discord, Mastodon, LinkedIn)
remain trademarks of their owners, whatever the icon set's licence.
