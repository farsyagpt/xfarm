import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useMe } from '../ui/hooks';

const ADMIN_WA_DEFAULT = import.meta.env.VITE_ADMIN_WA as string | undefined;

export function PaywallPage() {
  const { data: me } = useMe();
  const [wa, setWa] = useState(ADMIN_WA_DEFAULT || '');
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
      <div className="text-sm font-semibold">Pembayaran (QRIS → WhatsApp)</div>
      <p className="mt-2 text-sm text-slate-300">
        Akun lu sekarang: <span className="font-semibold">{me?.status}</span>. Untuk akses fitur, bayar dulu via
        QRIS, lalu klik tombol WhatsApp untuk verifikasi. Kita tidak tampilkan harga di awal.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">QRIS statis</div>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
            <img src="/qris.png" alt="QRIS" className="h-auto w-full" />
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Setelah bayar, lanjut ke WhatsApp untuk verifikasi manual.
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">WhatsApp Admin</div>
          <label className="mt-3 grid gap-1 text-xs text-slate-300">
            Nomor WhatsApp (format internasional tanpa +)
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="62812xxxxxxx"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
            />
          </label>

          {err ? <div className="mt-2 text-xs text-red-400">{err}</div> : null}

          <button
            className="mt-4 w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setErr(null);
              setLink(null);
              try {
                const res = await apiFetch<{ url: string }>('/api/billing/whatsapp', {
                  method: 'POST',
                  body: JSON.stringify({ phone: wa || undefined }),
                });
                setLink(res.url);
                window.open(res.url, '_blank', 'noopener,noreferrer');
              } catch (e) {
                setErr(String(e));
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? 'Membuat link…' : 'Lanjut ke WhatsApp'}
          </button>

          {link ? (
            <div className="mt-3 break-all rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-300">
              {link}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

