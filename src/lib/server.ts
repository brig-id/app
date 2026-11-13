/**
 * The domain of the brig·id server serving this page. The interface and the
 * API are always served from one origin, by one server, so the browser's
 * own hostname is that server's domain by construction.
 */
export function currentServer(): string {
  return window.location.hostname;
}
