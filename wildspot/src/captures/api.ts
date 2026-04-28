import { supabase, Capture, LeaderboardRow } from '../lib/supabase';

export async function listCapturesForSpot(spotId: string): Promise<Capture[]> {
  const { data, error } = await supabase
    .from('captures')
    .select('*')
    .eq('spot_id', spotId)
    .order('captured_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Capture[];
}

export async function captureSpot(input: {
  userId: string;
  spotId: string;
  lat: number;
  lng: number;
}): Promise<Capture> {
  const { data, error } = await supabase
    .from('captures')
    .insert({
      user_id: input.userId,
      spot_id: input.spotId,
      lat: input.lat,
      lng: input.lng,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Capture;
}

export async function listLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('captures_all_time', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}
