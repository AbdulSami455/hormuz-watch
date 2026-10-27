import { useEffect, useMemo, useState } from 'react';
import { RANGES, type RangeId } from './data/feeds';
import { MapView } from './components/MapView';
import { ago, kindLabel } from './lib/format';
import { inRange, toIncidents, type Incident } from './lib/incidents';
import { loadFeeds } from './lib/rss';

export default function App() {
  const [range, setRange] = useState<RangeId>('7d');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const { items, failed: down } = await loadFeeds();
      setIncidents(toIncidents(items));
      setFailed(down);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    const pulse = window.setInterval(() => void refresh(), 5 * 60_000);
    return () => window.clearInterval(pulse);
  }, []);

  const days = RANGES.find((r) => r.id === range)?.days ?? 7;
  const visible = useMemo(() => inRange(incidents, days), [incidents, days]);
  const active = visible.find((i) => i.id === activeId) ?? visible[0] ?? null;

  useEffect(() => {
    if (!visible.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !visible.some((i) => i.id === activeId)) setActiveId(visible[0].id);
  }, [visible, activeId]);

  return (
    <div className="app">
      <header>
        <h1>Hormuz Watch</h1>
        <nav aria-label="Time range">
          {RANGES.map((r) => (
            <button key={r.id} className={r.id === range ? 'on' : ''} onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </nav>
        <span className="count">{loading && !visible.length ? 'Loading' : `${visible.length} reports`}</span>
        <button className="refresh" onClick={() => void refresh()} disabled={loading}>
          Refresh
        </button>
      </header>

      <main>
        <MapView incidents={visible} activeId={active?.id ?? null} onSelect={setActiveId} />
      </main>

      <aside>
        {active ? (
          <article>
            <p className={`kind ${active.kind}`}>{kindLabel(active.kind)}</p>
            <h2>{active.title}</h2>
            <p className="meta">
              {active.source} · {active.place} · {ago(active.date)}
            </p>
            {active.summary &&
              !active.summary.toLowerCase().startsWith(active.title.slice(0, 40).toLowerCase()) && (
                <p className="sum">{active.summary}</p>
              )}
            {active.link && (
              <a href={active.link} target="_blank" rel="noopener noreferrer">
                Read report
              </a>
            )}
          </article>
        ) : (
          <p className="empty">
            {loading ? 'Loading reports…' : failed.length ? 'No reports reached.' : 'No reports in this range.'}
          </p>
        )}

        <ul>
          {visible.map((item) => (
            <li key={item.id}>
              <button className={item.id === active?.id ? 'row on' : 'row'} onClick={() => setActiveId(item.id)}>
                <i className={item.kind} />
                <strong>{item.title}</strong>
                <small>
                  {item.source} · {ago(item.date)}
                </small>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
