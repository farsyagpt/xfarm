import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="text-sm font-semibold">Login</div>
          <p className="mt-2 text-sm text-slate-300">Masuk untuk akses dashboard.</p>

          <form
            className="mt-6 grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              try {
                await apiFetch('/api/auth/login', {
                  method: 'POST',
                  body: JSON.stringify({ email, password }),
                });
                nav('/app', { replace: true });
              } catch (err) {
                setError(String(err));
              } finally {
                setLoading(false);
              }
            }}
          >
            <label className="grid gap-1 text-xs text-slate-300">
              Email
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-300">
              Password
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>
            {error ? <div className="text-xs text-red-400">{error}</div> : null}
            <button
              className="mt-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Login'}
            </button>
          </form>

          <div className="mt-4 text-xs text-slate-400">
            Belum punya akun?{' '}
            <Link className="text-cyan-300 hover:text-cyan-200" to="/signup">
              Signup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

