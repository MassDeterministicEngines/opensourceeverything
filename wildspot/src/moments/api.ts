import { supabase, Moment } from '../lib/supabase';

export async function listMomentsForSpot(spotId: string): Promise<Moment[]> {
  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Moment[];
}

export async function createMoment(input: {
  authorId: string;
  spotId: string | null;
  photoPath: string;
  caption?: string;
  lat: number | null;
  lng: number | null;
  takenAt?: Date | null;
}): Promise<Moment> {
  const { data, error } = await supabase
    .from('moments')
    .insert({
      author_id: input.authorId,
      spot_id: input.spotId,
      photo_path: input.photoPath,
      caption: input.caption ?? null,
      lat: input.lat,
      lng: input.lng,
      taken_at: input.takenAt ? input.takenAt.toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Moment;
}
