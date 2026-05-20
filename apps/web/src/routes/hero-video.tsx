import { useEffect, useState } from 'react';
import { createJob, getJob, startJob, uploadToPresignedPut } from '../lib/jobs';
import { downloadJob } from '../lib/api';

type PhotoPos = 'center' | 'right' | 'left';
type VideoFormat = '9:16' | '16:9';
type BgColor = 'black' | 'dark-blue' | 'dark-purple' | 'dark-red' | 'dark-green' | 'gray' | 'white';

const BG_OPTIONS: { value: BgColor; label: string; color: string }[] = [
  { value: 'black',       label: 'Hitam',      color: '#000000' },
  { value: 'dark-blue',   label: 'Biru Gelap', color: '#05070f' },
  { value: 'dark-purple', label: 'Ungu Gelap', color: '#0d0520' },
  { value: 'dark-red',    label: 'Merah Gelap',color: '#150505' },
  { value: 'dark-green',  label: 'Hijau Gelap',color: '#051505' },
  { value: 'gray',        label: 'Abu-abu',    color: '#1a1a1a' },
  { value: 'white',       label: 'Putih',      color: '#ffffff' },
];

const TEXT_POSITIONS = [
  { value: 'top',    label: 'Atas' },
  { value: 'middle', label: 'Tengah' },
  { value: 'bottom', label: 'Bawah' },
];

const STATUS_LABEL: Record<string, string> = {
  queued:  'Antri di queue...',
  running: 'AI sedang memproses...',
  done:    'Selesai! Siap download.',
  failed:  'Gagal. Coba lagi.',
};

