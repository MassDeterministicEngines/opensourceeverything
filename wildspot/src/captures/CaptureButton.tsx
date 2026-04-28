import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import {
  CAPTURE_RADIUS_M,
  MIN_GPS_ACCURACY_M,
  haversineMeters,
} from '../lib/geo';
import { captureSpot, listCapturesForSpot } from './api';
import { qk } from '../lib/queryKeys';
import type { Spot } from '../lib/supabase';

export function CaptureButton({ spot }: { spot: Spot }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [pos, setPos] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [posErr, setPosErr] = useState<string | null>(null);

  const { data: captures = [] } = useQuery({
    queryKey: qk.capturesForSpot(spot.id),
    queryFn: () => listCapturesForSpot(spot.id),
  });

  const alreadyCaptured = captures.some((c) => c.user_id === user?.id);

  useEffect(() => {
    if (alreadyCaptured) return;
    if (!('geolocation' in navigator)) {
      setPosErr('Geolocation not supported.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
        setPosErr(null);
      },
      (e) => setPosErr(e.message || 'Location unavailable.'),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [alreadyCaptured]);

  const distance = pos ? haversineMeters(pos, { lat: spot.lat, lng: spot.lng }) : null;
  const accurate = pos ? pos.accuracy <= MIN_GPS_ACCURACY_M : false;
  const inRange = distance !== null && distance <= CAPTURE_RADIUS_M;

  const capture = useMutation({
    mutationFn: () => {
      if (!user || !pos) throw new Error('No location yet.');
      return captureSpot({
        userId: user.id,
        spotId: spot.id,
        lat: pos.lat,
        lng: pos.lng,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.capturesForSpot(spot.id) });
      qc.invalidateQueries({ queryKey: qk.leaderboard });
      qc.invalidateQueries({ queryKey: qk.myCaptures });
    },
  });

  if (alreadyCaptured) {
    return (
      <div className="card center" style={{ borderColor: 'var(--accent-strong)' }}>
        ✓ You captured this spot.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row-between">
        <div>
          <div style={{ fontWeight: 600 }}>Capture this spot</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {posErr
              ? posErr
              : !pos
              ? 'Getting your location…'
              : !accurate
              ? `GPS accuracy ${Math.round(pos.accuracy)}m — need ≤${MIN_GPS_ACCURACY_M}m`
              : !inRange
              ? `${Math.round(distance!)}m away — get within ${CAPTURE_RADIUS_M}m`
              : 'Within range!'}
          </div>
        </div>
      </div>
      <button
        style={{ width: '100%', marginTop: 12 }}
        disabled={!inRange || !accurate || capture.isPending}
        onClick={() => capture.mutate()}
      >
        {capture.isPending ? 'Capturing…' : 'Capture'}
      </button>
      {capture.error && (
        <div className="error" style={{ marginTop: 8 }}>
          {(capture.error as Error).message}
        </div>
      )}
    </div>
  );
}
