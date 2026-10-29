import { memo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { HORMUZ } from '../data/places';
import type { Incident } from '../lib/incidents';

export const KIND_COLOR: Record<Incident['kind'], string> = {
  mine: '#f5b83d',
  projectile: '#ff4d4f',
  drone: '#4cc9f0',
  attack: '#ff8a3d',
};

interface Props {
  incidents: Incident[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

function icon(kind: Incident['kind'], hot: boolean) {
  return L.divIcon({
    className: 'pin-wrap',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `<span class="pin${hot ? ' on' : ''}" style="--c:${KIND_COLOR[kind]}"><b></b><b></b><i></i></span>`,
  });
}

export const MapView = memo(function MapView({ incidents, activeId, onSelect }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const marks = useRef(new Map<string, L.Marker>());
  const first = useRef(true);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const incidentsRef = useRef(incidents);
  incidentsRef.current = incidents;

  useEffect(() => {
    if (!root.current || mapRef.current) return;
    const map = L.map(root.current, {
      center: [HORMUZ.lat, HORMUZ.lon],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
    });
    L.control.attribution({ prefix: false, position: 'bottomleft' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
    L.tileLayer(`${esri}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    }).addTo(map);
    L.tileLayer(`${esri}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16 }).addTo(map);
    L.marker([26.1, 54.9], {
      interactive: false,
      icon: L.divIcon({ className: 'sea-label', html: 'Strait of Hormuz', iconSize: [160, 20] }),
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
        marker = L.marker([item.lat, item.lon], { title: item.title });
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
    const item = incidentsRef.current.find((i) => i.id === activeId);
    if (!item) return;
    map.flyTo([item.lat, item.lon], Math.max(map.getZoom(), 8), { duration: 0.9 });
  }, [activeId]);

  return <div ref={root} className="map" />;
});
