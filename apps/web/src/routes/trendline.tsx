import { useEffect, useState } from 'react';
import { createJob, getJob, startJob, uploadToPresignedPut } from '../lib/jobs';

type Period = 'daily' | 'monthly' | 'yearly';

const PERIOD_LABEL: Record<Period, string> = { daily: 'Harian', monthly: 'Bulanan', yearly: 'Tahunan' };
const PERIOD_DAYS: Record<Period, number> = { daily: 30, monthly: 12, yearly: 5 };
const PERIOD_UNIT: Record<Period, string> = { daily: 'hari', monthly: 'bulan', yearly: 'tahun' };

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n}`;
}

export function TrendlinePage() {
  // Variabel X
  const [labelX, setLabelX] = useState('Gofood');
  const [nominalX, setNominalX] = useState(50000);
  const [emojiX, setEmojiX] = useState('🍔');

  // Variabel Y
  const [labelY, setLabelY] = useState('Warteg + Investasi');
  const [nominalY, setNominalY] = useState(50000);
  const [emojiY, setEmojiY] = useState('📈');

  // Breakdown Y
  const [labelY1, setLabelY1] = useState('Warteg');
  const [nominalY1, setNominalY1] = useState(15000);
  const [labelY2, setLabelY2] = useState('Investasi');
  const [nominalY2, setNominalY2] = useState(35000);

  // Settings
  const [period, setPeriod] = useState<Period>('daily');
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<'black' | 'white'>('black');
  const [aspectRatio, setAspectRatio] = useState('9:16');

  // Job
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const downloadUrl = jobId ? `/api/jobs/${jobId}/download` : null;

  // Auto-sync Y nominal
  useEffect(() => { setNominalY(nominalY1 + nominalY2); }, [nominalY1, nominalY2]);

  // Auto-generate title
  useEffect(() => {
    setTitle(`${labelX.toUpperCase()} VS ${labelY.toUpperCase()}`);
  }, [labelX, labelY]);

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
    }, 2000);
    return () => { alive = false; clearInterval(t); };
  }, [jobId]);

  // Generate CSV dari input
  function generateCSV(): string {
    const days = PERIOD_DAYS[period];
    const unit = PERIOD_UNIT[period];
    let csv = `${unit},${labelX},${labelY}\n`;
    for (let i = 1; i <= days; i++) {
      csv += `${i},${nominalX * i},${nominalY * i}\n`;
    }
    return csv;
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    setStatus(null);
    setJobId(null);
    try {
      const csvContent = generateCSV();
      const csvFile = new File([csvContent], 'trendline.csv', { type: 'text/csv' });

      const res = await createJob({
        type: 'trendline',
        payload: {
          title,
          subtitle: `Simulasi ${PERIOD_LABEL[period]} · ${formatRp(nominalX)} vs ${formatRp(nominalY)}`,
          theme,
          aspect_ratio: aspectRatio,
          colA: labelX,
          colB: labelY,
          emojiA: emojiX,
          emojiB: emojiY,
        },
        inputFile: csvFile,
      });
      setJobId(res.jobId);
      setStatus('queued');
      if (!res.input) throw new Error('Server tidak mengembalikan uploadUrl.');
      await uploadToPresignedPut(res.input.uploadUrl, csvFile);
      await startJob(res.jobId);
      setStatus('running');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const days = PERIOD_DAYS[period];
  const totalX = nominalX * days;
  const totalY = nominalY * days;
  const selisih = totalX - totalY;

  return (
    <div className="anim-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>📈</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#c084fc', padding: '3px 10px', borderRadius: 20, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>TRENDLINE</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Simulasi Finansial</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Bandingkan dua kebiasaan finansial → render animasi chart viral untuk konten edukasi.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* ── LEFT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Periode */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 12 }}>PERIODE SIMULASI</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['daily', 'monthly', 'yearly'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '10px', borderRadius: 10,
                    border: `1px solid ${period === p ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: period === p ? 'rgba(168,85,247,0.12)' : 'transparent',
                    color: period === p ? '#c084fc' : 'rgba(255,255,255,0.4)',
                    fontSize: 13, fontWeight: period === p ? 600 : 400,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {PERIOD_LABEL[p]}
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{PERIOD_DAYS[p]} {PERIOD_UNIT[p]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Variabel X */}
          <div className="glass" style={{ borderRadius: 16, padding: 20, borderColor: 'rgba(34,197,94,0.2)' }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#4ade80', display: 'block', marginBottom: 14 }}>VARIABEL X — Kebiasaan Boros</label>
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 140px', gap: 10 }}>
              <input className="input-glass" style={{ textAlign: 'center', fontSize: 20 }} value={emojiX} onChange={e => setEmojiX(e.target.value)} maxLength={2} />
              <input className="input-glass" placeholder="Nama kebiasaan (misal: Gofood)" value={labelX} onChange={e => setLabelX(e.target.value)} />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Rp</span>
                <input className="input-glass" style={{ paddingLeft: 32 }} type="number" min={0} placeholder="50000" value={nominalX} onChange={e => setNominalX(Number(e.target.value))} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
              Per {PERIOD_UNIT[period] === 'hari' ? 'hari' : PERIOD_UNIT[period] === 'bulan' ? 'bulan' : 'tahun'} · Total {days} {PERIOD_UNIT[period]}: <span style={{ color: '#4ade80', fontWeight: 600 }}>{formatRp(totalX)}</span>
            </p>
          </div>

          {/* Variabel Y */}
          <div className="glass" style={{ borderRadius: 16, padding: 20, borderColor: 'rgba(239,68,68,0.2)' }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#f87171', display: 'block', marginBottom: 14 }}>VARIABEL Y — Alternatif Hemat</label>
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 10, marginBottom: 12 }}>
              <input className="input-glass" style={{ textAlign: 'center', fontSize: 20 }} value={emojiY} onChange={e => setEmojiY(e.target.value)} maxLength={2} />
              <input className="input-glass" placeholder="Nama alternatif (misal: Warteg + Investasi)" value={labelY} onChange={e => setLabelY(e.target.value)} />
            </div>
            {/* Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Breakdown komponen Y:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8, marginBottom: 8 }}>
                <input className="input-glass" placeholder="Komponen 1 (misal: Warteg)" value={labelY1} onChange={e => setLabelY1(e.target.value)} />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Rp</span>
                  <input className="input-glass" style={{ paddingLeft: 28 }} type="number" min={0} value={nominalY1} onChange={e => setNominalY1(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
                <input className="input-glass" placeholder="Komponen 2 (misal: Investasi)" value={labelY2} onChange={e => setLabelY2(e.target.value)} />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Rp</span>
                  <input className="input-glass" style={{ paddingLeft: 28 }} type="number" min={0} value={nominalY2} onChange={e => setNominalY2(Number(e.target.value))} />
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              Total Y: <span style={{ color: '#f87171', fontWeight: 600 }}>{formatRp(nominalY)}/hari</span> · {days} {PERIOD_UNIT[period]}: <span style={{ color: '#f87171', fontWeight: 600 }}>{formatRp(totalY)}</span>
            </p>
          </div>

          {/* Output settings */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 14 }}>PENGATURAN OUTPUT</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Tema</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['black', 'white'] as const).map(t => (
                    <button key={t} onClick={() => setTheme(t)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${theme === t ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)'}`, background: theme === t ? 'rgba(168,85,247,0.1)' : 'transparent', color: theme === t ? '#c084fc' : 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {t === 'black' ? '🌑 Dark' : '☀️ Light'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Rasio</p>
                <select className="input-glass" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} style={{ padding: '8px 12px' }}>
                  <option value="9:16">9:16 (TikTok/Reels)</option>
                  <option value="16:9">16:9 (YouTube)</option>
                  <option value="1:1">1:1 (Feed)</option>
                  <option value="4:3">4:3 (Klasik)</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171' }}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn-primary" disabled={busy || nominalX <= 0} onClick={handleSubmit} style={{ width: '100%', padding: '13px', fontSize: 14 }}>
            {busy ? 'Memproses...' : '🚀 Generate Chart Video'}
          </button>
        </div>

        {/* ── RIGHT: Preview & Status ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Simulasi preview */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>PREVIEW SIMULASI</p>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, lineHeight: 1.4 }}>{title || 'X VS Y'}</div>

            {/* Comparison bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#4ade80' }}>{emojiX} {labelX}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>{formatRp(totalX)}</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius: 4, width: '100%' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#f87171' }}>{emojiY} {labelY}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>{formatRp(totalY)}</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#ef4444,#dc2626)', borderRadius: 4, width: `${Math.min(100, (totalY / totalX) * 100)}%`, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>

            {/* Selisih */}
            <div style={{ marginTop: 16, padding: '12px', borderRadius: 10, background: selisih > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${selisih > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Selisih dalam {days} {PERIOD_UNIT[period]}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: selisih > 0 ? '#4ade80' : '#f87171' }}>
                {selisih > 0 ? '+' : ''}{formatRp(Math.abs(selisih))}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {selisih > 0 ? `${labelX} lebih mahal` : `${labelY} lebih mahal`}
              </p>
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
                {jobId && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{jobId}</div>}
              </div>
            )}
            {status === 'done' && downloadUrl && (
              <a href={downloadUrl} className="btn-primary" style={{ display: 'flex', width: '100%', marginTop: 12, textDecoration: 'none', justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                ⬇️ Download MP4
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
