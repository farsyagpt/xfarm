import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMe } from './hooks';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (me.isLoading) return;
    if (me.isError) nav('/login', { replace: true });
  }, [me.isLoading, me.isError, nav]);

  useEffect(() => {
    if (!me.data) return;
    // Paywall gating: selain halaman /app/pay, lempar ke /app/pay
    if (me.data.status !== 'active' && !loc.pathname.startsWith('/app/pay')) {
      nav('/app/pay', { replace: true });
    }
  }, [me.data, loc.pathname, nav]);

  if (me.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (!me.data) return null;
  return <>{children}</>;
}

