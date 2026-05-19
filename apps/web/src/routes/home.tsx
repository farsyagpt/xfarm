import { Link } from 'react-router-dom';
import { useMe } from '../ui/hooks';

export function HomePage() {
  const { data: me } = useMe();

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">Dashboard</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Welcome.</h2>
          <p className="mt-2 text-sm text-slate-300">
            Status akun: <span className="font-semibold">{me?.status}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card
          title="Hero Video (INFINITY)"
          desc="Upload video + cerita → output mp4 naratif dengan subtitle & voice."
          to="/app/hero-video"
        />
        <Card title="Trendline" desc="CSV → animasi trendline mp4." to="/app/trendline" />
        <Card title="XFarm" desc="Bulk RSS → carousel assets/zip." to="/app/xfarm" />
      </div>
    </div>
  );
}

function Card({ title, desc, to }: { title: string; desc: string; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-800 bg-slate-900/30 p-5 hover:bg-slate-900/50"
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-slate-300">{desc}</div>
      <div className="mt-4 text-xs text-cyan-300 group-hover:text-cyan-200">Open →</div>
    </Link>
  );
}

