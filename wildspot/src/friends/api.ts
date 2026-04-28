import { supabase, Friendship, Profile } from '../lib/supabase';

export type FriendshipWithProfile = Friendship & { other: Profile | null };

export async function listFriendships(myId: string): Promise<FriendshipWithProfile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Friendship[];
  if (rows.length === 0) return [];

  const otherIds = Array.from(
    new Set(rows.map((r) => (r.requester_id === myId ? r.addressee_id : r.requester_id)))
  );
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .in('id', otherIds);
  if (pErr) throw pErr;
  const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
  return rows.map((r) => ({
    ...r,
    other: byId.get(r.requester_id === myId ? r.addressee_id : r.requester_id) ?? null,
  }));
}

export async function findProfileByCodeOrUsername(
  needle: string
): Promise<Profile | null> {
  const cleaned = needle.trim();
  if (!cleaned) return null;
  // Try share_code first (case-insensitive, dash-tolerant).
  const codeQuery = cleaned.toUpperCase();
  const { data: byCode } = await supabase
    .from('profiles')
    .select('*')
    .eq('share_code', codeQuery)
    .maybeSingle();
  if (byCode) return byCode as Profile;

  const { data: byUsername } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', cleaned)
    .maybeSingle();
  return (byUsername as Profile) ?? null;
}

export async function sendFriendRequest(
  myId: string,
  otherId: string
): Promise<Friendship> {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: myId, addressee_id: otherId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data as Friendship;
}

export async function respondFriendRequest(
  id: string,
  accept: boolean
): Promise<Friendship> {
  const { data, error } = await supabase
    .from('friendships')
    .update({
      status: accept ? 'accepted' : 'blocked',
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Friendship;
}

export async function removeFriend(id: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', id);
  if (error) throw error;
}
