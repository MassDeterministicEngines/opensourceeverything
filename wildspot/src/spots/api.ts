import { supabase, Spot, SpotType } from '../lib/supabase';

export async function listSpots(): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Spot[];
}

export async function getSpot(id: string): Promise<Spot | null> {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Spot) ?? null;
}

export async function createSpot(input: {
  name: string;
  type: SpotType;
  lat: number;
  lng: number;
  description?: string;
  creatorId: string;
}): Promise<Spot> {
  const { data, error } = await supabase
    .from('spots')
    .insert({
      creator_id: input.creatorId,
      name: input.name,
      type: input.type,
      lat: input.lat,
      lng: input.lng,
      description: input.description ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Spot;
}
