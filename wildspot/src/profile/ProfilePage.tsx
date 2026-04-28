import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthProvider';
import { listLeaderboard } from '../captures/api';
import { qk } from '../lib/queryKeys';

export function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const { data: lb = [] } = useQuery({
    queryKey: qk.leaderboard,
    queryFn: listLeaderboard,
  });
  const mine = lb.find((r) => r.user_id === user?.id);

  const forceRefresh = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    location.reload();
  };

  return (
    <Layout>
      <div className="page">
        <h2>Me</h2>
        <div className="card">
          <div className="muted" style={{ fontSize: 13 }}>Username</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>
            @{profile?.username ?? '…'}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 12 }}>Email</div>
          <div>{user?.email}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 12 }}>Share code</div>
          <div className="share-code" style={{ marginTop: 8 }}>
            {profile?.share_code ?? '—'}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Stats</h3>
          <div className="row-between">
            <span className="muted">Captures this month</span>
            <span style={{ fontWeight: 600 }}>{mine?.captures_month ?? 0}</span>
          </div>
          <div className="row-between" style={{ marginTop: 8 }}>
            <span className="muted">Captures all time</span>
            <span style={{ fontWeight: 600 }}>{mine?.captures_all_time ?? 0}</span>
          </div>
        </div>

        <button className="ghost" style={{ width: '100%' }} onClick={forceRefresh}>
          Force refresh app
        </button>
        <button
          className="danger"
          style={{ width: '100%', marginTop: 8 }}
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    </Layout>
  );
}
