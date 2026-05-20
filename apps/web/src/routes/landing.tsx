import { Link } from 'react-router-dom';

const STATS = [
  { n: '60+', l: 'Sumber Berita' },
  { n: '3', l: 'Tools Produksi' },
  { n: '100%', l: 'Otomatis' },
  { n: 'Rp 50rb', l: 'Per 100 Konten' },
];

export function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#05070f', color: '#f8fafc', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,7,15,0.85)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: '0.12em', background: 'linear-gradient(135deg,#60a5fa,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>XFARMING</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>BETA</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }}>Masuk</Link>
            <Link to="/signup" className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Mulai Gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', paddingTop: 140, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, overflow: 'hidden' }}>
        <div className="orb anim-pulse-slow" style={{ width: 500, height: 500, background: '#3b82f6', top: -100, left: '5%' }} />
        <div className="orb anim-pulse-slow" style={{ width: 400, height: 400, background: '#a855f7', top: 50, right: '5%', animationDelay: '2s' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)' }}>TOOLS CONTENT VIRAL · POWERED BY AI</span>
          </div>

          <h1 className="anim-fade-up-2" style={{ fontSize: 'clamp(38px,6vw,72px)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Buat konten viral<br />
            <span style={{ background: 'linear-gradient(135deg,#60a5fa,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>tanpa effort manual.</span>
          </h1>

          <p className="anim-fade-up-3" style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Hero Video naratif, animasi Trendline finansial, dan bulk carousel berita — semua otomatis, output siap posting.
          </p>

          {/* Stats */}
          <div className="anim-fade-up-3" style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 44, flexWrap: 'wrap' }}>
            {STATS.map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, background: 'linear-gradient(135deg,#f8fafc,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div className="anim-fade-up-4" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/signup" className="btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
              Mulai Sekarang →
            </Link>
            <Link to="/login" className="btn-ghost" style={{ fontSize: 15, padding: '12px 28px' }}>Sudah punya akun</Link>
          </div>
        </div>
      </section>

      {/* PRICING HIGHLIGHT */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ borderRadius: 20, padding: '28px 32px', background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>HARGA TRANSPARAN</p>
            <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
              <span style={{ background: 'linear-gradient(135deg,#60a5fa,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rp 50.000</span>
            </div>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>= 400.000 Token = <strong style={{ color: '#f8fafc' }}>100 Konten</strong></p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                { icon: '🎬', t: 'Hero Video', c: '20rb token' },
                { icon: '📈', t: 'Trendline', c: '12rb token' },
                { icon: '🌾', t: 'XFarm/item', c: '4rb token' },
              ].map(f => (
                <div key={f.t} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{f.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{f.t}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{f.c}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
              Butuh lebih? <strong style={{ color: '#a78bfa' }}>Enterprise Token</strong> tersedia via WhatsApp.
            </p>
            <Link to="/signup" className="btn-primary" style={{ fontSize: 14, padding: '11px 28px' }}>Beli Akses Sekarang</Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '0 24px 80px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>FITUR UTAMA</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em' }}>Tiga mesin konten dalam satu platform</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {[
              { color: '#3b82f6', tag: 'HERO VIDEO', icon: '🎬', title: 'Foto + Teks → Video Naratif', desc: 'Upload foto PNG transparan, pilih posisi & background, tulis narasi. Sistem generate video animasi + TTS voice otomatis.', bullets: ['Animasi foto dari bawah ke atas', 'TTS suara Indonesia', 'Format 9:16 atau 16:9', 'Pilih warna background'] },
              { color: '#a855f7', tag: 'TRENDLINE', icon: '📈', title: 'Simulasi Finansial → Chart Viral', desc: 'Input X vs Y dengan compounding investasi. Pilih yield tahunan dan durasi. Render animasi chart yang viral di konten edukasi finansial.', bullets: ['Compounding otomatis', 'Pilih yield % per tahun', 'Durasi bulan atau tahun', 'Animasi dual-line 7 detik'] },
              { color: '#22c55e', tag: 'XFARM', icon: '🌾', title: 'RSS Feed → Carousel Massal', desc: 'Pilih dari 60+ sumber berita. Generate carousel 5-slide per berita dengan AI image + overlay teks otomatis. Output ZIP siap upload.', bullets: ['60+ sumber RSS aktif', '5 slide per berita', 'AI image generation', 'Bulk hingga 50 berita'] },
            ].map((f, i) => (
              <div key={f.tag} className="glass" style={{ borderRadius: 20, padding: 28, borderColor: `${f.color}22`, animation: `fadeUp 0.6s ${i*0.1}s ease both`, transition: 'transform 0.2s,box-shadow 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 20px 60px ${f.color}22`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: f.color, padding: '3px 10px', borderRadius: 20, background: `${f.color}18`, border: `1px solid ${f.color}33` }}>{f.tag}</span>
                  <span style={{ fontSize: 24 }}>{f.icon}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, lineHeight: 1.3 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 18 }}>{f.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {f.bullets.map(b => (
                    <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: f.color, flexShrink: 0 }} />{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 400, height: 400, background: '#a855f7', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.1 }} />
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 14 }}>Siap scale konten?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Mulai dengan Rp 50.000 untuk 100 konten. Tidak ada subscription.</p>
          <Link to="/signup" className="btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>Buat Akun Sekarang →</Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 xfarming · Tools Content Viral</span>
      </footer>
    </div>
  );
}
