import { useQuery } from '@tanstack/react-query';
import { photoSignedUrl } from '../lib/photo';
import { qk } from '../lib/queryKeys';
import type { Moment } from '../lib/supabase';

export function MomentThumb({ moment, onClick }: { moment: Moment; onClick?: () => void }) {
  const { data: url } = useQuery({
    queryKey: qk.signedUrl(moment.photo_path),
    queryFn: () => photoSignedUrl(moment.photo_path),
    staleTime: 50 * 60 * 1000,
  });
  if (!url) return <div style={{ aspectRatio: 1, background: 'var(--bg-elev)', borderRadius: 8 }} />;
  return <img src={url} alt={moment.caption ?? 'Moment'} onClick={onClick} />;
}
