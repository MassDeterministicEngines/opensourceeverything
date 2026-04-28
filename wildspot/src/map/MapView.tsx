import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mapboxgl, SPOT_TYPE_MARKERS } from '../lib/mapbox';
import { env } from '../env';
import { DEFAULT_CENTER, DEFAULT_ZOOM, getCurrentPosition } from '../lib/geo';
import { Layout } from '../components/Layout';
import { listSpots } from '../spots/api';
import { qk } from '../lib/queryKeys';
import type { Spot, SpotType } from '../lib/supabase';

const SPOT_TYPES: SpotType[] = [
  'trail',
  'mountain',
  'cave',
  'national_park',
  'nature_reserve',
  'other',
];

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  const { data: spots = [] } = useQuery({
    queryKey: qk.spots,
    queryFn: listSpots,
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: env.MAPBOX_STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 30,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'bottom-right'
    );

    map.on('load', () => {
      // Optional terrain — only if the style supports the standard DEM source.
      try {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
        }
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.4 });
      } catch {
        /* style might not allow terrain — ignore */
      }
      setReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render markers whenever spots or map readiness change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const s of spots) {
      const el = document.createElement('button');
      el.type = 'button';
      el.style.background = 'transparent';
      el.style.border = 'none';
      el.style.padding = '0';
      el.style.cursor = 'pointer';
      el.style.width = '44px';
      el.style.height = '55px';
      el.setAttribute('aria-label', s.name);
      const img = document.createElement('img');
      img.src = SPOT_TYPE_MARKERS[s.type];
      img.alt = '';
      img.draggable = false;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.filter = 'drop-shadow(0 3px 4px rgba(0,0,0,0.4))';
      el.appendChild(img);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        map.flyTo({
          center: [s.lng, s.lat],
          zoom: Math.max(map.getZoom(), 13),
          speed: 1.2,
          curve: 1.4,
          essential: true,
        });
        nav(`/spots/${s.id}`);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([s.lng, s.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [spots, ready, nav]);

  const onAdd = async () => {
    try {
      const pos = await getCurrentPosition();
      nav(`/spots/new?lat=${pos.lat}&lng=${pos.lng}`);
    } catch {
      // Fall back to map center if GPS denied.
      const c = mapRef.current?.getCenter();
      nav(`/spots/new?lat=${c?.lat ?? DEFAULT_CENTER[1]}&lng=${c?.lng ?? DEFAULT_CENTER[0]}`);
    }
  };

  return (
    <Layout>
      <div className="map-wrap">
        <div ref={containerRef} className="map-canvas" />
        <button className="fab" onClick={onAdd} aria-label="Add spot">+</button>
      </div>
      <Legend types={SPOT_TYPES} />
    </Layout>
  );
}

function Legend({ types }: { types: SpotType[] }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 12px)',
        left: 12,
        right: 12,
        background: 'rgba(15, 26, 20, 0.85)',
        borderRadius: 14,
        padding: '8px 12px',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        zIndex: 3,
        backdropFilter: 'blur(8px)',
      }}
    >
      {types.map((t) => (
        <img
          key={t}
          src={SPOT_TYPE_MARKERS[t]}
          alt={t}
          width={28}
          height={35}
          title={t.replace('_', ' ')}
        />
      ))}
    </div>
  );
}
