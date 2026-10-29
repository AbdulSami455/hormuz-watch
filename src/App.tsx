import { useEffect, useMemo, useRef, useState } from 'react';
import { FEEDS, RANGES, type RangeId } from './data/feeds';
import { MapView } from './components/MapView';
import { Timeline } from './components/Timeline';
import { ago, kindLabel, stamp } from './lib/format';
import { inRange, toIncidents, type HitKind, type Incident } from './lib/incidents';
import { loadFeeds } from './lib/rss';

const KINDS: HitKind[] = ['projectile', 'drone', 'mine', 'attack'];

export default function App() {
  const [range, setRange] = useState<RangeId>('7d');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<HitKind>>(new Set());
  const [query, setQuery] = useState('');
  const [, tick] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  async function refresh() {
    setLoading(true);
    try {
      const { items, failed: down } = await loadFeeds();
      setIncidents(toIncidents(items));
      setFailed(down);
      setUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    const pulse = window.setInterval(() => void refresh(), 5 * 60_000);
    const clock = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => {
      window.clearInterval(pulse);
      window.clearInterval(clock);
    };
  }, []);

  const days = RANGES.find((r) => r.id === range)?.days ?? null;
  const inWindow = useMemo(() => inRange(incidents, days), [incidents, days]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inWindow.filter(
      (i) =>
        !hidden.has(i.kind) &&
        (!q || `${i.title} ${i.source} ${i.place}`.toLowerCase().includes(q)),
    );
  }, [inWindow, hidden, query]);
  const active = visible.find((i) => i.id === activeId) ?? visible[0] ?? null;

  const counts = useMemo(() => {
    const out = { projectile: 0, drone: 0, mine: 0, attack: 0 } as Record<HitKind, number>;
    for (const i of inWindow) out[i.kind] += 1;
    return out;
  }, [inWindow]);
  const sources = new Set(visible.map((i) => i.source)).size;

  useEffect(() => {
    if (!visible.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !visible.some((i) => i.id === activeId)) setActiveId(visible[0].id);
  }, [visible, activeId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key !== 'j' && e.key !== 'k' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const at = visible.findIndex((i) => i.id === active?.id);
      const step = e.key === 'j' || e.key === 'ArrowDown' ? 1 : -1;
      const next = visible[Math.min(visible.length - 1, Math.max(0, at + step))];
      if (next) setActiveId(next.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, active]);

  useEffect(() => {
    listRef.current?.querySelector('.row.on')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [active?.id]);

  function toggle(kind: HitKind) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  return (
    <div className="app">
      <header>
        <div className="brand">
          <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="14" />
            <circle cx="16" cy="16" r="8.5" />
            <circle cx="16" cy="16" r="3" className="dot" />
            <path d="M16 16 L16 2 A14 14 0 0 1 28.1 9 Z" className="sweep" />
          </svg>
          <div>
            <h1>Hormuz Watch</h1>
            <p>Ship-strike reports · Strait of Hormuz</p>
          </div>
        </div>

        <nav aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r.id} className={r.id === range ? 'on' : ''} onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </nav>

        <div className="status">
          <span className={loading ? 'live busy' : failed.length === FEEDS.length ? 'live down' : 'live'} />
          <span>
            {loading ? 'Scanning feeds' : updated ? `Live · updated ${ago(updated)} ago` : 'Offline'}
            <small>
              {FEEDS.length - failed.length}/{FEEDS.length} feeds
            </small>
          </span>
          <button className="refresh" onClick={() => void refresh()} disabled={loading} aria-label="Refresh">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
            </svg>
          </button>
        </div>
      </header>

      <main>
        <MapView incidents={visible} activeId={active?.id ?? null} onSelect={setActiveId} />

        <section className="hud">
          <div className="stat total">
            <strong>{visible.length}</strong>
            <span>reports</span>
          </div>
          {KINDS.map((kind) => (
            <button
              key={kind}
              className={`stat chip ${kind}${hidden.has(kind) ? ' off' : ''}`}
              onClick={() => toggle(kind)}
              aria-pressed={!hidden.has(kind)}
            >
              <i />
              <strong>{counts[kind]}</strong>
              <span>{kindLabel(kind)}</span>
            </button>
          ))}
          <div className="stat">
            <strong>{sources}</strong>
            <span>{sources === 1 ? 'source' : 'sources'}</span>
          </div>
        </section>

        <Timeline incidents={visible} days={days} activeId={active?.id ?? null} />
      </main>

      <aside>
        {active ? (
          <article key={active.id}>
            <div className="tags">
              <span className={`kind ${active.kind}`}>{kindLabel(active.kind)}</span>
              <span className="place">{active.place}</span>
            </div>
            <h2>{active.title}</h2>
            <p className="meta">
              {active.source} · {stamp(active.date)} · {ago(active.date)} ago
            </p>
            {active.summary &&
              !active.summary.toLowerCase().startsWith(active.title.slice(0, 40).toLowerCase()) && (
                <p className="sum">{active.summary}</p>
              )}
            {active.link && (
              <a href={active.link} target="_blank" rel="noopener noreferrer">
                Read full report <span aria-hidden="true">→</span>
              </a>
            )}
          </article>
        ) : (
          <p className="empty">
            {loading ? 'Scanning feeds…' : failed.length === FEEDS.length ? 'No feeds reached.' : 'No reports match.'}
          </p>
        )}

        <div className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter reports, sources, places"
            aria-label="Filter reports"
          />
          <kbd>J / K</kbd>
        </div>

        <ul ref={listRef}>
          {loading && !incidents.length
            ? Array.from({ length: 6 }, (_, i) => <li key={i} className="ghost" />)
            : visible.map((item) => (
                <li key={item.id}>
                  <button className={item.id === active?.id ? 'row on' : 'row'} onClick={() => setActiveId(item.id)}>
                    <i className={item.kind} />
                    <strong>{item.title}</strong>
                    <small>
                      {item.source} · {item.place} · {ago(item.date)}
                    </small>
                  </button>
                </li>
              ))}
        </ul>
      </aside>
    </div>
  );
}
