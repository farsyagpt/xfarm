import { Link } from 'react-router-dom';
import { useMe } from '../ui/hooks';

const TOOLS = [
  {
    to: '/app/hero-video',
    icon: '🎬',
    color: '#3b82f6',
    tag: 'INFINITY',
    title: 'Hero Video',
    desc: 'Upload foto PNG transparan + narasi → video animasi dengan TTS voice siap TikTok/Reels.',
    stat: 'MP4 Output',
  },
  {
    to: '/app/trendline',
    icon: '📈',
    color: '#a855f7',
    tag: 'TRENDLINE',
    title: 'Simulasi Finansial',
    desc: 'Input dua variabel (X vs Y), pilih durasi → animasi chart viral untuk konten edukasi finansial.',
    stat: 'Chart Animasi',
  },
  {
    to: '/app/xfarm',
    icon: '🌾',
    color: '#22c55e',
    tag: 'XFARM',
    title: 'Bulk Carousel',
    desc: 'Pilih dari 60+ sumber RSS → generate carousel 5-slide per berita dengan AI image otomatis.',
    stat: 'ZIP Bundle',
  },
];

export function HomePage() {
  const { data: me } = useMe();

  return (
    <div className="anim-fade-in">
      {/* ── GREETING ── */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>DASHBOARD</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Selamat datang 👋
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Status akun:</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: me?.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
            border: `1px solid ${me?.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
            color: me?.status === 'active' ? '#4ade80' : '#fbbf24',
          }}>
            {me?.status === 'active' ? '● AKTIF' : '● PENDING'}
          </span>
        </div>
      </div>

      {/* ── TOOL CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
        {TOOLS.map((t, i) => (
          <Link
            key={t.to}
            to={t.to}
            style={{ textDecoration: 'none', animation: `fadeUp 0.5s ${i * 0.1}s ease both` }}
          >
            <div
              className="glass"
              style={{
                borderRadius: 18, padding: 24,
                borderColor: `${t.color}22`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 48px ${t.color}22`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: t.color, padding: '3px 10px', borderRadius: 20, background: `${t.color}18`, border: `1px solid ${t.color}33` }}>{t.tag}</span>
                <span style={{ fontSize: 22 }}>{t.icon}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t.title}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 20 }}>{t.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: t.color, fontWeight: 600 }}>Buka →</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{t.stat}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── QUICK TIPS ── */}
      <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>TIPS CEPAT</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { icon: '🎬', t: 'Hero Video', d: 'Gunakan foto PNG dengan background transparan untuk hasil terbaik.' },
            { icon: '📈', t: 'Trendline', d: 'Input nominal harian, sistem hitung otomatis untuk 30/90/365 hari.' },
            { icon: '🌾', t: 'XFarm', d: 'Pilih "Aggregated" untuk 60+ sumber sekaligus, max 200 berita.' },
          ].map(tip => (
            <div key={tip.t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{tip.t}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{tip.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
