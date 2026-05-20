export type ApiError = { error: string };

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/**
 * Trigger authenticated file download.
 * Fetches /api/jobs/:id/download with credentials (cookie),
 * follows the 302 redirect to the presigned Supabase URL,
 * then opens it in a new tab for download.
 */
export async function downloadJob(jobId: string): Promise<void> {
  const res = await fetch(`/api/jobs/${jobId}/download`, {
    credentials: 'include',
    redirect: 'follow',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  // The final URL after redirect is the presigned Supabase URL
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `xfarming_${jobId}.${blob.type.includes('zip') ? 'zip' : 'mp4'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
