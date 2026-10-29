import { useMemo } from 'react';
import type { HitKind, Incident } from '../lib/incidents';

const BINS = 36;
const ORDER: HitKind[] = ['projectile', 'drone', 'mine', 'attack'];

interface Props {
  incidents: Incident[];
  days: number | null;
  activeId: string | null;
}

export function Timeline({ incidents, days, activeId }: Props) {
  const { bins, from, peak, hot } = useMemo(() => {
    const to = Date.now();
    const oldest = incidents.reduce((min, i) => Math.min(min, i.date.getTime()), to);
    const from = days != null ? to - days * 86_400_000 : Math.min(oldest, to - 86_400_000);
    const width = (to - from) / BINS;
    const bins = Array.from({ length: BINS }, () => ({ projectile: 0, drone: 0, mine: 0, attack: 0, total: 0 }));
    let hot = -1;
    for (const item of incidents) {
      const at = Math.min(BINS - 1, Math.max(0, Math.floor((item.date.getTime() - from) / width)));
      bins[at][item.kind] += 1;
      bins[at].total += 1;
      if (item.id === activeId) hot = at;
    }
    const peak = Math.max(1, ...bins.map((b) => b.total));
    return { bins, from: new Date(from), peak, hot };
  }, [incidents, days, activeId]);

  const label = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="timeline" aria-label="Reports over time">
      <div className="bars">
        {bins.map((bin, i) => (
          <div key={i} className={i === hot ? 'bar on' : 'bar'} title={`${bin.total} reports`}>
            {ORDER.map((kind) =>
              bin[kind] ? (
                <span key={kind} className={kind} style={{ height: `${(bin[kind] / peak) * 100}%` }} />
              ) : null,
            )}
          </div>
        ))}
      </div>
      <div className="axis">
        <span>{label(from)}</span>
        <span>Reports over time</span>
        <span>Now</span>
      </div>
    </div>
  );
}