export function HeroVideoPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPos, setPhotoPos] = useState<PhotoPos>('center');
  const [textPos, setTextPos] = useState('bottom');
  const [bgColor, setBgColor] = useState<BgColor>('dark-blue');
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('9:16');
  const [voiceGender, setVoiceGender] = useState<'male'|'female'>('male');
  const [narasi, setNarasi] = useState('');

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  function handlePhotoChange(f: File | null) {
    setPhoto(f);
    setPhotoPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit() {
    if (!photo || narasi.trim().length < 10) return;
    setBusy(true); setError(null); setStatus(null); setJobId(null);
    try {
      const res = await createJob({
        type: 'infinity',
        payload: { story: narasi, voice_gender: voiceGender, photo_position: photoPos, text_position: textPos, bg_color: bgColor, video_format: videoFormat },
        inputFile: photo,
      });
      setJobId(res.jobId); setStatus('queued');
      if (!res.input) throw new Error('No uploadUrl');
      await uploadToPresignedPut(res.input.uploadUrl, photo);
      await startJob(res.jobId);
      setStatus('running');
    } catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  }

  const selectedBg = BG_OPTIONS.find(b => b.value === bgColor)!;
  const isLight = bgColor === 'white';

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>🎬</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#60a5fa', padding: '3px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>HERO VIDEO · 20rb token</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>Buat Hero Video</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Foto PNG transparan + narasi → video animasi + TTS voice otomatis.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Upload foto */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>FOTO HERO (PNG transparan)</label>
            <div onClick={() => document.getElementById('photo-input')?.click()} style={{ border: `2px dashed ${photo?'rgba(59,130,246,0.4)':'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.5)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = photo?'rgba(59,130,246,0.4)':'rgba(255,255,255,0.1)'}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="preview" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
              ) : (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Klik untuk upload foto PNG</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>Background transparan untuk hasil terbaik</div>
                </div>
              )}
            </div>
            <input id="photo-input" type="file" accept="image/png,image/*" style={{ display: 'none' }} onChange={e => handlePhotoChange(e.target.files?.[0] ?? null)} />
            {photo && <p style={{ fontSize: 11, color: '#60a5fa', marginTop: 6 }}>✓ {photo.name}</p>}
          </div>

          {/* Format video */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>FORMAT VIDEO</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['9:16','16:9'] as VideoFormat[]).map(f => (
                <button key={f} onClick={() => setVideoFormat(f)} style={{ padding: '10px', borderRadius: 10, border: `1px solid ${videoFormat===f?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.08)'}`, background: videoFormat===f?'rgba(59,130,246,0.12)':'transparent', color: videoFormat===f?'#60a5fa':'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: videoFormat===f?700:400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {f === '9:16' ? '📱 9:16 TikTok/Reels' : '🖥️ 16:9 YouTube'}
                </button>
              ))}
            </div>
          </div>

          {/* Background color */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>WARNA BACKGROUND</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BG_OPTIONS.map(bg => (
                <button key={bg.value} onClick={() => setBgColor(bg.value)} title={bg.label} style={{ width: 36, height: 36, borderRadius: 8, background: bg.color, border: `2px solid ${bgColor===bg.value?'#60a5fa':'rgba(255,255,255,0.15)'}`, cursor: 'pointer', transition: 'all 0.15s', transform: bgColor===bg.value?'scale(1.15)':'scale(1)', boxShadow: bgColor===bg.value?`0 0 12px rgba(96,165,250,0.5)`:'' }} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Dipilih: <span style={{ color: '#60a5fa' }}>{selectedBg.label}</span></p>
          </div>

          {/* Posisi foto */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>POSISI FOTO</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {(['left','center','right'] as PhotoPos[]).map(pos => (
                <button key={pos} onClick={() => setPhotoPos(pos)} style={{ padding: '9px', borderRadius: 10, border: `1px solid ${photoPos===pos?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.08)'}`, background: photoPos===pos?'rgba(59,130,246,0.12)':'transparent', color: photoPos===pos?'#60a5fa':'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: photoPos===pos?700:400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {pos==='left'?'◀ Kiri':pos==='center'?'⊞ Tengah':'Kanan ▶'}
                </button>
              ))}
            </div>
          </div>

          {/* Posisi teks */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>POSISI TEKS / SUBTITLE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {TEXT_POSITIONS.map(tp => (
                <button key={tp.value} onClick={() => setTextPos(tp.value)} style={{ padding: '9px', borderRadius: 10, border: `1px solid ${textPos===tp.value?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.08)'}`, background: textPos===tp.value?'rgba(59,130,246,0.12)':'transparent', color: textPos===tp.value?'#60a5fa':'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: textPos===tp.value?700:400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {tp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>SUARA TTS</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['male','female'] as const).map(g => (
                <button key={g} onClick={() => setVoiceGender(g)} style={{ padding: '10px', borderRadius: 10, border: `1px solid ${voiceGender===g?'rgba(168,85,247,0.5)':'rgba(255,255,255,0.08)'}`, background: voiceGender===g?'rgba(168,85,247,0.12)':'transparent', color: voiceGender===g?'#c084fc':'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: voiceGender===g?700:400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {g==='male'?'👨 Ardi (Pria)':'👩 Gadis (Wanita)'}
                </button>
              ))}
            </div>
          </div>

          {/* Narasi */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 12 }}>
              NARASI / TEKS <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.2)' }}>({narasi.trim().split(/\s+/).filter(Boolean).length} kata)</span>
            </label>
            <textarea className="input-glass" style={{ minHeight: 130, resize: 'vertical' }}
              placeholder={'Tulis narasi yang akan dibacakan AI...\n\nContoh:\nGofood setiap hari 50 ribu rupiah.\nDalam setahun itu 18 juta rupiah.\nBayangkan kalau diinvestasikan...'}
              value={narasi} onChange={e => setNarasi(e.target.value)} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Pisahkan kalimat dengan baris baru untuk timing subtitle lebih baik.</p>
          </div>

          {error && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171' }}>⚠️ {error}</div>}

          <button className="btn-primary" disabled={busy || !photo || narasi.trim().length < 10} onClick={handleSubmit} style={{ width: '100%', padding: 13, fontSize: 14 }}>
            {busy ? '⏳ Mengupload & Memproses...' : '🚀 Generate Hero Video'}
          </button>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Preview */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>PREVIEW</p>
            <div style={{
              background: selectedBg.color,
              borderRadius: 10,
              aspectRatio: videoFormat === '9:16' ? '9/16' : '16/9',
              maxHeight: videoFormat === '9:16' ? 220 : 140,
              display: 'flex',
              alignItems: textPos === 'top' ? 'flex-start' : textPos === 'middle' ? 'center' : 'flex-end',
              justifyContent: photoPos === 'right' ? 'flex-end' : photoPos === 'left' ? 'flex-start' : 'center',
              padding: 10,
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {photoPreview ? (
                <img src={photoPreview} alt="" style={{ height: '70%', objectFit: 'contain', borderRadius: 6 }} />
              ) : (
                <div style={{ width: 40, height: 70, background: 'rgba(255,255,255,0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
              )}
              {/* Text overlay indicator */}
              <div style={{ position: 'absolute', left: 8, right: 8, ...(textPos==='top'?{top:8}:textPos==='middle'?{top:'50%',transform:'translateY(-50%)'}:{bottom:8}) }}>
                <div style={{ height: 4, background: isLight?'rgba(0,0,0,0.3)':'rgba(255,255,255,0.3)', borderRadius: 2, marginBottom: 3 }} />
                <div style={{ height: 4, background: isLight?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.2)', borderRadius: 2, width: '70%' }} />
              </div>
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8, textAlign: 'center' }}>
              {videoFormat} · {selectedBg.label} · Foto {photoPos} · Teks {textPos}
            </p>
          </div>

          {/* Status */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>STATUS</p>
            {!status ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Belum ada job</div>
            ) : (
              <div>
                <span className={`badge-${status}`} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: 10 }}>{status.toUpperCase()}</span>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{STATUS_LABEL[status]}</div>
                {(status==='running'||status==='queued') && (
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#a855f7)', borderRadius: 2, width: status==='running'?'60%':'20%', transition: 'width 2s' }} />
                  </div>
                )}
                {jobId && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: 8 }}>{jobId}</div>}
              </div>
            )}
            {status === 'done' && jobId && (
              <button className="btn-primary" style={{ display: 'flex', width: '100%', marginTop: 12, justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)' }} disabled={downloading}
                onClick={async () => { setDownloading(true); try { await downloadJob(jobId); } catch(e) { setError(String(e)); } finally { setDownloading(false); } }}>
                {downloading ? '⏳ Mengunduh...' : '⬇️ Download MP4'}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>INFO</p>
            {['⏱️ Proses ~2-5 menit','🎙️ TTS bahasa Indonesia','✨ Animasi foto slide-up','📐 9:16 atau 16:9'].map(t => (
              <div key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
