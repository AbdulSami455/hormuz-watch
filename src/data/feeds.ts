export interface Feed {
  id: string;
  name: string;
  urls: string[];
}

const GNEWS = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

export const FEEDS: Feed[] = [
  { id: 'gcaptain', name: 'gCaptain', urls: ['https://gcaptain.com/feed/'] },
  {
    id: 'mar-ex',
    name: 'The Maritime Executive',
    urls: ['https://www.maritime-executive.com/rss.xml', GNEWS('site:maritime-executive.com Hormuz')],
  },
  { id: 'splash', name: 'Splash 247', urls: ['https://splash247.com/feed/'] },
  { id: 'marinelink', name: 'MarineLink', urls: ['https://www.marinelink.com/news/rss'] },
  { id: 'hellenic', name: 'Hellenic Shipping News', urls: ['https://www.hellenicshippingnews.com/feed/'] },
  { id: 'insight', name: 'Marine Insight', urls: ['https://www.marineinsight.com/feed/'] },
  { id: 'naval', name: 'Naval News', urls: ['https://www.navalnews.com/feed/'] },
  { id: 'bbc', name: 'BBC — Middle East', urls: ['https://feeds.bbci.co.uk/news/world/middle_east/rss.xml'] },
  {
    id: 'aj',
    name: 'Al Jazeera',
    urls: [
      'https://www.aljazeera.com/xml/rss/all.xml',
      GNEWS('site:aljazeera.com "Strait of Hormuz" OR (Hormuz tanker)'),
    ],
  },
  { id: 'guardian', name: 'The Guardian — Middle East', urls: ['https://www.theguardian.com/world/middleeast/rss'] },
  {
    id: 'hormuz-wire',
    name: 'Hormuz wire',
    urls: [GNEWS('"Strait of Hormuz" (tanker OR vessel) (hit OR struck OR attack OR missile OR mine)')],
  },
];

export const RANGES = [
  { id: '2d', label: '2 days', days: 2 },
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '60d', label: '60 days', days: 60 },
  { id: '1y', label: '1 year', days: 365 },
  { id: 'all', label: 'All', days: null },
] as const;

export type RangeId = (typeof RANGES)[number]['id'];
