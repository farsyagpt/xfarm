/**
 * consumer.ts — Cloudflare Queue consumer
 *
 * Architecture: fire-and-forget async pattern.
 * 1. Consumer picks up job from queue
 * 2. Marks job as `running`
 * 3. POSTs to HF Space with presigned URLs + webhook callback URL
 * 4. HF Space processes async, calls back /api/webhook/job-done when done
 * 5. Consumer returns immediately (no timeout risk)
 *
 * HF Space is responsible for calling the webhook. If it fails to call back,
 * the job stays `running` indefinitely — the UI shows a "stuck" state.
 * Users can check status and resubmit if needed.
 */

import type { Env } from './env';
import { getJob, markJobFailed, markJobRunning } from './db';
import { presignGet, presignPut } from './storage';

type JobMessage = {
  jobId: string;
};

export async function handleJobMessage(env: Env, msg: JobMessage) {
  const job = await getJob(env, msg.jobId);
  if (!job) return;

  // Skip if already processed (duplicate message)
  if (job.status !== 'queued') return;

  await markJobRunning(env, job.id);

  try {
    const payload = JSON.parse(job.payload_json || '{}') as Record<string, unknown>;

    // Presigned GET for input (if any)
    const inputUrl = job.input_key ? await presignGet(env, job.input_key, 60 * 60) : null;

    // Presigned PUT for output — 2 hour window for long-running jobs
    const outputExt = job.type === 'xfarm' ? 'zip' : 'mp4';
    const outputKey = `outputs/${job.user_id}/${job.id}.${outputExt}`;
    const uploadUrl = await presignPut(
      env,
      outputKey,
      job.type === 'xfarm' ? 'application/zip' : 'video/mp4',
      60 * 120, // 2 hours
    );

    // Webhook URL so HF Space can call back when done
    const webhookUrl = `${env.WORKER_BASE_URL}/api/webhook/job-done`;

    let endpoint = '';
    if (job.type === 'infinity') endpoint = `${env.HF_STUDIO_BASE_URL.replace(/\/$/, '')}/infinity/render`;
    if (job.type === 'trendline') endpoint = `${env.HF_STUDIO_BASE_URL.replace(/\/$/, '')}/trendline/render`;
    if (job.type === 'xfarm') endpoint = `${env.HF_XFARM_BASE_URL.replace(/\/$/, '')}/api/bulk`;

    // Fire-and-forget: HF Space will call webhook when done
    // We use a short timeout just to confirm the Space accepted the job
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000); // 25s to accept

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          input_url: inputUrl,
          upload_url: uploadUrl,
          output_key: outputKey,
          webhook_url: webhookUrl,
          webhook_secret: env.ADMIN_SECRET,
          payload,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`HF error ${resp.status}: ${text.slice(0, 300)}`);
      }

      // HF Space accepted the job — it will call webhook when done
      // Job stays in `running` state until webhook fires
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      throw fetchErr;
    }
  } catch (err) {
    await markJobFailed(env, job.id, String(err));
  }
}
