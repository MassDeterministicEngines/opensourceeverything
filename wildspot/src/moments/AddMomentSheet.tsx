import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet } from '../components/Sheet';
import { useAuth } from '../auth/AuthProvider';
import { uploadPhoto } from '../lib/photo';
import { exifGps } from '../lib/exif';
import { getCurrentPosition } from '../lib/geo';
import { createMoment } from './api';
import { qk } from '../lib/queryKeys';

export function AddMomentSheet({
  open,
  onClose,
  spotId,
}: {
  open: boolean;
  onClose: () => void;
  spotId: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setCaption('');
    setHint(null);
    setErr(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!file || !user) throw new Error('Pick a photo first.');

      // Try EXIF first; fall back to current GPS.
      const exif = await exifGps(file);
      let lat: number | null = null;
      let lng: number | null = null;
      let takenAt: Date | null = null;
      if (exif) {
        lat = exif.lat;
        lng = exif.lng;
        takenAt = exif.takenAt;
      } else {
        try {
          const pos = await getCurrentPosition();
          lat = pos.lat;
          lng = pos.lng;
          setHint('Used current location (photo had no GPS data).');
        } catch {
          setHint('Saved without location.');
        }
      }

      const path = await uploadPhoto(file, user.id);
      return createMoment({
        authorId: user.id,
        spotId,
        photoPath: path,
        caption: caption.trim() || undefined,
        lat,
        lng,
        takenAt,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.momentsForSpot(spotId) });
      reset();
      onClose();
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (save.isPending) return;
        reset();
        onClose();
      }}
    >
      <h3>Add moment</h3>
      <div className="stack">
        <button
          className="ghost"
          onClick={() => fileRef.current?.click()}
          style={{ width: '100%' }}
          disabled={save.isPending}
        >
          {file ? `Selected: ${file.name}` : 'Take or choose photo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />
        <div>
          <label>Caption (optional)</label>
          <textarea
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="A quick note about this moment…"
          />
        </div>
        {hint && <div className="muted" style={{ fontSize: 13 }}>{hint}</div>}
        {err && <div className="error">{err}</div>}
        <button
          onClick={() => save.mutate()}
          disabled={!file || save.isPending}
        >
          {save.isPending ? 'Uploading…' : 'Save moment'}
        </button>
      </div>
    </Sheet>
  );
}
