import { useEffect, useState } from 'react';
import { createJob, getJob, startJob, uploadToPresignedPut } from '../lib/jobs';

type PhotoPos = 'center' | 'right';

const STATUS_LABEL: Record<string, string> = {
  queued: 'Antri di queue...',
  running: 'AI sedang memproses...',
  done: 'Selesai! Siap download.',
  failed: 'Gagal. Coba lagi.',
};

export function HeroVideoPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPos, setPhotoPos] = useState<PhotoPos>('center');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');
  const [narasi, setNarasi] = useState('');
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
    }, 2000);
    return () => { alive = false; clearInterval(t); };
  }, [jobId]);

  function handlePhotoChange(f: File | null) {
    setPhoto(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  }

  async function handleSubmit() {
    if (!photo || narasi.trim().length < 10) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    setJobId(null);
    try {
      const res = await createJob({
        type: 'infinity',
        payload: { story: narasi, voice_gender: voiceGender, photo_position: photoPos },
        inputFile: photo,
      });
      setJobId(res.jobId);
      setStatus('queued');
      if (!res.input) throw new Error('Server tidak mengembalikan uploadUrl.');
      await uploadToPresignedPut(res.input.uploadUrl, photo);
      await startJob(res.jobId);
      setStatus('running');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="anim-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>🎬</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#60a5fa', padding: '3px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>HERO VIDEO</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>Buat Hero Video</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Upload foto PNG transparan → pilih posisi → tulis narasi → sistem generate video animasi + TTS voice otomatis.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* ── LEFT: Form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Upload foto */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 12 }}>FOTO HERO (PNG transparan)</label>
            <div
              onClick={() => document.getElementById('photo-input')?.click()}
              style={{
                border: `2px dashed ${photo ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 12,
                padding: 24,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: photo ? 'rgba(59,130,246,0.05)' : 'transparent',
                position: 'relative',
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.5)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = photo ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="preview" style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Klik untuk upload foto PNG</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>Background transparan untuk hasil terbaik</div>
                </div>
              )}
            </div>
            <input id="photo-input" type="file" accept="image/png,image/*" style={{ display: 'none' }} onChange={e => handlePhotoChange(e.target.files?.[0] ?? null)} />
            {photo && <p style={{ fontSize: 11, color: '#60a5fa', marginTop: 8 }}>✓ {photo.name}</p>}
          </div>

          {/* Posisi foto */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 12 }}>POSISI FOTO</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['center', 'right'] as PhotoPos[]).map(pos => (
                <button
                  key={pos}
                  onClick={() => setPhotoPos(pos)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1px solid ${photoPos === pos ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: photoPos === pos ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: photoPos === pos ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                    fontSize: 13,
                    fontWeight: photoPos === pos ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>{pos === 'center' ? '⊞' : '▶'}</span>
                  {pos === 'center' ? 'Tengah' : 'Kanan'}
                </button>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 12 }}>SUARA TTS</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['male', 'female'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setVoiceGender(g)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1px solid ${voiceGender === g ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: voiceGender === g ? 'rgba(168,85,247,0.12)' : 'transparent',
                    color: voiceGender === g ? '#c084fc' : 'rgba(255,255,255,0.4)',
                    fontSize: 13,
                    fontWeight: voiceGender === g ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>{g === 'male' ? '👨' : '👩'}</span>
                  {g === 'male' ? 'Ardi (Pria)' : 'Gadis (Wanita)'}
                </button>
              ))}
            </div>
          </div>

          {/* Narasi */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 12 }}>
              NARASI / TEKS
              <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>({narasi.trim().split(/\s+/).filter(Boolean).length} kata)</span>
            </label>
            <textarea
              className="input-glass"
              style={{ minHeight: 140, resize: 'vertical' }}
              placeholder="Tulis narasi yang akan dibacakan AI...\n\nContoh:\nGofood setiap hari 50 ribu rupiah.\nDalam setahun itu 18 juta rupiah.\nBayangkan kalau diinvestasikan..."
              value={narasi}
              onChange={e => setNarasi(e.target.value)}
            />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Pisahkan kalimat dengan baris baru untuk timing subtitle yang lebih baik.</p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            className="btn-primary"
            disabled={busy || !photo || narasi.trim().length < 10}
            onClick={handleSubmit}
            style={{ width: '100%', padding: '13px', fontSize: 14 }}
          >
            {busy ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin-slow 0.8s linear infinite' }} />
                Mengupload & Memproses...
              </span>
            ) : '🚀 Generate Hero Video'}
          </button>
        </div>

        {/* ── RIGHT: Status ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Preview mockup */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>PREVIEW LAYOUT</p>
            <div style={{ background: '#000', borderRadius: 10, aspectRatio: '9/16', maxHeight: 220, display: 'flex', alignItems: 'flex-end', justifyContent: photoPos === 'right' ? 'flex-end' : 'center', padding: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
              {photoPreview ? (
                <img src={photoPreview} alt="" style={{ height: '75%', objectFit: 'contain', position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease' }} />
              ) : (
                <div style={{ width: 60, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: 8, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
              )}
              <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 2 }}>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 3, marginBottom: 4 }} />
                <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, width: '70%' }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 10, textAlign: 'center' }}>
              Foto muncul dari bawah · Teks overlay di atas
            </p>
          </div>

          {/* Status */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>STATUS JOB</p>

            {!status && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                Belum ada job aktif
              </div>
            )}

            {status && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span className={`badge-${status}`} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                    {status === 'running' && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#60a5fa', marginRight: 6, animation: 'pulse-slow 1s infinite' }} />}
                    {status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{STATUS_LABEL[status] ?? status}</span>
                </div>

                {/* Progress bar for running */}
                {(status === 'running' || status === 'queued') && (
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#a855f7)', borderRadius: 2, width: status === 'running' ? '60%' : '20%', transition: 'width 2s ease', animation: 'shimmer 2s linear infinite', backgroundSize: '200% auto' }} />
                  </div>
                )}

                {jobId && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {jobId}
                  </div>
                )}
              </div>
            )}

            {status === 'done' && downloadUrl && (
              <a
                href={downloadUrl}
                className="btn-primary"
                style={{ display: 'flex', width: '100%', marginTop: 16, textDecoration: 'none', justifyContent: 'center', background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
              >
                ⬇️ Download MP4
              </a>
            )}
          </div>

          {/* Info */}
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>INFO</p>
            {[
              '⏱️ Proses ~2-5 menit',
              '📐 Output format 9:16 (TikTok/Reels)',
              '🎙️ TTS bahasa Indonesia',
              '✨ Animasi foto dari bawah ke atas',
            ].map(t => (
              <div key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
