import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-sm font-semibold tracking-wide">XFARMING</div>
        <div className="flex items-center gap-3 text-sm">
          <Link className="text-slate-300 hover:text-white" to="/login">
            Login
          </Link>
          <Link
            className="rounded-md bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
            to="/signup"
          >
            Mulai
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-xs text-slate-300">
              Cloudflare Pages • Workers • D1 • R2 • HuggingFace
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Content factory yang cepat, rapi, dan siap scale.
            </h1>
            <p className="mt-4 max-w-xl text-slate-300">
              Satu dashboard untuk generate Hero Video (INFINITY), Trendline video, dan XFarm bulk news
              assets. Fokus di output, bukan setup.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Mulai sekarang
              </Link>
              <a
                href="#features"
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-200 hover:bg-slate-900"
              >
                Lihat fitur
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-950 p-6">
            <div className="text-xs text-slate-400">Preview</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="text-sm font-semibold">Hero Video</div>
                <div className="mt-1 text-xs text-slate-400">Upload video + cerita → mp4 jadi</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="text-sm font-semibold">Trendline</div>
                <div className="mt-1 text-xs text-slate-400">CSV → animasi trendline mp4</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="text-sm font-semibold">XFarm</div>
                <div className="mt-1 text-xs text-slate-400">Bulk RSS → carousel assets</div>
              </div>
            </div>
          </div>
        </div>

        <section id="features" className="mt-16 grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Non-generic startup UI"
            desc="Landing + dashboard yang clean, bukan template slop."
          />
          <FeatureCard
            title="Asynchronous jobs"
            desc="Job panjang jalan di background, hasil aman di R2."
          />
          <FeatureCard title="Sanitasi & efisiensi" desc="No artifacts, no node_modules, no outputs di repo." />
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-slate-300">{desc}</div>
    </div>
  );
}

