/**
 * Links that carry a secret: the setup link of a new server, the link that
 * names an administrator, an invitation.
 *
 * The secret is in the fragment of the address (`/setup/#link=…`). A browser
 * never sends a fragment: the secret is in no request, so in no log of the
 * server or of a proxy in front of it, and in no `Referer`. The page reads
 * it and sends it once, in the body of the request that uses it.
 */

/** The address that carries `secret` under `name` to the page at `path`. */
export function linkAddress(
  origin: string,
  path: string,
  name: string,
  secret: string,
): string {
  return `${origin}${path}#${name}=${encodeURIComponent(secret)}`;
}

/** The secret named `name` in the fragment of `hash` (`location.hash`). */
export function linkIn(hash: string, name: string): string | null {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get(name);
  return value === null || value === "" ? null : value;
}

/** The secret named `name` in the address of the page. */
export function linkFromAddress(name: string): string | null {
  return linkIn(window.location.hash, name);
}

/**
 * A link pasted in the tab of a page already open changes the fragment and
 * nothing else: the browser does not load the page again. The page does, so
 * that it starts from the link it was given. Returns what stops listening.
 */
export function reloadOnLink(
  name: string,
  held: () => string | null,
): () => void {
  const arrived = () => {
    const given = linkFromAddress(name);
    if (given !== null && given !== held()) window.location.reload();
  };
  window.addEventListener("hashchange", arrived);
  return () => window.removeEventListener("hashchange", arrived);
}
