import { useEffect, useState } from 'react';
import { createJob, getJob, startJob, uploadToPresignedPut } from '../lib/jobs';
import { downloadJob } from '../lib/api';

type Period = 'monthly' | 'yearly';
const PERIOD_LABEL: Record<Period, string> = { monthly: 'Bulan', yearly: 'Tahun' };
const PERIOD_MONTHS: Record<Period, number[]> = {
  monthly: [1, 3, 6, 12, 24, 36],
  yearly:  [1, 2, 3, 5, 10, 20],
};

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n/1_000_000_000).toFixed(2)}M`;
  if (n >= 1_000_000) return `Rp ${(n/1_000_000).toFixed(2)}jt`;
  if (n >= 1_000) return `Rp ${(n/1_000).toFixed(0)}rb`;
  return `Rp ${Math.round(n)}`;
}

/** Compound growth: invest `monthly` per month for `months` at `annualRate` */
function compoundFV(monthlyInvest: number, months: number, annualRate: number): number {
  const r = annualRate / 100 / 12; // monthly rate
  if (r === 0) return monthlyInvest * months;
  return monthlyInvest * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/** Generate CSV for trendline engine */
function generateCSV(
  labelX: string, labelY: string,
  nominalX: number, nominalY1: number, nominalY2: number,
  period: Period, duration: number, yieldPct: number,
): string {
  const unit = period === 'monthly' ? 'Bulan' : 'Tahun';
  let csv = `${unit},${labelX},${labelY}\n`;

  for (let i = 1; i <= duration; i++) {
    const m = period === 'monthly' ? i : i * 12;
    const xTotal = nominalX * m;
    // Y = warteg cost (linear) + investasi compounding
    const wartegTotal = nominalY1 * m;
    const investFV = compoundFV(nominalY2, m, yieldPct);
    const yTotal = wartegTotal + investFV;
    csv += `${i},${Math.round(xTotal)},${Math.round(yTotal)}\n`;
  }
  return csv;
}

export function TrendlinePage() {
  const [labelX, setLabelX] = useState('Gofood');
  const [nominalX, setNominalX] = useState(50000);
  const [emojiX, setEmojiX] = useState('🍔');

  const [labelY, setLabelY] = useState('Warteg + Investasi');
  const [emojiY, setEmojiY] = useState('📈');
  const [labelY1, setLabelY1] = useState('Warteg');
  const [nominalY1, setNominalY1] = useState(15000);
  const [labelY2, setLabelY2] = useState('Investasi');
  const [nominalY2, setNominalY2] = useState(35000);

  const [period, setPeriod] = useState<Period>('monthly');
  const [duration, setDuration] = useState(12);
  const [yieldPct, setYieldPct] = useState(15);
  const [theme, setTheme] = useState<'black'|'white'>('black');
  const [aspectRatio, setAspectRatio] = useState('9:16');

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Derived
  const nominalY = nominalY1 + nominalY2;
  const title = `${labelX.toUpperCase()} VS ${labelY.toUpperCase()}`;
  const totalMonths = period === 'monthly' ? duration : duration * 12;
  const xFinal = nominalX * totalMonths;
  const wartegFinal = nominalY1 * totalMonths;
  const investFV = compoundFV(nominalY2, totalMonths, yieldPct);
  const yFinal = wartegFinal + investFV;
  const selisih = yFinal - xFinal;

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

  async function handleSubmit() {
    setBusy(true); setError(null); setStatus(null); setJobId(null);
    try {
      const csv = generateCSV(labelX, labelY, nominalX, nominalY1, nominalY2, period, duration, yieldPct);
      const csvFile = new File([csv], 'trendline.csv', { type: 'text/csv' });
      const subtitle = `Yield ${yieldPct}%/tahun · ${duration} ${PERIOD_LABEL[period]}`;
      const res = await createJob({
        type: 'trendline',
        payload: { title, subtitle, theme, aspect_ratio: aspectRatio, colA: labelX, colB: labelY, emojiA: emojiX, emojiB: emojiY },
        inputFile: csvFile,
      });
      setJobId(res.jobId); setStatus('queued');
      if (!res.input) throw new Error('No uploadUrl');
      await uploadToPresignedPut(res.input.uploadUrl, csvFile);
      await startJob(res.jobId);
      setStatus('running');
    } catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  }

  const durations = PERIOD_MONTHS[period];

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>📈</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#c084fc', padding: '3px 10px', borderRadius: 20, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>TRENDLINE · 12rb token</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>Simulasi Finansial</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Bandingkan kebiasaan boros vs hemat+investasi dengan compounding otomatis.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Periode & Durasi */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>PERIODE & DURASI</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['monthly','yearly'] as Period[]).map(p => (
                <button key={p} onClick={() => { setPeriod(p); setDuration(PERIOD_MONTHS[p][2]); }} style={{ flex: 1, padding: '9px', borderRadius: 10, border: `1px solid ${period===p?'rgba(168,85,247,0.5)':'rgba(255,255,255,0.08)'}`, background: period===p?'rgba(168,85,247,0.12)':'transparent', color: period===p?'#c084fc':'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: period===p?700:400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  Per {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {durations.map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${duration===d?'rgba(168,85,247,0.5)':'rgba(255,255,255,0.06)'}`, background: duration===d?'rgba(168,85,247,0.12)':'transparent', color: duration===d?'#c084fc':'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: duration===d?700:400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {d} {PERIOD_LABEL[period]}
                </button>
              ))}
            </div>
          </div>

          {/* Yield */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>
              YIELD INVESTASI PER TAHUN — <span style={{ color: '#c084fc' }}>{yieldPct}%</span>
            </label>
            <input type="range" min={1} max={50} value={yieldPct} onChange={e => setYieldPct(Number(e.target.value))} style={{ width: '100%', accentColor: '#a855f7', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {[5,10,15,20,30].map(y => (
                <button key={y} onClick={() => setYieldPct(y)} style={{ flex: 1, padding: '6px', borderRadius: 8, border: `1px solid ${yieldPct===y?'rgba(168,85,247,0.5)':'rgba(255,255,255,0.06)'}`, background: yieldPct===y?'rgba(168,85,247,0.12)':'transparent', color: yieldPct===y?'#c084fc':'rgba(255,255,255,0.35)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {y}%
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Contoh: Reksa Dana ~15%/tahun, Saham ~20%/tahun, Deposito ~5%/tahun</p>
          </div>

          {/* Variabel X */}
          <div className="glass" style={{ borderRadius: 16, padding: 20, borderColor: 'rgba(34,197,94,0.2)' }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#4ade80', display: 'block', marginBottom: 12 }}>VARIABEL X — Pengeluaran Boros</label>
            <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 130px', gap: 8 }}>
              <input className="input-glass" style={{ textAlign: 'center', fontSize: 18, padding: '8px 4px' }} value={emojiX} onChange={e => setEmojiX(e.target.value)} maxLength={2} />
              <input className="input-glass" placeholder="Nama (misal: Gofood)" value={labelX} onChange={e => setLabelX(e.target.value)} />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Rp</span>
                <input className="input-glass" style={{ paddingLeft: 28 }} type="number" min={0} value={nominalX} onChange={e => setNominalX(Number(e.target.value))} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Per hari · Total {duration} {PERIOD_LABEL[period]}: <span style={{ color: '#4ade80', fontWeight: 700 }}>{formatRp(xFinal)}</span></p>
          </div>

          {/* Variabel Y */}
          <div className="glass" style={{ borderRadius: 16, padding: 20, borderColor: 'rgba(168,85,247,0.2)' }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#c084fc', display: 'block', marginBottom: 12 }}>VARIABEL Y — Alternatif Hemat + Investasi</label>
            <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 8, marginBottom: 12 }}>
              <input className="input-glass" style={{ textAlign: 'center', fontSize: 18, padding: '8px 4px' }} value={emojiY} onChange={e => setEmojiY(e.target.value)} maxLength={2} />
              <input className="input-glass" placeholder="Nama Y (misal: Warteg + Investasi)" value={labelY} onChange={e => setLabelY(e.target.value)} />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Breakdown per hari:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8, marginBottom: 8 }}>
                <input className="input-glass" placeholder="Komponen hemat (misal: Warteg)" value={labelY1} onChange={e => setLabelY1(e.target.value)} />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Rp</span>
                  <input className="input-glass" style={{ paddingLeft: 26 }} type="number" min={0} value={nominalY1} onChange={e => setNominalY1(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
                <input className="input-glass" placeholder="Komponen investasi (misal: Reksa Dana)" value={labelY2} onChange={e => setLabelY2(e.target.value)} />
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Rp</span>
                  <input className="input-glass" style={{ paddingLeft: 26 }} type="number" min={0} value={nominalY2} onChange={e => setNominalY2(Number(e.target.value))} />
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
              Total Y/hari: <span style={{ color: '#c084fc', fontWeight: 700 }}>{formatRp(nominalY)}</span>
              {' '}· Investasi kena compounding {yieldPct}%/tahun
            </p>
          </div>

          {/* Output settings */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>OUTPUT</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Tema</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['black','white'] as const).map(t => (
                    <button key={t} onClick={() => setTheme(t)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${theme===t?'rgba(168,85,247,0.4)':'rgba(255,255,255,0.08)'}`, background: theme===t?'rgba(168,85,247,0.1)':'transparent', color: theme===t?'#c084fc':'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {t==='black'?'🌑 Dark':'☀️ Light'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Rasio</p>
                <select className="input-glass" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} style={{ padding: '7px 12px' }}>
                  <option value="9:16">9:16 TikTok/Reels</option>
                  <option value="16:9">16:9 YouTube</option>
                  <option value="1:1">1:1 Feed</option>
                </select>
              </div>
            </div>
          </div>

          {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171' }}>⚠️ {error}</div>}

          <button className="btn-primary" disabled={busy || nominalX <= 0} onClick={handleSubmit} style={{ width: '100%', padding: 13, fontSize: 14 }}>
            {busy ? 'Memproses...' : '🚀 Generate Chart Video'}
          </button>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Simulasi preview */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>SIMULASI {duration} {PERIOD_LABEL[period].toUpperCase()}</p>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, color: 'rgba(255,255,255,0.7)' }}>{title}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#4ade80' }}>{emojiX} {labelX}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>{formatRp(xFinal)}</span>
                </div>
                <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius: 4, width: `${Math.min(100, (xFinal/Math.max(xFinal,yFinal))*100)}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#c084fc' }}>{emojiY} {labelY}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#c084fc' }}>{formatRp(yFinal)}</span>
                </div>
                <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#a855f7,#7c3aed)', borderRadius: 4, width: `${Math.min(100, (yFinal/Math.max(xFinal,yFinal))*100)}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            </div>

            {/* Breakdown Y */}
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{labelY1} (linear)</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{formatRp(wartegFinal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{labelY2} ({yieldPct}%/thn compound)</span>
                <span style={{ color: '#c084fc', fontWeight: 700 }}>{formatRp(investFV)}</span>
              </div>
            </div>

            {/* Selisih */}
            <div style={{ marginTop: 12, padding: '12px', borderRadius: 10, background: selisih > 0 ? 'rgba(168,85,247,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${selisih > 0 ? 'rgba(168,85,247,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Keuntungan Y vs X</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: selisih > 0 ? '#c084fc' : '#f87171' }}>
                {selisih > 0 ? '+' : ''}{formatRp(Math.abs(selisih))}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {selisih > 0 ? `${labelY} lebih menguntungkan` : `${labelX} lebih hemat`}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>STATUS</p>
            {!status ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Belum ada job</div>
            ) : (
              <div>
                <span className={`badge-${status}`} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: 10 }}>{status.toUpperCase()}</span>
                {jobId && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{jobId}</div>}
              </div>
            )}
            {status === 'done' && jobId && (
              <button className="btn-primary" style={{ display: 'flex', width: '100%', marginTop: 12, justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)' }} disabled={downloading}
                onClick={async () => { setDownloading(true); try { await downloadJob(jobId); } catch(e) { setError(String(e)); } finally { setDownloading(false); } }}>
                {downloading ? '⏳ Mengunduh...' : '⬇️ Download MP4'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
