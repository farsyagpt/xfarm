import { useState } from 'react';
import { useMe } from '../ui/hooks';
import { apiFetch } from '../lib/api';
import { TOKENS_PER_PACKAGE, PRICE_PER_PACKAGE } from '@xfarming/shared';

type AdminUser = {
  id: string; email: string; status: string;
  tokens: number; role: string; created_at: string;
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}rb`;
  return String(n);
}

export function AdminPage() {
  const { data: me } = useMe();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [topupAmounts, setTopupAmounts] = useState<Record<string, number>>({});

  if (me?.role !== 'admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="glass" style={{ borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Akses Ditolak</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Halaman ini hanya untuk admin.</div>
        </div>
      </div>
    );
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await apiFetch<{ users: AdminUser[] }>('/api/admin/users');
      setUsers(res.users);
      setLoaded(true);
    } catch (e) {
      setMsg({ text: String(e), ok: false });
    } finally { setLoading(false); }
  }

  async function activate(id: string) {
    try {
      await apiFetch(`/api/admin/users/${id}/activate`, { method: 'POST', body: '{}' });
      setMsg({ text: 'Akun diaktifkan!', ok: true });
      setUsers(u => u.map(x => x.id === id ? { ...x, status: 'active' } : x));
    } catch (e) { setMsg({ text: String(e), ok: false }); }
  }

  async function suspend(id: string) {
    try {
      await apiFetch(`/api/admin/users/${id}/suspend`, { method: 'POST', body: '{}' });
      setMsg({ text: 'Akun disuspend.', ok: true });
      setUsers(u => u.map(x => x.id === id ? { ...x, status: 'suspended' } : x));
    } catch (e) { setMsg({ text: String(e), ok: false }); }
  }

  async function topup(id: string) {
    const amount = topupAmounts[id] || TOKENS_PER_PACKAGE;
    try {
      await apiFetch(`/api/admin/users/${id}/topup`, { method: 'POST', body: JSON.stringify({ amount }) });
      setMsg({ text: `+${fmt(amount)} token ditambahkan!`, ok: true });
      setUsers(u => u.map(x => x.id === id ? { ...x, tokens: x.tokens + amount } : x));
    } catch (e) { setMsg({ text: String(e), ok: false }); }
  }

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>⚙️</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#fbbf24', padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>ADMIN PANEL</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>Manajemen User</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Aktivasi akun, topup token, suspend user.</p>
      </div>

      {/* Pricing info */}
      <div className="glass" style={{ borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Harga Paket</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Rp {(PRICE_PER_PACKAGE/1000).toFixed(0)}rb = {fmt(TOKENS_PER_PACKAGE)} Token</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Per Konten</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>4.000 token</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Hero Video</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>20.000 token</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Trendline</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>12.000 token</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Enterprise</div>
          <a href={`https://wa.me/6281310203421?text=${encodeURIComponent('Halo, saya ingin Enterprise Token xfarming.')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#4ade80', fontWeight: 700, textDecoration: 'none' }}>via WhatsApp →</a>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 16, background: msg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, fontSize: 13, color: msg.ok ? '#4ade80' : '#f87171', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {!loaded ? (
        <button className="btn-primary" onClick={loadUsers} disabled={loading} style={{ marginBottom: 20 }}>
          {loading ? 'Memuat...' : '📋 Load Semua User'}
        </button>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{users.length} user terdaftar</span>
          <button onClick={loadUsers} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>↻ Refresh</button>
        </div>
      )}

      {loaded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(u => (
            <div key={u.id} className="glass" style={{ borderRadius: 14, padding: '16px 20px', borderColor: u.status === 'active' ? 'rgba(34,197,94,0.2)' : u.status === 'suspended' ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{u.email}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: u.status==='active'?'rgba(34,197,94,0.15)':u.status==='suspended'?'rgba(239,68,68,0.15)':'rgba(251,191,36,0.15)',
                      color: u.status==='active'?'#4ade80':u.status==='suspended'?'#f87171':'#fbbf24',
                      border: `1px solid ${u.status==='active'?'rgba(34,197,94,0.3)':u.status==='suspended'?'rgba(239,68,68,0.3)':'rgba(251,191,36,0.3)'}`,
                    }}>{u.status.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    ID: <span style={{ fontFamily: 'monospace' }}>{u.id.slice(0, 16)}...</span>
                    {' · '}Token: <span style={{ color: u.tokens > 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{fmt(u.tokens)}</span>
                    {' · '}{new Date(u.created_at).toLocaleDateString('id-ID')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Topup */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select
                      value={topupAmounts[u.id] || TOKENS_PER_PACKAGE}
                      onChange={e => setTopupAmounts(prev => ({ ...prev, [u.id]: Number(e.target.value) }))}
                      style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: 11, cursor: 'pointer' }}
                    >
                      <option value={400000}>400rb (Rp 50rb)</option>
                      <option value={800000}>800rb (Rp 100rb)</option>
                      <option value={2000000}>2jt (Enterprise)</option>
                      <option value={100000}>100rb (Test)</option>
                    </select>
                    <button onClick={() => topup(u.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                      + Token
                    </button>
                  </div>

                  {u.status !== 'active' && (
                    <button onClick={() => activate(u.id)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                      ✓ Aktifkan
                    </button>
                  )}
                  {u.status === 'active' && (
                    <button onClick={() => suspend(u.id)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                      Suspend
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
