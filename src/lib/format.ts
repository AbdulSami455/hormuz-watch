export function ago(date: Date) {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

const KIND_LABEL: Record<string, string> = {
  mine: 'Mine',
  projectile: 'Missile',
  drone: 'Drone',
  attack: 'Attack',
};

export function kindLabel(kind: string) {
  return KIND_LABEL[kind] ?? kind[0].toUpperCase() + kind.slice(1);
}

export function stamp(date: Date) {
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
