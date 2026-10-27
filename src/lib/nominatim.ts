const cache = new Map<string, { lat: number; lon: number } | null>();

/** OpenStreetMap Nominatim, proxied so we can send a proper User-Agent. */
export async function geocode(query: string) {
  const key = query.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key) ?? null;
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    viewbox: '54.8,27.6,61.2,24.2',
    bounded: '1',
  });
  try {
    const res = await fetch(`/nominatim/search?${params}`);
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const rows = (await res.json()) as { lat: string; lon: string }[];
    const hit = rows[0] ? { lat: Number(rows[0].lat), lon: Number(rows[0].lon) } : null;
    cache.set(key, hit);
    return hit;
  } catch {
    cache.set(key, null);
    return null;
  }
}
