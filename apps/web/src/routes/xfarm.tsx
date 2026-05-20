import { useEffect, useState } from 'react';
import { createJob, getJob } from '../lib/jobs';

const FEEDS = [
  { value: '🔥 Aggregated (60+ Feeds)', label: '🔥 Semua Sumber (60+ Feed)', desc: 'Agregasi dari semua sumber aktif' },
  { value: 'TechCrunch', label: '💻 TechCrunch', desc: 'Berita teknologi global' },
  { value: 'BBC News', label: '📰 BBC News', desc: 'Berita internasional' },
  { value: 'Google News (Tech)', label: '🔍 Google News Tech', desc: 'Trending teknologi' },
  { value: 'Wired', label: '⚡ Wired', desc: 'Inovasi & budaya digital' },
];

const PROVIDERS = [
  { value: 'pollinations', label: '🎨 Pollinations', desc: 'Gratis, tanpa token' },
  { value: 'hf-space', label: '🤗 HF Space', desc: 'Gratis via Gradio' },
  { value: 'hf-inference', label: '🔑 HF Inference', desc: 'Butuh HF token' },
];

export function XFarmPage() {
  const [feed, setFeed] = useState('🔥 Aggregated (60+ Feeds)');
  const [maxItems, setMaxItems] = useState(10);
  const [provider, setProvider] = useState('pollinations');
  const [hfToken, setHfToken] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const downloadUrl = jobId ? `/api/jobs/${jobId}/download` : null;

  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    const t = setInterval(async () => {
      try {
        const j = await getJob(jobId);
        if (!alive) return;
        setStatus(j.status);
        if (j.status === 'failed' && j.error) setError(j.error);
        if (j.status === 'done' || j.status === 'failed') clearInterval(t);
      } catch { /* ignore */ }
    }, 2500);
    return () => { alive = false; clearInterval(t); };
  }, [jobId]);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    setStatus(null);
    setJobId(null);
    try {
      const res = await createJob({
        type: 'xfarm',
        payload: { feed, maxItems, provider, hf_token: hfToken || undefined },
      });
      setJobId(res.jobId);
      setStatus('running');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const estimatedSlides = maxItems * 5;
  const estimatedMinutes = Math.ceil(maxItems * 0.5);

  return (
    <div className="anim-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>🌾</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#4ade80', padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>XFARM</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Bulk Carousel Generator</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Pilih sumber berita → generate carousel 5-slide per berita dengan AI image + overlay teks otomatis.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

        {/* ── LEFT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Feed selector */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 14 }}>SUMBER BERITA</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEEDS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFeed(f.value)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 10, textAlign: 'left',
                    border: `1px solid ${feed === f.value ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    background: feed === f.value ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: feed === f.value ? 600 : 400, color: feed === f.value ? '#4ade80' : 'rgba(255,255,255,0.7)' }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{f.desc}</div>
                  </div>
                  {feed === f.value && <span style={{ color: '#4ade80', fontSize: 16 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Max items */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 14 }}>
              JUMLAH BERITA
              <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>({maxItems} berita = {estimatedSlides} slide)</span>
            </label>
            <input
              type="range" min={1} max={50} value={maxItems}
              onChange={e => setMaxItems(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#22c55e', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              <span>1 berita</span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>{maxItems} berita dipilih</span>
              <span>50 berita</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 12 }}>
              {[5, 10, 20, 50].map(n => (
                <button key={n} onClick={() => setMaxItems(n)} style={{ padding: '6px', borderRadius: 8, border: `1px solid ${maxItems === n ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)'}`, background: maxItems === n ? 'rgba(34,197,94,0.1)' : 'transparent', color: maxItems === n ? '#4ade80' : 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 14 }}>IMAGE PROVIDER</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PROVIDERS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setProvider(p.value)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                    border: `1px solid ${provider === p.value ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    background: provider === p.value ? 'rgba(34,197,94,0.08)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: provider === p.value ? 600 : 400, color: provider === p.value ? '#4ade80' : 'rgba(255,255,255,0.6)' }}>{p.label}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{p.desc}</span>
                  </div>
                  {provider === p.value && <span style={{ color: '#4ade80' }}>✓</span>}
                </button>
              ))}
            </div>

            {provider === 'hf-inference' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>HF TOKEN</label>
                <input className="input-glass" type="password" placeholder="hf_..." value={hfToken} onChange={e => setHfToken(e.target.value)} />
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171' }}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn-primary" disabled={busy} onClick={handleSubmit} style={{ width: '100%', padding: '13px', fontSize: 14, background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
            {busy ? 'Memproses...' : `🌾 Generate ${maxItems} Carousel`}
          </button>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Estimasi */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>ESTIMASI OUTPUT</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Berita diproses', value: `${maxItems}`, color: '#4ade80' },
                { label: 'Total slide', value: `${estimatedSlides}`, color: '#60a5fa' },
                { label: 'Estimasi waktu', value: `~${estimatedMinutes} menit`, color: '#c084fc' },
                { label: 'Format output', value: 'ZIP bundle', color: '#fbbf24' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>STATUS JOB</p>
            {!status ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Belum ada job aktif</div>
            ) : (
              <div>
                <span className={`badge-${status}`} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: 12 }}>
                  {status.toUpperCase()}
                </span>
                {(status === 'running' || status === 'queued') && (
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius: 2, width: '50%', animation: 'shimmer 2s linear infinite', backgroundSize: '200% auto' }} />
                  </div>
                )}
                {jobId && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{jobId}</div>}
              </div>
            )}
            {status === 'done' && downloadUrl && (
              <a href={downloadUrl} className="btn-primary" style={{ display: 'flex', width: '100%', marginTop: 12, textDecoration: 'none', justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                ⬇️ Download ZIP
              </a>
            )}
          </div>

          {/* Cara pakai */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>CARA PAKAI</p>
            {[
              '1. Pilih sumber berita',
              '2. Set jumlah berita (1-50)',
              '3. Pilih image provider',
              '4. Klik Generate',
              '5. Tunggu proses selesai',
              '6. Download ZIP → upload ke IG/LinkedIn',
            ].map(t => (
              <div key={t} style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
