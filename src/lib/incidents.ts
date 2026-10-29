import { HORMUZ, PLACES } from '../data/places';
import type { RssItem } from './rss';

export type HitKind = 'mine' | 'projectile' | 'drone' | 'attack';

export interface Incident {
  id: string;
  title: string;
  link: string;
  source: string;
  date: Date;
  summary: string;
  place: string;
  lat: number;
  lon: number;
  kind: HitKind;
}

const HIT =
  /\b(hit|struck|strikes?|disabled|on fire|missile|mine|limpet|projectile|drone|uav|explosion|exploded?|fired on)\b/i;
const SHIP = /\b(ship|ships|tanker|vessel|vessels|bulk carrier|container ?ship|cargo ship|crew|mariner)\b/i;
const HERE =
  /\b(strait of hormuz|gulf of oman|fujairah|fujeirah|bandar abbas|musandam|khor fakkan|jask|chabahar|qeshm|larak)\b/i;
const ELSEWHERE = /\b(black sea|red sea|mediterranean|south china sea|gulf of aden|baltic sea)\b/i;
const COMPARE = /surpass(?:ing|es)?\s+hormuz|than hormuz|vs\.?\s+hormuz/i;

export function isHormuzHit(title: string, summary: string) {
  const blob = `${title} ${summary}`;
  if (ELSEWHERE.test(title) || COMPARE.test(title)) return false;
  if (!HIT.test(blob) || !SHIP.test(blob)) return false;
  return HERE.test(blob);
}

function kindOf(text: string): HitKind {
  if (/\b(mine|limpet)\b/i.test(text)) return 'mine';
  if (/\b(drone|uav)\b/i.test(text)) return 'drone';
  if (/\b(missile|projectile|rocket)\b/i.test(text)) return 'projectile';
  return 'attack';
}

function placeOf(text: string) {
  if (ELSEWHERE.test(text) || COMPARE.test(text)) {
    return { name: 'Strait of Hormuz', lat: HORMUZ.lat, lon: HORMUZ.lon };
  }
  for (const place of PLACES) {
    if (place.match.test(text)) return place;
  }
  return { name: 'Strait of Hormuz', lat: HORMUZ.lat, lon: HORMUZ.lon };
}

function jitter(lat: number, lon: number, seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 33 + ch.charCodeAt(0)) | 0;
  const a = (Math.abs(h) % 360) * (Math.PI / 180);
  const d = 0.05 + (Math.abs(h) % 24) * 0.004;
  return { lat: lat + Math.sin(a) * d, lon: lon + Math.cos(a) * d };
}

export function toIncidents(items: RssItem[]): Incident[] {
  const seen = new Set<string>();
  const out: Incident[] = [];

  for (const item of items) {
    if (!isHormuzHit(item.title, item.summary)) continue;
    const title = item.title.replace(/\s+-\s+[^-]+$/, '');
    const key = title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    const blob = `${title} ${item.summary}`;
    const place = placeOf(blob);
    const pin = jitter(place.lat, place.lon, key);
    out.push({
      id: key,
      title,
      link: item.link,
      source: item.source,
      date: item.date,
      summary: item.summary.slice(0, 220),
      place: place.name,
      lat: pin.lat,
      lon: pin.lon,
      kind: kindOf(blob),
    });
  }

  return out;
}

export function inRange(incidents: Incident[], days: number | null) {
  if (days == null) return incidents;
  const from = Date.now() - days * 86_400_000;
  return incidents.filter((i) => i.date.getTime() >= from);
}
