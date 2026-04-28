import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthProvider';
import {
  findProfileByCodeOrUsername,
  listFriendships,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
} from './api';
import { qk } from '../lib/queryKeys';

export function FriendsPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [needle, setNeedle] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const { data: friendships = [] } = useQuery({
    queryKey: qk.friendships,
    queryFn: () => listFriendships(user!.id),
    enabled: !!user,
  });

  const accepted = friendships.filter((f) => f.status === 'accepted');
  const incoming = friendships.filter(
    (f) => f.status === 'pending' && f.addressee_id === user?.id
  );
  const outgoing = friendships.filter(
    (f) => f.status === 'pending' && f.requester_id === user?.id
  );

  const add = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not signed in.');
      const p = await findProfileByCodeOrUsername(needle);
      if (!p) throw new Error('No user found with that code or username.');
      if (p.id === user.id) throw new Error("That's your own code.");
      await sendFriendRequest(user.id, p.id);
      return p.username;
    },
    onSuccess: (username) => {
      setNeedle('');
      setErr(null);
      setInfo(`Friend request sent to @${username}.`);
      qc.invalidateQueries({ queryKey: qk.friendships });
    },
    onError: (e: Error) => {
      setInfo(null);
      setErr(e.message);
    },
  });

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      respondFriendRequest(id, accept),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.friendships }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeFriend(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.friendships }),
  });

  return (
    <Layout>
      <div className="page">
        <h2>Friends</h2>

        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>Your share code</div>
          <div className="share-code" style={{ marginTop: 8 }}>
            {profile?.share_code ?? '—'}
          </div>
          <button
            className="ghost"
            style={{ width: '100%', marginTop: 8 }}
            onClick={() => {
              if (profile?.share_code) {
                navigator.clipboard?.writeText(profile.share_code);
                setInfo('Code copied.');
              }
            }}
          >
            Copy
          </button>
        </div>

        <h3 style={{ marginTop: 24 }}>Add a friend</h3>
        <div className="stack">
          <input
            placeholder="Code (K7W-PINE) or username"
            value={needle}
            onChange={(e) => setNeedle(e.target.value)}
          />
          {err && <div className="error">{err}</div>}
          {info && <div className="muted">{info}</div>}
          <button onClick={() => add.mutate()} disabled={!needle.trim() || add.isPending}>
            {add.isPending ? 'Sending…' : 'Send request'}
          </button>
        </div>

        {incoming.length > 0 && (
          <>
            <h3 style={{ marginTop: 24 }}>Incoming</h3>
            <div className="list">
              {incoming.map((f) => (
                <div key={f.id} className="card row-between">
                  <span>@{f.other?.username ?? '…'}</span>
                  <div className="row" style={{ gap: 8 }}>
                    <button onClick={() => respond.mutate({ id: f.id, accept: true })}>
                      Accept
                    </button>
                    <button
                      className="ghost"
                      onClick={() => respond.mutate({ id: f.id, accept: false })}
                    >
                      Block
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {outgoing.length > 0 && (
          <>
            <h3 style={{ marginTop: 24 }}>Pending</h3>
            <div className="list">
              {outgoing.map((f) => (
                <div key={f.id} className="card row-between">
                  <span>@{f.other?.username ?? '…'}</span>
                  <button className="ghost" onClick={() => remove.mutate(f.id)}>
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 style={{ marginTop: 24 }}>Friends ({accepted.length})</h3>
        {accepted.length === 0 ? (
          <p className="muted">No friends yet. Share your code above.</p>
        ) : (
          <div className="list">
            {accepted.map((f) => (
              <div key={f.id} className="card row-between">
                <span>@{f.other?.username ?? '…'}</span>
                <button className="ghost" onClick={() => remove.mutate(f.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
