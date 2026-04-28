import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthProvider';
import { createSpot } from './api';
import { qk } from '../lib/queryKeys';
import { SPOT_TYPE_LABEL } from '../lib/mapbox';
import type { SpotType } from '../lib/supabase';

const TYPES: SpotType[] = [
  'trail',
  'mountain',
  'cave',
  'national_park',
  'nature_reserve',
  'other',
];

export function AddSpotPage() {
  const [params] = useSearchParams();
  const lat = parseFloat(params.get('lat') ?? '0');
  const lng = parseFloat(params.get('lng') ?? '0');
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [type, setType] = useState<SpotType>('trail');
  const [description, setDescription] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createSpot({
        name: name.trim(),
        type,
        lat,
        lng,
        description: description.trim() || undefined,
        creatorId: user!.id,
      }),
    onSuccess: (spot) => {
      qc.invalidateQueries({ queryKey: qk.spots });
      nav(`/spots/${spot.id}`, { replace: true });
    },
    onError: (e: Error) => setErr(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) {
      setErr('Give the spot a name.');
      return;
    }
    create.mutate();
  };

  return (
    <Layout>
      <div className="page">
        <div className="row-between">
          <h2>Add spot</h2>
          <button className="ghost" onClick={() => nav(-1)}>Cancel</button>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Location: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
        <form onSubmit={onSubmit} className="stack" style={{ marginTop: 16 }}>
          <div>
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hemlock Cliffs"
              required
              maxLength={80}
            />
          </div>
          <div>
            <label>Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TYPES.map((t) => (
                <span
                  key={t}
                  className={`chip ${type === t ? 'active' : ''}`}
                  onClick={() => setType(t)}
                >
                  {SPOT_TYPE_LABEL[t]}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label>Description (optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes it cool?"
            />
          </div>
          {err && <div className="error">{err}</div>}
          <button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Save spot'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
