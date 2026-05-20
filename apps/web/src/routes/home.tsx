import { Link } from 'react-router-dom';
import { useMe } from '../ui/hooks';
import { TOKEN_COST, TOKENS_PER_PACKAGE, PRICE_PER_PACKAGE } from '@xfarming/shared';

const TOOLS = [
  {
    to: '/app/hero-video',
    icon: '🎬',
    color: '#3b82f6',
    grad: 'linear-gradient(135deg,#3b82f6,#6366f1)',
    tag: 'INFINITY',
    title: 'Hero Video',
    desc: 'Foto PNG + narasi → video animasi naratif siap TikTok/Reels.',
    cost: TOKEN_COST.infinity,
    unit: 'per video',
  },
  {
    to: '/app/trendline',
    icon: '📈',
    color: '#a855f7',
    grad: 'linear-gradient(135deg,#a855f7,#ec4899)',
    tag: 'TRENDLINE',
    title: 'Simulasi Finansial',
    desc: 'Input X vs Y + compounding → animasi chart viral edukasi finansial.',
    cost: TOKEN_COST.trendline,
    unit: 'per chart',
  },
  {
    to: '/app/xfarm',
    icon: '🌾',
    color: '#22c55e',
    grad: 'linear-gradient(135deg,#22c55e,#06b6d4)',
    tag: 'XFARM',
    title: 'Bulk Carousel',
    desc: '60+ sumber RSS → carousel 5-slide per berita, output ZIP.',
    cost: TOKEN_COST.xfarm,
    unit: 'per berita',
  },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}rb`;
  return String(n);
}

export function HomePage() {
  const { data: me } = useMe();
  const tokens = me?.tokens ?? 0;
  const pct = Math.min(100, (tokens / TOKENS_PER_PACKAGE) * 100);
  const contentLeft = Math.floor(tokens / 4_000);

  return (
    <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── HERO GREETING ── */}
      <div style={{
        borderRadius: 20, padding: '28px 32px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(168,85,247,0.08))',
        border: '1px solid rgba(99,102,241,0.2)',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(168,85,247,0.08)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>DASHBOARD</p>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4, lineHeight: 1.1 }}>
            Selamat datang 👋
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>{me?.email}</p>

          {/* Token bar */}
          <div style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Token Balance</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: tokens > 50_000 ? '#4ade80' : '#f87171' }}>
                {fmt(tokens)} token
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width 0.8s ease',
                width: `${pct}%`,
                background: tokens > 100_000 ? 'linear-gradient(90deg,#22c55e,#06b6d4)' : tokens > 20_000 ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'linear-gradient(90deg,#ef4444,#f87171)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>≈ {contentLeft} konten tersisa</span>
              <Link to="/app/pay" style={{ fontSize: 11, color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>+ Topup Token →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOOL CARDS ── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: 14 }}>TOOLS</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {TOOLS.map((t, i) => (
            <Link key={t.to} to={t.to} style={{ textDecoration: 'none', animation: `fadeUp 0.5s ${i * 0.08}s ease both` }}>
              <div className="glass" style={{
                borderRadius: 18, padding: '22px 20px',
                borderColor: `${t.color}25`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 16px 40px ${t.color}20`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: t.color, padding: '3px 10px', borderRadius: 20, background: `${t.color}18`, border: `1px solid ${t.color}30` }}>{t.tag}</span>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.01em' }}>{t.title}</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 16 }}>{t.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: t.color, fontWeight: 700 }}>Buka →</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {fmt(t.cost)} token {t.unit}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── PRICING REMINDER ── */}
      <div className="glass" style={{ borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: '1 Paket', val: `Rp ${(PRICE_PER_PACKAGE/1000).toFixed(0)}rb` },
            { label: '400rb Token', val: '100 Konten' },
            { label: 'Hero Video', val: '20rb token' },
            { label: 'Trendline', val: '12rb token' },
            { label: 'XFarm/item', val: '4rb token' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{s.val}</div>
            </div>
          ))}
        </div>
        <Link to="/app/pay" className="btn-primary" style={{ padding: '8px 18px', fontSize: 12, flexShrink: 0 }}>
          Topup Token
        </Link>
      </div>
    </div>
  );
}
