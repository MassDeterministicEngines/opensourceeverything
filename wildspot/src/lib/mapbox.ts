import mapboxgl from 'mapbox-gl';
import { env } from '../env';
import type { SpotType } from './supabase';

mapboxgl.accessToken = env.MAPBOX_TOKEN;

export { mapboxgl };

export const SPOT_TYPE_MARKERS: Record<SpotType, string> = {
  trail: '/markers/marker-trail.svg',
  mountain: '/markers/marker-mountain.svg',
  cave: '/markers/marker-cave.svg',
  national_park: '/markers/marker-park.svg',
  nature_reserve: '/markers/marker-reserve.svg',
  other: '/markers/marker-other.svg',
};

export const SPOT_TYPE_LABEL: Record<SpotType, string> = {
  trail: 'Trail',
  mountain: 'Mountain',
  cave: 'Cave',
  national_park: 'National park',
  nature_reserve: 'Nature reserve',
  other: 'Other',
};
