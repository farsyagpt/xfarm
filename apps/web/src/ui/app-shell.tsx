import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMe, useLogout } from '../ui/hooks';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function AppShell() {
  const { data: me } = useMe();
  const logout = useLogout();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/app" className="text-sm font-semibold tracking-wide">
            XFARMING
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-400 md:block">{me?.email}</span>
            <button
              className="rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-900"
              onClick={async () => {
                await logout.mutateAsync();
                nav('/');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900/30 p-3">
          <nav className="flex flex-col gap-1 text-sm">
            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900 hover:text-slate-100',
                  isActive && 'bg-slate-900 text-white',
                )
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/app/hero-video"
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900 hover:text-slate-100',
                  isActive && 'bg-slate-900 text-white',
                )
              }
            >
              Hero Video (INFINITY)
            </NavLink>
            <NavLink
              to="/app/trendline"
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900 hover:text-slate-100',
                  isActive && 'bg-slate-900 text-white',
                )
              }
            >
              Trendline
            </NavLink>
            <NavLink
              to="/app/xfarm"
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900 hover:text-slate-100',
                  isActive && 'bg-slate-900 text-white',
                )
              }
            >
              XFarm
            </NavLink>
            <NavLink
              to="/app/pay"
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900 hover:text-slate-100',
                  isActive && 'bg-slate-900 text-white',
                )
              }
            >
              Pembayaran
            </NavLink>
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

