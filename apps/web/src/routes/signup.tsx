import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#05070f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div className="orb anim-pulse-slow" style={{ width: 400, height: 400, background: '#a855f7', top: -100, right: -100 }} />
      <div className="orb anim-pulse-slow" style={{ width: 300, height: 300, background: '#22c55e', bottom: -50, left: -50, animationDelay: '1.5s' }} />

      <div className="anim-fade-up" style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0.12em', background: 'linear-gradient(135deg,#60a5fa,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>XFARMING</span>
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Content Production Engine</p>
        </div>

        <div className="glass" style={{ borderRadius: 20, padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Buat akun baru</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Setelah daftar, bayar via QRIS → aktivasi manual.</p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            try {
              await apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
              nav('/app/pay', { replace: true });
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
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>PASSWORD <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>(min 8 karakter)</span></label>
                <input className="input-glass" type="password" required minLength={8} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
                {loading ? 'Membuat akun...' : 'Buat Akun →'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 24 }}>
            Sudah punya akun?{' '}
            <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
