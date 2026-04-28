import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      setErr('Username: 3–24 letters, numbers, or underscores.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    nav('/', { replace: true });
  };

  return (
    <div className="page center">
      <h1 style={{ marginTop: 40 }}>Create account</h1>
      <p className="muted">Pick a username your friends will recognize.</p>
      <form onSubmit={onSubmit} className="stack" style={{ marginTop: 24, textAlign: 'left' }}>
        <div>
          <label>Username</label>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={24}
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {err && <div className="error">{err}</div>}
        <button type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p style={{ marginTop: 24 }} className="muted">
        Already have one? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
