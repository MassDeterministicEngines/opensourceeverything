import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { getSpot } from './api';
import { listMomentsForSpot } from '../moments/api';
import { listCapturesForSpot } from '../captures/api';
import { MomentThumb } from '../moments/MomentCard';
import { AddMomentSheet } from '../moments/AddMomentSheet';
import { CaptureButton } from '../captures/CaptureButton';
import { SPOT_TYPE_LABEL } from '../lib/mapbox';
import { qk } from '../lib/queryKeys';

export function SpotDetailPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: spot, isLoading } = useQuery({
    queryKey: qk.spot(id),
    queryFn: () => getSpot(id),
    enabled: !!id,
  });
  const { data: moments = [] } = useQuery({
    queryKey: qk.momentsForSpot(id),
    queryFn: () => listMomentsForSpot(id),
    enabled: !!id,
  });
  const { data: captures = [] } = useQuery({
    queryKey: qk.capturesForSpot(id),
    queryFn: () => listCapturesForSpot(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="page center muted">Loading…</div>
      </Layout>
    );
  }
  if (!spot) {
    return (
      <Layout>
        <div className="page center">
          <p>Spot not found.</p>
          <button onClick={() => nav('/')}>Back to map</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page">
        <div className="row-between">
          <button className="ghost" onClick={() => nav(-1)}>← Back</button>
          <span className="muted">{SPOT_TYPE_LABEL[spot.type]}</span>
        </div>
        <h2 style={{ marginTop: 12 }}>{spot.name}</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
        </p>
        {spot.description && <p style={{ marginTop: 8 }}>{spot.description}</p>}

        <div style={{ marginTop: 16 }}>
          <CaptureButton spot={spot} />
        </div>

        <div className="row-between" style={{ marginTop: 16 }}>
          <h3>Moments</h3>
          <button onClick={() => setSheetOpen(true)}>+ Add</button>
        </div>
        {moments.length === 0 ? (
          <p className="muted">No moments yet — be first.</p>
        ) : (
          <div className="photo-grid" style={{ marginTop: 8 }}>
            {moments.map((m) => (
              <MomentThumb key={m.id} moment={m} />
            ))}
          </div>
        )}

        <h3 style={{ marginTop: 24 }}>Captures</h3>
        {captures.length === 0 ? (
          <p className="muted">No one has captured this spot yet.</p>
        ) : (
          <div className="list">
            {captures.map((c) => (
              <div key={c.id} className="card row-between">
                <span>User {c.user_id.slice(0, 8)}</span>
                <span className="muted" style={{ fontSize: 13 }}>
                  {new Date(c.captured_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <AddMomentSheet open={sheetOpen} onClose={() => setSheetOpen(false)} spotId={spot.id} />
    </Layout>
  );
}
