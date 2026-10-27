import { memo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { HORMUZ } from '../data/places';
import type { Incident } from '../lib/incidents';

const KIND_COLOR: Record<Incident['kind'], string> = {
  mine: '#b8860b',
  projectile: '#b42318',
  drone: '#3d6b8c',
  attack: '#9a4a18',
};

interface Props {
  incidents: Incident[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

function icon(kind: Incident['kind'], hot: boolean) {
  return L.divIcon({
    className: 'pin-wrap',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<span class="pin${hot ? ' on' : ''}" style="--c:${KIND_COLOR[kind]}"></span>`,
  });
}

export const MapView = memo(function MapView({ incidents, activeId, onSelect }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const marks = useRef(new Map<string, L.Marker>());
  const first = useRef(true);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!root.current || mapRef.current) return;
    const map = L.map(root.current, {
      center: [HORMUZ.lat, HORMUZ.lon],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });
    L.control.attribution({ prefix: false }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      marks.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const keep = new Set(incidents.map((item) => item.id));
    for (const [id, marker] of marks.current) {
      if (keep.has(id)) continue;
      marker.remove();
      marks.current.delete(id);
    }
    for (const item of incidents) {
      let marker = marks.current.get(item.id);
      if (!marker) {
        marker = L.marker([item.lat, item.lon]);
        marker.on('click', () => onSelectRef.current(item.id));
        marker.addTo(map);
        marks.current.set(item.id, marker);
      }
      marker.setIcon(icon(item.kind, item.id === activeId));
      marker.setZIndexOffset(item.id === activeId ? 400 : 0);
    }
  }, [incidents, activeId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeId) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const item = incidents.find((i) => i.id === activeId);
    if (!item) return;
    if (!map.getBounds().contains([item.lat, item.lon])) {
      map.panTo([item.lat, item.lon], { animate: false });
    }
  }, [activeId, incidents]);

  return <div ref={root} className="map" />;
});
