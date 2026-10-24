import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { findOne, insert, remove } from '../store.js';

export const sessionCookieName = 'smartdesk_session';
export const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function readCookie(request, name) {
  const cookieHeader = request.headers.cookie || '';
  const item = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : '';
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await insert('sessions', { tokenHash: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function getSessionUser(request) {
  const token = readCookie(request, sessionCookieName);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await findOne('sessions', { tokenHash });
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await remove('sessions', { tokenHash });
    return null;
  }
  return findOne('users', { id: session.userId });
}

export async function deleteSession(request) {
  const token = readCookie(request, sessionCookieName);
  if (!token) return;
  await remove('sessions', { tokenHash: hashToken(token) });
}

export function setSessionCookie(response, token, expiresAt) {
  const seconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${seconds}${secure}`,
  );
}

export function clearSessionCookie(response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
  );
}

export function accountRole(user) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const email = String(user?.email || '')
    .trim()
    .toLowerCase();
  // The configured owner email is the only source of admin access. A stale
  // role field in MongoDB must never grant a customer the owner dashboard.
  return adminEmail && email === adminEmail ? 'admin' : 'customer';
}

export function publicUser(user) {
  const email = user.email || '';
  const hiddenPhoneAccountEmail =
    user.authProvider === 'firebase-phone' && email.endsWith('@phone.smartdesk.invalid');
  return {
    id: user.id,
    name: user.name,
    email: hiddenPhoneAccountEmail ? '' : email,
    role: accountRole(user),
    contactEmail: user.contactEmail || '',
    phone: user.phone || '',
    verifiedPhone: user.verifiedPhone || '',
    address: user.address || '',
    profilePicture: user.profilePicture || '',
  };
}

export async function requireAuth(request, response, next) {
  try {
    const user = await getSessionUser(request);
    if (!user) return response.status(401).json({ error: 'Please sign in to continue.' });
    request.user = publicUser(user);
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAdmin(request, response, next) {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ error: 'Owner access is required for this area.' });
  }
  return next();
}

export function requireCustomer(request, response, next) {
  if (request.user?.role !== 'customer') {
    return response.status(403).json({ error: 'This customer portal is for customer accounts.' });
  }
  return next();
}
