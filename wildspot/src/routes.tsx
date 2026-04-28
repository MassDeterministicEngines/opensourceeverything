import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { LoginPage } from './auth/LoginPage';
import { SignupPage } from './auth/SignupPage';
import { MapView } from './map/MapView';
import { SpotDetailPage } from './spots/SpotDetailPage';
import { AddSpotPage } from './spots/AddSpotPage';
import { FriendsPage } from './friends/FriendsPage';
import { LeaderboardPage } from './leaderboard/LeaderboardPage';
import { ProfilePage } from './profile/ProfilePage';

function Gate({ children }: { children: JSX.Element }) {
  const { loading, session } = useAuth();
  if (loading) return <div className="page center muted">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<Gate><MapView /></Gate>} />
      <Route path="/spots/new" element={<Gate><AddSpotPage /></Gate>} />
      <Route path="/spots/:id" element={<Gate><SpotDetailPage /></Gate>} />
      <Route path="/friends" element={<Gate><FriendsPage /></Gate>} />
      <Route path="/leaderboard" element={<Gate><LeaderboardPage /></Gate>} />
      <Route path="/profile" element={<Gate><ProfilePage /></Gate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
