import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import type { Env } from './env';

const COOKIE_NAME = 'xfarming_session';

function getKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export type Session = {
  uid: string;
  sid: string;
};

export async function signSession(env: Env, session: Session) {
  const jwt = await new SignJWT({ sid: session.sid })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.uid)
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(getKey(env.JWT_SECRET));

  return jwt;
}

export async function verifySession(env: Env, token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(env.JWT_SECRET), { algorithms: ['HS256'] });
    const uid = payload.sub;
    const sid = typeof payload.sid === 'string' ? payload.sid : undefined;
    if (!uid || !sid) return null;
    return { uid, sid };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, jwt: string) {
  const cookie = [
    `${COOKIE_NAME}=${jwt}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    // TODO: set Secure saat sudah https
  ].join('; ');
  res.headers.append('Set-Cookie', cookie);
}

export function clearSessionCookie(res: Response) {
  res.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

export function getSessionCookie(req: Request) {
  const cookie = req.headers.get('Cookie') || '';
  const parts = cookie.split(';').map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith(`${COOKIE_NAME}=`)) return p.slice(COOKIE_NAME.length + 1);
  }
  return null;
}

export function newSessionId() {
  return nanoid();
}

// Password hashing (PBKDF2) - Worker-friendly
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 310_000 },
    key,
    256,
  );
  const hash = new Uint8Array(bits);
  return `${toB64(salt)}.${toB64(hash)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltB64, hashB64] = stored.split('.');
  if (!saltB64 || !hashB64) return false;
  const salt = fromB64(saltB64);
  const expected = fromB64(hashB64);

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 310_000 },
    key,
    256,
  );
  const actual = new Uint8Array(bits);
  return timingSafeEqual(actual, expected);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function toB64(u8: Uint8Array) {
  let s = '';
  for (const ch of u8) s += String.fromCharCode(ch);
  return btoa(s);
}

function fromB64(b64: string) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

