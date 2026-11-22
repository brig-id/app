/**
 * The name of an identity just deleted from its own page, for the list to
 * say so once it is shown. Kept in the tab's session storage: the list may
 * be rendered before the router has moved its address, so the address is
 * no place for it. Without storage, the list just says nothing.
 */
const KEY = "brigid.identity-deleted";

export function leaveDeleted(name: string): void {
  try {
    sessionStorage.setItem(KEY, name);
  } catch {
    // Storage refused: the deletion is still done.
  }
}

/** The name left by `leaveDeleted`, once. */
export function takeDeleted(): string | null {
  try {
    const name = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return name;
  } catch {
    return null;
  }
}
