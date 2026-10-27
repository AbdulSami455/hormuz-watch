export const HORMUZ = { lat: 26.566, lon: 56.25 };

export interface Place {
  name: string;
  match: RegExp;
  lat: number;
  lon: number;
}

/** Known spots around the Strait of Hormuz — used before Nominatim. */
export const PLACES: Place[] = [
  { name: 'Strait of Hormuz', match: /\bstrait of hormuz\b|\bhormuz\b/i, lat: 26.566, lon: 56.25 },
  { name: 'Musandam', match: /\bmusandam\b/i, lat: 26.2, lon: 56.4 },
  { name: 'Bandar Abbas', match: /\bbandar abbas\b/i, lat: 27.183, lon: 56.267 },
  { name: 'Fujairah', match: /\bfujairah\b|\bfujeirah\b/i, lat: 25.128, lon: 56.334 },
  { name: 'Khor Fakkan', match: /\bkhor fakkan\b|\bkhorfakkan\b/i, lat: 25.339, lon: 56.357 },
  { name: 'Gulf of Oman', match: /\bgulf of oman\b/i, lat: 24.9, lon: 57.8 },
  { name: 'Jask', match: /\bjask\b/i, lat: 25.644, lon: 57.774 },
  { name: 'Chabahar', match: /\bchabahar\b/i, lat: 25.292, lon: 60.643 },
  { name: 'Qeshm', match: /\bqeshm\b/i, lat: 26.758, lon: 55.807 },
  { name: 'Larak', match: /\blarak\b/i, lat: 26.853, lon: 56.356 },
];
