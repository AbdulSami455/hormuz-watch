import { FEEDS, type Feed } from '../data/feeds';

export interface RssItem {
  sourceId: string;
  source: string;
  title: string;
  link: string;
  date: Date;
  summary: string;
}

function text(el: Element | null) {
  return (el?.textContent ?? '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

function decode(raw: string) {
  return raw
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFeed(xml: string, feed: Feed): RssItem[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) return [];
  const nodes = [...doc.querySelectorAll('item, entry')];
  return nodes
    .map((node) => {
      const title = text(node.querySelector('title'));
      const link =
        text(node.querySelector('link')) ||
        node.querySelector('link')?.getAttribute('href') ||
        '';
      const dateRaw =
        text(node.querySelector('pubDate, published, updated, dc\\:date')) ||
        text(node.querySelector('date'));
      const date = dateRaw ? new Date(dateRaw) : new Date();
      const summary = decode(text(node.querySelector('description, summary, content')).replace(/<[^>]+>/g, ''));
      if (!title || Number.isNaN(date.getTime())) return null;
      return { sourceId: feed.id, source: feed.name, title, link, date, summary };
    })
    .filter((item): item is RssItem => item !== null);
}

export async function loadFeeds(): Promise<{ items: RssItem[]; failed: string[] }> {
  const res = await fetch('/api/bundle', { signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(String(res.status));
  const rows = (await res.json()) as { id: string; xml: string | null }[];
  const byId = new Map(rows.map((row) => [row.id, row.xml]));

  const items: RssItem[] = [];
  const failed: string[] = [];
  for (const feed of FEEDS) {
    const xml = byId.get(feed.id);
    if (!xml) {
      failed.push(feed.name);
      continue;
    }
    items.push(...parseFeed(xml, feed));
  }
  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return { items, failed };
}
