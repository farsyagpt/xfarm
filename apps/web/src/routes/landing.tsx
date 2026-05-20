import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#05070f', color: '#f8fafc' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,7,15,0.8)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.12em', background: 'linear-gradient(135deg,#60a5fa,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>XFARMING</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>BETA</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }}>Masuk</Link>
            <Link to="/signup" className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Mulai Gratis</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', paddingTop: 140, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, overflow: 'hidden' }}>
        {/* Orbs */}
        <div className="orb anim-pulse-slow" style={{ width: 500, height: 500, background: '#3b82f6', top: -100, left: '10%' }} />
        <div className="orb anim-pulse-slow" style={{ width: 400, height: 400, background: '#a855f7', top: 50, right: '5%', animationDelay: '2s' }} />
        <div className="orb" style={{ width: 300, height: 300, background: '#22c55e', bottom: 0, left: '40%', opacity: 0.08 }} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          {/* Badge */}
          <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)' }}>CONTENT ENGINE · POWERED BY AI</span>
          </div>

          <h1 className="anim-fade-up-2" style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 24 }}>
            Produksi konten viral<br />
            <span className="grad-blue-purple">10× lebih cepat</span>
          </h1>

          <p className="anim-fade-up-3" style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Hero Video naratif, animasi Trendline finansial, dan bulk carousel berita — semua otomatis, output siap posting.
          </p>

          {/* Stats */}
          <div className="anim-fade-up-3" style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 44 }}>
            {[
              { n: '3', l: 'Fitur Produksi' },
              { n: '60+', l: 'Sumber Berita' },
              { n: '100%', l: 'Otomatis' },
              { n: '0s', l: 'Manual Edit' },
            ].map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#f8fafc,rgba(255,255,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div className="anim-fade-up-4" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/signup" className="btn-primary">
              Mulai Sekarang
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link to="/login" className="btn-ghost">Sudah punya akun</Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>FITUR UTAMA</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>Tiga mesin konten dalam satu platform</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <FeatureCard
              color="#3b82f6"
              tag="HERO VIDEO"
              icon="🎬"
              title="Foto + Teks → Video Naratif"
              desc="Upload foto PNG transparan, pilih posisi (tengah/kanan), tulis narasi. Sistem generate video dengan animasi masuk dari bawah + TTS voice otomatis."
              bullets={['Animasi foto dari bawah ke atas', 'TTS suara Indonesia (male/female)', 'Pilih posisi foto: tengah atau kanan', 'Output MP4 siap TikTok/Reels']}
              delay={0}
            />
            <FeatureCard
              color="#a855f7"
              tag="TRENDLINE"
              icon="📈"
              title="Simulasi Finansial → Chart Viral"
              desc="Input dua variabel (misal: Gofood 50rb/hari vs Warteg+Investasi 15rb+35rb), pilih durasi simulasi. Render animasi chart yang viral di konten edukasi finansial."
              bullets={['Input nominal X vs Y bebas', 'Simulasi harian/bulanan/tahunan', 'Animasi dual-line 7 detik', 'Tema dark/light, berbagai rasio']}
              delay={0.1}
            />
            <FeatureCard
              color="#22c55e"
              tag="XFARM"
              icon="🌾"
              title="RSS Feed → Carousel Massal"
              desc="Pilih dari 60+ sumber berita Indonesia & internasional. Generate carousel 5-slide per berita dengan AI image + overlay teks otomatis. Output ZIP siap upload."
              bullets={['60+ sumber RSS aktif', '5 slide per berita otomatis', 'AI image generation', 'Bulk hingga 200 berita sekaligus']}
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>CARA KERJA</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>Async pipeline, output ke storage</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { n: '01', c: '#3b82f6', t: 'Upload Input', d: 'Foto PNG, atau langsung pilih feed berita dari dashboard.' },
              { n: '02', c: '#a855f7', t: 'Job Di-queue', d: 'Cloudflare Queue terima job, Worker enqueue ke HF Space.' },
              { n: '03', c: '#ef4444', t: 'AI Compute', d: 'HuggingFace Space jalankan pipeline, upload output ke Supabase.' },
              { n: '04', c: '#22c55e', t: 'Download', d: 'Status real-time. Selesai → download MP4/ZIP langsung.' },
            ].map(s => (
              <div key={s.n} className="glass" style={{ borderRadius: 16, padding: '24px 20px' }}>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: s.c, marginBottom: 12, fontWeight: 700 }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.t}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 400, height: 400, background: '#a855f7', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.1 }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Siap scale konten?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 36 }}>
            Bayar via QRIS, aktivasi manual. Tidak ada subscription trap.
          </p>
          <Link to="/signup" className="btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>
            Buat Akun Sekarang →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 xfarming · Content Production Engine</span>
      </footer>
    </div>
  );
}

function FeatureCard({ color, tag, icon, title, desc, bullets, delay }: {
  color: string; tag: string; icon: string; title: string; desc: string; bullets: string[]; delay: number;
}) {
  return (
    <div className="glass" style={{
      borderRadius: 20, padding: 28,
      borderColor: `${color}22`,
      animation: `fadeUp 0.6s ${delay}s ease both`,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px ${color}22`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color, padding: '3px 10px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}33` }}>{tag}</span>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 20 }}>{desc}</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bullets.map(b => (
          <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
