import type { Env } from './env';
import { nowIso } from './utils';

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  status: 'pending_payment' | 'active' | 'suspended';
  created_at: string;
};

export async function getUserByEmail(env: Env, email: string): Promise<DbUser | null> {
  const res = await env.DB.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(email).first<DbUser>();
  return res ?? null;
}

export async function getUserById(env: Env, id: string): Promise<DbUser | null> {
  const res = await env.DB.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(id).first<DbUser>();
  return res ?? null;
}

export async function createUser(env: Env, user: { id: string; email: string; passwordHash: string }) {
  const now = nowIso();
  await env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, status, created_at) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(user.id, user.email, user.passwordHash, 'pending_payment', now)
    .run();
}

export async function setUserStatus(env: Env, userId: string, status: DbUser['status']) {
  await env.DB.prepare('UPDATE users SET status = ? WHERE id = ?').bind(status, userId).run();
}

export type DbJob = {
  id: string;
  user_id: string;
  type: 'infinity' | 'trendline' | 'xfarm';
  status: 'queued' | 'running' | 'done' | 'failed';
  payload_json: string;
  input_key: string | null;
  output_key: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export async function createJob(env: Env, job: Omit<DbJob, 'created_at' | 'updated_at' | 'error' | 'output_key'>) {
  const now = nowIso();
  await env.DB.prepare(
    'INSERT INTO jobs (id, user_id, type, status, payload_json, input_key, output_key, error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)',
  )
    .bind(job.id, job.user_id, job.type, job.status, job.payload_json, job.input_key, now, now)
    .run();
}

export async function getJob(env: Env, jobId: string): Promise<DbJob | null> {
  const res = await env.DB.prepare('SELECT * FROM jobs WHERE id = ? LIMIT 1').bind(jobId).first<DbJob>();
  return res ?? null;
}

export async function listJobs(env: Env, userId: string, limit = 20): Promise<DbJob[]> {
  const res = await env.DB.prepare('SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .bind(userId, limit)
    .all<DbJob>();
  return res.results ?? [];
}

export async function markJobRunning(env: Env, jobId: string) {
  const now = nowIso();
  await env.DB.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?')
    .bind('running', now, jobId)
    .run();
}

export async function markJobDone(env: Env, jobId: string, outputKey: string) {
  const now = nowIso();
  await env.DB.prepare('UPDATE jobs SET status = ?, output_key = ?, updated_at = ? WHERE id = ?')
    .bind('done', outputKey, now, jobId)
    .run();
}

export async function markJobFailed(env: Env, jobId: string, error: string) {
  const now = nowIso();
  await env.DB.prepare('UPDATE jobs SET status = ?, error = ?, updated_at = ? WHERE id = ?')
    .bind('failed', error, now, jobId)
    .run();
}

