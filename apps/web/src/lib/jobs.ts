import type { Job, JobType } from '@xfarming/shared';
import { apiFetch } from './api';

type CreateJobResponse = {
  jobId: string;
  started?: boolean;
  input?: { key: string; uploadUrl: string };
};

export async function createJob(opts: {
  type: JobType;
  payload: Record<string, unknown>;
  inputFile?: File;
}): Promise<CreateJobResponse> {
  const input = opts.inputFile
    ? { filename: opts.inputFile.name, contentType: opts.inputFile.type || 'application/octet-stream' }
    : undefined;

  return apiFetch<CreateJobResponse>('/api/jobs', {
    method: 'POST',
    body: JSON.stringify({ type: opts.type, payload: opts.payload, input }),
  });
}

export async function uploadToPresignedPut(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload gagal: HTTP ${res.status}`);
}

export async function startJob(jobId: string) {
  return apiFetch<{ ok: true }>(`/api/jobs/${jobId}/start`, { method: 'POST', body: '{}' });
}

export async function getJob(jobId: string) {
  return apiFetch<Job>(`/api/jobs/${jobId}`);
}

