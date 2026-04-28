import { NavLink } from 'react-router-dom';

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end>
        <span className="icon">🗺️</span>
        <span>Map</span>
      </NavLink>
      <NavLink to="/friends">
        <span className="icon">👥</span>
        <span>Friends</span>
      </NavLink>
      <NavLink to="/leaderboard">
        <span className="icon">🏆</span>
        <span>Leaders</span>
      </NavLink>
      <NavLink to="/profile">
        <span className="icon">🧭</span>
        <span>Me</span>
      </NavLink>
    </nav>
  );
}
