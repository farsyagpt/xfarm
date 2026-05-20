import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useMe } from '../ui/hooks';

// Fallback ke env var, atau hardcode nomor admin
const ADMIN_WA = (import.meta.env.VITE_ADMIN_WA as string | undefined) || '6281310203421';

export function PaywallPage() {
  const { data: me } = useMe();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isActive = me?.status === 'active';

  async function handleWA() {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiFetch<{ url: string }>('/api/billing/whatsapp', {
        method: 'POST',
        body: JSON.stringify({ phone: ADMIN_WA }),
      });
      window.open(res.url, '_blank', 'noopener,noreferrer');
      setSent(true);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>💳</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#fbbf24', padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>PEMBAYARAN</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Aktivasi Akun</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Bayar via QRIS → konfirmasi ke WhatsApp → akun diaktifkan manual.
        </p>
      </div>

      {/* Status banner */}
      <div style={{
        padding: '14px 18px', borderRadius: 12, marginBottom: 24,
        background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
        border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)'}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>{isActive ? '✅' : '⏳'}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#4ade80' : '#fbbf24' }}>
            {isActive ? 'Akun sudah aktif' : 'Menunggu aktivasi'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {isActive
              ? 'Semua fitur sudah bisa digunakan.'
              : 'Selesaikan pembayaran dan konfirmasi ke admin.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* QRIS */}
        <div className="glass" style={{ borderRadius: 18, padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>STEP 1 — BAYAR VIA QRIS</p>
          <div style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', padding: 8 }}>
            <img src="/qris.png" alt="QRIS" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} />
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Scan QRIS dengan:</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['GoPay', 'OVO', 'Dana', 'BCA', 'Mandiri', 'BRI'].map(b => (
                <span key={b} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="glass" style={{ borderRadius: 18, padding: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>STEP 2 — KONFIRMASI KE ADMIN</p>

          <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Pesan yang akan dikirim otomatis:</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontStyle: 'italic' }}>
              "Halo admin, saya sudah bayar. Mohon aktivasi akun:<br />
              email: {me?.email}<br />
              user_id: {me?.id}"
            </p>
          </div>

          {err && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
              {err}
            </div>
          )}

          {sent && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 13, color: '#4ade80', marginBottom: 16 }}>
              ✅ WhatsApp dibuka! Kirim pesan ke admin untuk aktivasi.
            </div>
          )}

          <button
            className="btn-primary"
            disabled={loading || isActive}
            onClick={handleWA}
            style={{ width: '100%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', fontSize: 14 }}
          >
            {loading ? 'Membuka WhatsApp...' : isActive ? '✅ Akun Sudah Aktif' : '💬 Konfirmasi via WhatsApp'}
          </button>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
            Aktivasi manual dalam 1×24 jam.<br />
            Hubungi admin jika lebih dari itu.
          </p>
        </div>
      </div>

      {/* Pricing info */}
      <div className="glass" style={{ borderRadius: 16, padding: 20, marginTop: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>APA YANG KAMU DAPAT</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { icon: '🎬', t: 'Hero Video', d: 'Generate video naratif dari foto PNG + teks' },
            { icon: '📈', t: 'Trendline', d: 'Animasi chart finansial viral' },
            { icon: '🌾', t: 'XFarm Bulk', d: 'Carousel dari 60+ sumber berita' },
            { icon: '☁️', t: 'Cloud Storage', d: 'Output tersimpan aman di Supabase' },
          ].map(f => (
            <div key={f.t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{f.t}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
