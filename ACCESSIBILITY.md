# Accessibility

The interface aims at WCAG 2.2 AA, and holds it by tests rather than by intention
([`interface.md` §3](https://github.com/brig-id/spec/blob/main/interface.md)).

## What is automatic

`e2e/accessibility.spec.ts` runs [axe](https://github.com/dequelabs/axe-core) in the
end-to-end suite, on **every page and on the states a page can be in** (an error shown, a
form open, a deletion being confirmed, a browser without passkeys), **in English and in
French, in the dark and in the light theme**. One violation fails the suite, and so the
pull request.

A new page, or a new state of a page, is added to that file in the same change.

## What only a person can check

Before a release, with the built interface served by a server:

**Keyboard only**

- [ ] Every action of every page can be reached and done, in an order that follows the
      page.
- [ ] The focus is always visible, and never hidden under the header.
- [ ] "Skip to the content" is the first stop on the account pages, and works.
- [ ] After an action that changes the page (a form opens, an identity is deleted), the
      focus is somewhere sensible, not lost at the top.

**One screen reader** (VoiceOver, NVDA or Orca)

- [ ] Each page announces its title, in the language shown.
- [ ] An error or a confirmation is announced when it appears, without moving.
- [ ] Buttons that look alike say what they act on ("Edit Work", "Remove Laptop").
- [ ] Only one language is read: the other one is not in the accessibility tree.
- [ ] The passkey step is announced by the browser; the page says what happened after.

**Settings of the person**

- [ ] 200 % zoom and a 320 px wide window: nothing is cut, nothing scrolls sideways.
- [ ] `prefers-reduced-motion`: nothing moves.
- [ ] `prefers-contrast: more` and forced colours (Windows high contrast): borders, focus
      and the state of a pressed button remain visible.
- [ ] Text spacing raised as WCAG 1.4.12 allows: nothing overlaps.

**What axe cannot see**

- [ ] The name at the top and the links at the bottom of the sign-in pages stay readable
      over the background image, in both themes (each sits on its own plate; check it when
      an image is added).

Note what was checked, with which browser and screen reader, in the release pull request.
