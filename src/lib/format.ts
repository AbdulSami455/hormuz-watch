export function ago(date: Date) {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function kindLabel(kind: string) {
  return kind[0].toUpperCase() + kind.slice(1);
}
