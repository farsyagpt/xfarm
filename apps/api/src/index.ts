import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { nanoid } from 'nanoid';

import type { Env } from './env';
import { json } from './utils';
import { clearSessionCookie, getSessionCookie, hashPassword, newSessionId, setSessionCookie, signSession, verifyPassword, verifySession } from './auth';
import { createJob, createUser, getJob, getUserByEmail, getUserById, listJobs, setUserStatus } from './db';
import { presignGet, presignPut } from './storage';
import { handleJobMessage } from './consumer';
import { AuthLoginSchema, AuthSignupSchema, CreateJobSchema } from '@xfarming/shared';

const app = new Hono<{ Bindings: Env }>();

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowed = c.env.APP_ORIGIN;
      // Dev-friendly: allow same-origin / no origin (curl)
      if (!origin) return allowed;
      return origin === allowed ? origin : allowed;
    },
    credentials: true,
  }),
);

app.use('*', async (c, next) => {
  const token = getSessionCookie(c.req.raw);
  if (token) {
    const sess = await verifySession(c.env, token);
    if (sess) c.set('session', sess);
  }
  await next();
});

function requireSession(c: any) {
  const sess = c.get('session') as { uid: string; sid: string } | undefined;
  if (!sess) return null;
  return sess;
}

app.get('/api/health', (c) => json({ ok: true }));

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────
app.post('/api/auth/signup', zValidator('json', AuthSignupSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const existing = await getUserByEmail(c.env, email);
  if (existing) return json({ error: 'Email sudah dipakai.' }, { status: 409 });

  const uid = nanoid();
  const passwordHash = await hashPassword(password);
  await createUser(c.env, { id: uid, email, passwordHash });

  const jwt = await signSession(c.env, { uid, sid: newSessionId() });
  const res = json({ ok: true }, { status: 201 });
  setSessionCookie(res, jwt);
  return res;
});

app.post('/api/auth/login', zValidator('json', AuthLoginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const user = await getUserByEmail(c.env, email);
  if (!user) return json({ error: 'Email / password salah.' }, { status: 401 });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return json({ error: 'Email / password salah.' }, { status: 401 });

  const jwt = await signSession(c.env, { uid: user.id, sid: newSessionId() });
  const res = json({ ok: true });
  setSessionCookie(res, jwt);
  return res;
});

app.post('/api/auth/logout', async (c) => {
  const res = json({ ok: true });
  clearSessionCookie(res);
  return res;
});

app.get('/api/me', async (c) => {
  const sess = requireSession(c);
  if (!sess) return json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserById(c.env, sess.uid);
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  return json({ id: user.id, email: user.email, status: user.status });
});

// ─────────────────────────────────────────────────────────────
// BILLING (QRIS -> WhatsApp manual)
// ─────────────────────────────────────────────────────────────
app.get('/api/billing/status', async (c) => {
  const sess = requireSession(c);
  if (!sess) return json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserById(c.env, sess.uid);
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  return json({ status: user.status });
});

app.post(
  '/api/billing/whatsapp',
  zValidator(
    'json',
    z.object({
      phone: z.string().min(6).optional(), // optional override
    }),
  ),
  async (c) => {
    const sess = requireSession(c);
    if (!sess) return json({ error: 'Unauthorized' }, { status: 401 });
    const user = await getUserById(c.env, sess.uid);
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

    const waNumber = (c.req.valid('json').phone || '').trim(); // kalau kosong, frontend bisa pakai env/konstanta
    const msg = encodeURIComponent(
      `Halo admin, saya sudah bayar. Mohon aktivasi akun:\n\nemail: ${user.email}\nuser_id: ${user.id}\nwaktu: ${new Date().toISOString()}`,
    );
    const url = waNumber ? `https://wa.me/${waNumber}?text=${msg}` : `https://wa.me/?text=${msg}`;
    return json({ url });
  },
);

// Admin activate (manual)
app.post('/api/admin/users/:id/activate', async (c) => {
  const secret = c.req.header('x-admin-secret') || '';
  if (!secret || secret !== c.env.ADMIN_SECRET) return json({ error: 'Forbidden' }, { status: 403 });
  const id = c.req.param('id');
  await setUserStatus(c.env, id, 'active');
  return json({ ok: true });
});

