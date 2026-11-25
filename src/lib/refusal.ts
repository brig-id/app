/**
 * What the body of a refused request says, read the same way for every call:
 * the server's sentence (`error`, in English), its name for the refusal
 * (`code`), and, when a limit of the server was reached, which one.
 */

/** A limit of the server that a request reached: its name
 * (`identities_per_account`…) and the value it is set to, when the server
 * gave it. */
export interface LimitReached {
  name: string;
  value: number | null;
}

/** The server's name for a refusal because a limit is reached. */
export const LIMIT_REACHED = "limit_reached";

export interface Refusal {
  detail: string | null;
  code: string | null;
  limit: LimitReached | null;
}

const count = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;

/** Reads a refusal's body; anything it does not hold is `null`. The limit
 * is read as `"limit": "<name>"` with its `"value"` beside it, or as
 * `"limit": {"name", "value"}`. */
export function readRefusal(text: string): Refusal {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { detail: null, code: null, limit: null };
  }
  if (typeof data !== "object" || data === null) {
    return { detail: null, code: null, limit: null };
  }
  const body = data as Record<string, unknown>;
  const detail =
    typeof body.error === "string" && body.error ? body.error : null;
  const code = typeof body.code === "string" && body.code ? body.code : null;
  let limit: LimitReached | null = null;
  if (code === LIMIT_REACHED) {
    if (typeof body.limit === "string" && body.limit) {
      limit = { name: body.limit, value: count(body.value) };
    } else if (typeof body.limit === "object" && body.limit !== null) {
      const inner = body.limit as Record<string, unknown>;
      if (typeof inner.name === "string" && inner.name) {
        limit = { name: inner.name, value: count(inner.value) };
      }
    }
    // The server said a limit is reached without naming it: still one.
    limit ??= { name: "", value: null };
  }
  return { detail, code, limit };
}
