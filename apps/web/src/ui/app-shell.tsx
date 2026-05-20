import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMe, useLogout } from '../ui/hooks';

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}rb`;
  return String(n);
}

export function AppShell() {
  const { data: me } = useMe();
  const logout = useLogout();
  const nav = useNavigate();
  const isAdmin = me?.role === 'admin';
  const tokens = me?.tokens ?? 0;

  const navItems = [
    { to: '/app', label: 'Dashboard', icon: '⊞', end: true },
    { to: '/app/hero-video', label: 'Hero Video', icon: '🎬', end: false },
    { to: '/app/trendline', label: 'Trendline', icon: '📈', end: false },
    { to: '/app/xfarm', label: 'XFarm', icon: '🌾', end: false },
    { to: '/app/pay', label: 'Topup Token', icon: '💳', end: false },
    ...(isAdmin ? [{ to: '/app/admin', label: 'Admin Panel', icon: '⚙️', end: false }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#05070f', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,7,15,0.9)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/app" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.12em', background: 'linear-gradient(135deg,#60a5fa,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>XFARMING</span>
            {isAdmin && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>ADMIN</span>}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Token badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 12 }}>⚡</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: tokens > 50_000 ? '#4ade80' : tokens > 10_000 ? '#fbbf24' : '#f87171' }}>
                {fmt(tokens)}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>token</span>
            </div>

            {/* User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me?.email}</span>
            </div>

            <button
              onClick={async () => { await logout.mutateAsync(); nav('/'); }}
              style={{ padding: '6px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(239,68,68,0.1)'; el.style.borderColor = 'rgba(239,68,68,0.3)'; el.style.color = '#f87171'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '20px', display: 'grid', gridTemplateColumns: '188px 1fr', gap: 18 }}>

        {/* SIDEBAR */}
        <aside style={{ height: 'fit-content', position: 'sticky', top: 74 }}>
          <div className="glass" style={{ borderRadius: 16, padding: 8 }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 11px', borderRadius: 10,
                    fontSize: 13, fontWeight: isActive ? 700 : 400,
                    textDecoration: 'none',
                    color: isActive ? '#f8fafc' : 'rgba(255,255,255,0.45)',
                    background: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
                    border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                    transition: 'all 0.15s',
                  })}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Token mini bar */}
            <div style={{ margin: '10px 4px 4px', padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Token</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: tokens > 50_000 ? '#4ade80' : '#fbbf24' }}>{fmt(tokens)}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(100, (tokens/400_000)*100)}%`, background: tokens > 100_000 ? 'linear-gradient(90deg,#22c55e,#06b6d4)' : tokens > 20_000 ? 'linear-gradient(90deg,#f59e0b,#f97316)' : 'linear-gradient(90deg,#ef4444,#f87171)', transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
