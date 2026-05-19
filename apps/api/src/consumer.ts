import type { Env } from './env';
import { getJob, markJobDone, markJobFailed, markJobRunning } from './db';
import { presignGet, presignPut } from './r2';

type JobMessage = {
  jobId: string;
};

export async function handleJobMessage(env: Env, msg: JobMessage) {
  const job = await getJob(env, msg.jobId);
  if (!job) return;

  await markJobRunning(env, job.id);

  try {
    const payload = JSON.parse(job.payload_json || '{}') as Record<string, unknown>;

    const inputUrl = job.input_key ? await presignGet(env, job.input_key, 60 * 30) : null;
    const outputKey =
      job.output_key ??
      (() => {
        // fallback: seharusnya output_key sudah ada, tapi jaga-jaga
        const ext = job.type === 'xfarm' ? 'zip' : 'mp4';
        return `outputs/${job.user_id}/${job.id}.${ext}`;
      })();
    const uploadUrl = await presignPut(
      env,
      outputKey,
      job.type === 'xfarm' ? 'application/zip' : 'video/mp4',
      60 * 30,
    );

    let endpoint = '';
    if (job.type === 'infinity') endpoint = `${env.HF_STUDIO_BASE_URL.replace(/\/$/, '')}/infinity/render`;
    if (job.type === 'trendline') endpoint = `${env.HF_STUDIO_BASE_URL.replace(/\/$/, '')}/trendline/render`;
    if (job.type === 'xfarm') endpoint = `${env.HF_XFARM_BASE_URL.replace(/\/$/, '')}/api/bulk`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        job_id: job.id,
        input_url: inputUrl,
        upload_url: uploadUrl,
        payload,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HF error ${resp.status}: ${text.slice(0, 500)}`);
    }

    await markJobDone(env, job.id, outputKey);
  } catch (err) {
    await markJobFailed(env, job.id, String(err));
  }
}

