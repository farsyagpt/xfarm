import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMe, useLogout } from '../ui/hooks';

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/app/hero-video', label: 'Hero Video', icon: '🎬', end: false },
  { to: '/app/trendline', label: 'Trendline', icon: '📈', end: false },
  { to: '/app/xfarm', label: 'XFarm', icon: '🌾', end: false },
  { to: '/app/pay', label: 'Pembayaran', icon: '💳', end: false },
];

export function AppShell() {
  const { data: me } = useMe();
  const logout = useLogout();
  const nav = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#05070f', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,7,15,0.85)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/app" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.12em', background: 'linear-gradient(135deg,#60a5fa,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>XFARMING</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{me?.email}</span>
            </div>
            <button
              onClick={async () => { await logout.mutateAsync(); nav('/'); }}
              style={{ padding: '6px 14px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '24px 20px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ height: 'fit-content', position: 'sticky', top: 80 }}>
          <div className="glass" style={{ borderRadius: 16, padding: 8 }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    textDecoration: 'none',
                    color: isActive ? '#f8fafc' : 'rgba(255,255,255,0.45)',
                    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                    transition: 'all 0.15s',
                  })}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
