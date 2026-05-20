import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080C10] text-white font-sans">

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#080C10]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-[0.2em] text-white/90 uppercase">xfarming</span>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-medium text-cyan-400">beta</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-3 py-1.5 text-xs text-white/50 hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/signup" className="px-3 py-1.5 rounded-md bg-white text-[#080C10] text-xs font-semibold hover:bg-white/90 transition-colors">
              Get access
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* grid bg */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Content engine — Hero Video · Trendline · XFarm
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Produksi konten skala besar,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              tanpa bottleneck.
            </span>
          </h1>

          <p className="text-base text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
            Satu platform untuk generate Hero Video naratif, animasi Trendline dari CSV,
            dan bulk carousel dari 60+ RSS feed — semua async, output langsung ke storage.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-[#080C10] hover:bg-cyan-400 transition-colors"
            >
              Mulai sekarang
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard
              tag="INFINITY"
              title="Hero Video"
              desc="Upload video 16:9 + teks cerita. Pipeline generate TTS, enhance audio, render subtitle word-by-word, output MP4."
              accent="cyan"
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7.5l3 1.5-3 1.5V7.5z" fill="currentColor"/><path d="M6 15h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              }
            />
            <FeatureCard
              tag="TRENDLINE"
              title="Animated Chart"
              desc="Upload CSV dua kolom. Render animasi dual-line chart 7 detik dengan tema dark/light, aspect ratio bebas."
              accent="violet"
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 13l4-4 3 2 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="9" r="1.5" fill="currentColor"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/></svg>
              }
            />
            <FeatureCard
              tag="XFARM"
              title="Bulk Content"
              desc="Pilih feed dari 60+ sumber RSS. Generate carousel 5-slide per berita dengan AI image + overlay teks otomatis."
              accent="emerald"
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>
              }
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 pb-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl pt-20">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-cyan-400/70 uppercase mb-3">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight">Async job pipeline</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { n: '01', title: 'Upload input', desc: 'Video, CSV, atau pilih RSS feed langsung dari dashboard.' },
              { n: '02', title: 'Job di-queue', desc: 'Cloudflare Queue terima job, Worker enqueue ke HF Space.' },
              { n: '03', title: 'HF compute', desc: 'HuggingFace Space jalankan pipeline, upload output ke Supabase.' },
              { n: '04', title: 'Download', desc: 'Status real-time. Selesai → download langsung dari dashboard.' },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <div className="text-[11px] font-mono text-white/20 mb-3">{s.n}</div>
                <div className="text-sm font-semibold mb-2">{s.title}</div>
                <div className="text-xs text-white/40 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STACK */}
      <section className="px-6 pb-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl pt-20">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-white/30 uppercase">Built on</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {['Cloudflare Pages', 'Cloudflare Workers', 'D1 SQLite', 'Cloudflare Queues', 'Supabase Storage', 'HuggingFace Spaces', 'React + Vite', 'Hono'].map((t) => (
              <span key={t} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 border-t border-white/5">
        <div className="mx-auto max-w-2xl pt-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Siap produksi konten?</h2>
          <p className="text-sm text-white/40 mb-8">Bayar via QRIS, aktivasi manual. Tidak ada subscription trap.</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-[#080C10] hover:bg-cyan-400 transition-colors"
          >
            Buat akun sekarang
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-6 py-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.2em] text-white/20 uppercase">xfarming</span>
          <span className="text-[11px] text-white/20">© 2026</span>
        </div>
      </footer>
    </div>
  );
}

type Accent = 'cyan' | 'violet' | 'emerald';

const accentMap: Record<Accent, { border: string; tag: string; icon: string }> = {
  cyan:    { border: 'border-cyan-500/20',    tag: 'text-cyan-400',    icon: 'text-cyan-400' },
  violet:  { border: 'border-violet-500/20',  tag: 'text-violet-400',  icon: 'text-violet-400' },
  emerald: { border: 'border-emerald-500/20', tag: 'text-emerald-400', icon: 'text-emerald-400' },
};

function FeatureCard({
  tag, title, desc, accent, icon,
}: {
  tag: string; title: string; desc: string; accent: Accent; icon: React.ReactNode;
}) {
  const a = accentMap[accent];
  return (
    <div className={`rounded-xl border ${a.border} bg-white/[0.02] p-6 flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold tracking-[0.15em] uppercase ${a.tag}`}>{tag}</span>
        <span className={a.icon}>{icon}</span>
      </div>
      <div>
        <div className="text-sm font-semibold mb-2">{title}</div>
        <div className="text-xs text-white/40 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
