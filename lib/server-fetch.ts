const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TIMEOUT_MS = 15_000;

export type FetchResult<T> = {
  /** Parsed JSON, or null when the request failed */
  data: T | null;
  /** HTTP status, or 0 when the API couldn't be reached */
  status: number;
};

/**
 * GET helper for server components. Responses are cached for `revalidate`
 * seconds, so visitors don't wait on the API/database for every page view.
 */
export async function fetchJson<T>(
  path: string,
  revalidate = 60,
): Promise<FetchResult<T>> {
  if (!API_URL) {
    console.error("NEXT_PUBLIC_API_URL is not set");
    return { data: null, status: 0 };
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`GET ${path} failed with ${res.status}`);
      }
      return { data: null, status: res.status };
    }

    return { data: (await res.json()) as T, status: res.status };
  } catch (err) {
    console.error(`GET ${path} failed:`, err);
    return { data: null, status: 0 };
  }
}
