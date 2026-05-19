import { useEffect, useMemo, useState } from 'react';
import { createJob, getJob, startJob, uploadToPresignedPut } from '../lib/jobs';

export function TrendlinePage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('TABUNGAN VS INVESTASI');
  const [subtitle, setSubtitle] = useState('Simulasi');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const downloadUrl = useMemo(() => (jobId ? `/api/jobs/${jobId}/download` : null), [jobId]);

  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    const t = setInterval(async () => {
      try {
        const j = await getJob(jobId);
        if (!alive) return;
        setStatus(j.status);
        if (j.status === 'failed' && j.error) setError(j.error);
      } catch {
        // ignore
      }
    }, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [jobId]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
      <div className="text-sm font-semibold">Trendline</div>
      <p className="mt-2 text-sm text-slate-300">Upload CSV (kolom A vs B) → render animasi trendline mp4.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <label className="grid gap-1 text-xs text-slate-300">
            CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-300"
            />
          </label>

          <div className="mt-3 grid gap-3">
            <label className="grid gap-1 text-xs text-slate-300">
              Title
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-300">
              Subtitle
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </label>
          </div>

          {error ? <div className="mt-2 text-xs text-red-400">{error}</div> : null}

          <button
            className="mt-4 w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            disabled={busy || !file}
            onClick={async () => {
              if (!file) return;
              setBusy(true);
              setError(null);
              setStatus(null);
              try {
                const res = await createJob({
                  type: 'trendline',
                  payload: { title, subtitle },
                  inputFile: file,
                });
                setJobId(res.jobId);
                setStatus('queued');
                if (!res.input) throw new Error('Server tidak mengembalikan uploadUrl.');
                await uploadToPresignedPut(res.input.uploadUrl, file);
                await startJob(res.jobId);
                setStatus('running');
              } catch (e) {
                setError(String(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Memproses…' : 'Start Job'}
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="text-xs text-slate-400">Status</div>
          <div className="mt-2 text-sm">{status ?? '-'}</div>

          {jobId ? (
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-300">
              Job ID: <span className="font-mono">{jobId}</span>
            </div>
          ) : null}

          {status === 'done' && downloadUrl ? (
            <a
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
              href={downloadUrl}
            >
              Download MP4
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

