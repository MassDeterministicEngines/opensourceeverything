import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

export type SpotType =
  | 'trail'
  | 'mountain'
  | 'cave'
  | 'national_park'
  | 'nature_reserve'
  | 'other';

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  share_code: string;
  created_at: string;
};

export type Spot = {
  id: string;
  creator_id: string;
  name: string;
  type: SpotType;
  lat: number;
  lng: number;
  description: string | null;
  created_at: string;
};

export type Moment = {
  id: string;
  author_id: string;
  spot_id: string | null;
  photo_path: string;
  caption: string | null;
  lat: number | null;
  lng: number | null;
  taken_at: string | null;
  created_at: string;
};

export type Capture = {
  id: string;
  user_id: string;
  spot_id: string;
  captured_at: string;
  lat: number;
  lng: number;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  responded_at: string | null;
};

export type LeaderboardRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  captures_month: number;
  captures_all_time: number;
};

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const PHOTOS_BUCKET = 'photos';
