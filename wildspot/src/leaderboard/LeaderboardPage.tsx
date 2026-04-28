import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { listLeaderboard } from '../captures/api';
import { qk } from '../lib/queryKeys';

export function LeaderboardPage() {
  const [tab, setTab] = useState<'month' | 'all'>('month');
  const { data = [], isLoading } = useQuery({
    queryKey: qk.leaderboard,
    queryFn: listLeaderboard,
  });

  const sorted = [...data].sort((a, b) => {
    if (tab === 'month') return b.captures_month - a.captures_month;
    return b.captures_all_time - a.captures_all_time;
  });

  return (
    <Layout>
      <div className="page">
        <h2>Leaderboard</h2>
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <span
            className={`chip ${tab === 'month' ? 'active' : ''}`}
            onClick={() => setTab('month')}
          >
            This month
          </span>
          <span
            className={`chip ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            All time
          </span>
        </div>
        {isLoading ? (
          <p className="muted" style={{ marginTop: 16 }}>Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="muted" style={{ marginTop: 16 }}>
            No captures yet. Get out there.
          </p>
        ) : (
          <div className="list" style={{ marginTop: 16 }}>
            {sorted.map((row, i) => (
              <div key={row.user_id} className="card row-between">
                <div className="row" style={{ gap: 12 }}>
                  <span style={{ width: 28, textAlign: 'right', color: 'var(--accent)' }}>
                    #{i + 1}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {row.display_name || row.username}
                  </span>
                </div>
                <span style={{ fontWeight: 600 }}>
                  {tab === 'month' ? row.captures_month : row.captures_all_time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
