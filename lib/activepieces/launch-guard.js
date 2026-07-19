import crypto from 'crypto';

const DEFAULT_COOKIE_NAME = 'mg_activepieces_launch';
const DEFAULT_TTL_SECONDS = 90;

function getLaunchSecret() {
  return process.env.ACTIVEPIECES_LAUNCH_SECRET || process.env.ACTIVEPIECES_USER_PASSWORD_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getActivepiecesLaunchCookieName() {
  return process.env.ACTIVEPIECES_LAUNCH_COOKIE_NAME || DEFAULT_COOKIE_NAME;
}

export function getActivepiecesLaunchCookieDomain() {
  return process.env.ACTIVEPIECES_SHARED_COOKIE_DOMAIN || undefined;
}

export function issueActivepiecesLaunchToken({ userId, email, ttlSeconds = DEFAULT_TTL_SECONDS } = {}) {
  const secret = getLaunchSecret();
  if (!secret) {
    throw new Error('ACTIVEPIECES_LAUNCH_SECRET or ACTIVEPIECES_USER_PASSWORD_SECRET is required');
  }

  const payload = {
    sub: String(userId || ''),
    email: String(email || '').toLowerCase().trim(),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyActivepiecesLaunchToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const secret = getLaunchSecret();
  if (!secret) {
    throw new Error('ACTIVEPIECES_LAUNCH_SECRET or ACTIVEPIECES_USER_PASSWORD_SECRET is required');
  }

  const [encodedPayload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload?.sub || !payload?.email || !payload?.exp) {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (_) {
    return null;
  }
}
