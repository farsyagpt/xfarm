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
    <div style={{ minHeight: '100vh', background: '#05070f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      <div className="orb anim-pulse-slow" style={{ width: 400, height: 400, background: '#3b82f6', top: -100, left: -100 }} />
      <div className="orb anim-pulse-slow" style={{ width: 300, height: 300, background: '#a855f7', bottom: -50, right: -50, animationDelay: '2s' }} />

      <div className="anim-fade-up" style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0.12em', background: 'linear-gradient(135deg,#60a5fa,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>XFARMING</span>
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Content Production Engine</p>
        </div>

        <div className="glass" style={{ borderRadius: 20, padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Selamat datang kembali</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Masuk untuk mulai produksi konten.</p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            try {
              await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
              nav('/app', { replace: true });
            } catch (err) {
              setError(String(err));
            } finally {
              setLoading(false);
            }
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>EMAIL</label>
                <input className="input-glass" type="email" required placeholder="kamu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>PASSWORD</label>
                <input className="input-glass" type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin-slow 1s linear infinite' }}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" strokeDasharray="20" strokeDashoffset="10" strokeLinecap="round"/></svg>
                    Masuk...
                  </span>
                ) : 'Masuk →'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 24 }}>
            Belum punya akun?{' '}
            <Link to="/signup" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Daftar sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
