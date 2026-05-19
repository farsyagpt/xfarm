import { useEffect, useMemo, useState } from 'react';
import { getJob, startJob, uploadToPresignedPut } from '../lib/jobs';
import { createJob } from '../lib/jobs';

export function HeroVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [story, setStory] = useState('');
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
      <div className="text-sm font-semibold">Hero Video (INFINITY)</div>
      <p className="mt-2 text-sm text-slate-300">
        Upload video 16:9 + teks cerita. Sistem akan jalanin job async dan hasilnya disimpan di R2.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <label className="grid gap-1 text-xs text-slate-300">
            Video (MP4)
            <input
              type="file"
              accept="video/mp4,video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-300"
            />
          </label>

          <label className="mt-3 grid gap-1 text-xs text-slate-300">
            Cerita (untuk voice + subtitle)
            <textarea
              className="h-40 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Tulis cerita singkat, per kalimat dipisah baris baru."
            />
          </label>

          {error ? <div className="mt-2 text-xs text-red-400">{error}</div> : null}

          <button
            className="mt-4 w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            disabled={busy || !file || story.trim().length < 10}
            onClick={async () => {
              if (!file) return;
              setBusy(true);
              setError(null);
              setStatus(null);
              try {
                // 1) create job + get presigned PUT for input
                const res = await createJob({ type: 'infinity', payload: { story }, inputFile: file });
                setJobId(res.jobId);
                setStatus('queued');
                if (!res.input) throw new Error('Server tidak mengembalikan uploadUrl.');

                // 2) upload input video to R2
                await uploadToPresignedPut(res.input.uploadUrl, file);

                // 3) start job (enqueue)
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