// ─────────────────────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────────────────────
const CreateJobBody = CreateJobSchema.extend({
  input: z
    .object({
      filename: z.string().min(1),
      contentType: z.string().min(3),
    })
    .optional(),
});

app.post('/api/jobs', zValidator('json', CreateJobBody), async (c) => {
  const sess = requireSession(c);
  if (!sess) return json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserById(c.env, sess.uid);
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (user.status !== 'active') return json({ error: 'Payment required' }, { status: 403 });

  const body = c.req.valid('json');
  const jobId = nanoid();

  const needsInput = body.type === 'infinity' || body.type === 'trendline';
  if (needsInput && !body.input) {
    return json({ error: 'Input file wajib untuk tipe ini.' }, { status: 400 });
  }

  const inputKey = body.input ? `inputs/${user.id}/${jobId}/${body.input.filename}` : null;
  const outputExt = body.type === 'xfarm' ? 'zip' : 'mp4';
  const outputKey = `outputs/${user.id}/${jobId}.${outputExt}`;

  // Simpan output_key sebagai bagian payload (biar consumer bisa fallback)
  await createJob(c.env, {
    id: jobId,
    user_id: user.id,
    type: body.type,
    status: 'queued',
    payload_json: JSON.stringify({ ...body.payload, outputKey }),
    input_key: inputKey,
  });

  const result: Record<string, unknown> = { jobId };
  if (inputKey && body.input) {
    const uploadUrl = await presignPut(c.env, inputKey, body.input.contentType, 60 * 30);
    result.input = { key: inputKey, uploadUrl };
  }
  // Untuk xfarm tanpa input, langsung enqueue
  if (body.type === 'xfarm') {
    await c.env.JOBS.send({ jobId });
    result.started = true;
  } else {
    result.started = false;
  }

  return json(result);
});

app.post('/api/jobs/:id/start', async (c) => {
  const sess = requireSession(c);
  if (!sess) return json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserById(c.env, sess.uid);
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
  if (user.status !== 'active') return json({ error: 'Payment required' }, { status: 403 });

  const jobId = c.req.param('id');
  const job = await getJob(c.env, jobId);
  if (!job || job.user_id !== user.id) return json({ error: 'Not found' }, { status: 404 });

  await c.env.JOBS.send({ jobId });
  return json({ ok: true });
});

app.get('/api/jobs', async (c) => {
  const sess = requireSession(c);
  if (!sess) return json({ error: 'Unauthorized' }, { status: 401 });
  const jobs = await listJobs(c.env, sess.uid, 50);
  return json({
    jobs: jobs.map((j) => ({
      id: j.id,
      type: j.type,
      status: j.status,
      createdAt: j.created_at,
      updatedAt: j.updated_at,
      outputKey: j.output_key,
      error: j.error,
    })),
  });
});

app.get('/api/jobs/:id', async (c) => {
  const sess = requireSession(c);
  if (!sess) return json({ error: 'Unauthorized' }, { status: 401 });
  const jobId = c.req.param('id');
  const job = await getJob(c.env, jobId);
  if (!job || job.user_id !== sess.uid) return json({ error: 'Not found' }, { status: 404 });
  return json({
    id: job.id,
    type: job.type,
    status: job.status,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    outputKey: job.output_key,
    error: job.error,
  });
});

app.get('/api/jobs/:id/download', async (c) => {
  const sess = requireSession(c);
  if (!sess) return json({ error: 'Unauthorized' }, { status: 401 });
  const jobId = c.req.param('id');
  const job = await getJob(c.env, jobId);
  if (!job || job.user_id !== sess.uid) return json({ error: 'Not found' }, { status: 404 });
  if (job.status !== 'done' || !job.output_key) return json({ error: 'Not ready' }, { status: 409 });

  const url = await presignGet(c.env, job.output_key, 60 * 10);
  return c.redirect(url, 302);
});

export default {
  fetch: app.fetch,
  queue: async (batch: MessageBatch<any>, env: Env, ctx: ExecutionContext) => {
    for (const msg of batch.messages) {
      ctx.waitUntil(handleJobMessage(env, msg.body));
    }
  },
};

