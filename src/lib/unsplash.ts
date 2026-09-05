/** A daily-rotating background photo, fetched from Unsplash and cached in
 * localStorage so a repeat visit the same day doesn't refetch. */
export interface UnsplashPhoto {
  url: string;
  photographerName: string;
  photographerLink: string;
}

const CACHE_KEY = "brigid.bg-photo";
// Required by Unsplash's API Guidelines: every link back to Unsplash or a
// photographer must carry UTM parameters identifying the application.
// https://help.unsplash.com/en/articles/2511315
const UTM = "utm_source=brigid&utm_medium=referral";
const UNSPLASH_HOME = `https://unsplash.com/?${UTM}`;

interface CacheEntry extends UnsplashPhoto {
  date: string;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    return parsed.date === todayKey() ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full/unavailable (private browsing) — not fetching again
    // this session is a minor loss, not worth surfacing an error for.
  }
}

/** Returns today's background photo, fetching a new random one from
 * Unsplash at most once per day. Returns `null` if no access key is
 * configured or the request fails — callers must render a plain
 * background in that case, never block on this. */
export async function getDailyBackgroundPhoto(): Promise<UnsplashPhoto | null> {
  const cached = readCache();
  if (cached) return cached;

  const accessKey = import.meta.env.UNSPLASH_ACCESS_KEY as string | undefined;
  if (!accessKey) return null;

  let response: Response;
  try {
    response = await fetch(
      "https://api.unsplash.com/photos/random?query=abstract+technology&orientation=landscape&content_filter=high",
      { headers: { Authorization: `Client-ID ${accessKey}` } },
    );
  } catch {
    return null;
  }
  if (!response.ok) return null;

  const data = (await response.json()) as {
    urls: { regular: string };
    links: { download_location: string };
    user: { name: string; links: { html: string } };
  };

  // Required by Unsplash's API Guidelines: ping download_location whenever
  // a photo is displayed to the user (not an actual download, just usage
  // tracking for the photographer's stats). Fire-and-forget — must never
  // block or fail the background render.
  fetch(data.links.download_location, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  }).catch(() => undefined);

  const photo: UnsplashPhoto = {
    url: data.urls.regular,
    photographerName: data.user.name,
    photographerLink: `${data.user.links.html}?${UTM}`,
  };
  writeCache({ ...photo, date: todayKey() });
  return photo;
}

export { UNSPLASH_HOME };
