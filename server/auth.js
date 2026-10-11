const crypto = require('crypto');
const { getAppSettings } = require('./config');

// Default fallback security config with PBKDF2 encrypted password for "ortho#2026"
const DEFAULT_SECURITY = {
  AuthEnabled: true,
  Algorithm: 'PBKDF2-SHA512',
  Salt: 'ortho_salt_v1_2026_clinic_secure',
  Iterations: 100000,
  PasswordHash: '7f088259f37a417d5724bc1c394d38e4f560b57342de1996b2606fd1c70f75926e09776086ad503f45dfdcddc820e93681552f67bd21f9b0a9ff87664da7d13b',
  SessionTtlHours: 24,
  HmacSecret: 'ortho_erp_hmac_shared_secret_2026_sochi_clinic'
};

function getSecurityConfig() {
  const settings = getAppSettings();
  return { ...DEFAULT_SECURITY, ...(settings?.Security || {}) };
}

/**
 * Verifies candidate password against stored PBKDF2 hash using timingSafeEqual
 */
function verifyPassword(candidatePassword) {
  if (!candidatePassword || typeof candidatePassword !== 'string') return false;
  const cfg = getSecurityConfig();
  try {
    const computedHash = crypto
      .pbkdf2Sync(candidatePassword, cfg.Salt, cfg.Iterations, 64, 'sha512')
      .toString('hex');
    const computedBuf = Buffer.from(computedHash, 'hex');
    const storedBuf = Buffer.from(cfg.PasswordHash, 'hex');

    if (computedBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, storedBuf);
  } catch (err) {
    console.error('[Auth] Error verifying password:', err.message);
    return false;
  }
}

/**
 * Creates an HMAC-SHA256 signed session token
 */
function createToken(payload = {}) {
  const cfg = getSecurityConfig();
  const ttlMs = (cfg.SessionTtlHours || 24) * 3600 * 1000;
  const tokenPayload = {
    ...payload,
    user: payload.user || 'Администратор',
    role: payload.role || 'admin',
    iat: Date.now(),
    exp: Date.now() + ttlMs
  };

  const payloadB64 = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', cfg.HmacSecret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies HMAC-SHA256 signed token
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const cfg = getSecurityConfig();
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;

  try {
    const expectedSig = crypto
      .createHmac('sha256', cfg.HmacSecret)
      .update(payloadB64)
      .digest('base64url');

    const expectedBuf = Buffer.from(expectedSig);
    const actualBuf = Buffer.from(signature);

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return null;
    }

    const json = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (json.exp && json.exp < Date.now()) {
      return null; // Expired
    }

    return json;
  } catch (e) {
    return null;
  }
}

/**
 * Extracts and verifies token from request (Bearer header, x-auth-token, or query param)
 */
function extractTokenFromReq(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.headers['x-auth-token']) {
    return req.headers['x-auth-token'];
  }
  if (req.query && req.query.auth_token) {
    return req.query.auth_token;
  }
  return null;
}

/**
 * Express Middleware: Protects endpoints requiring authentication
 */
function requireAuth(req, res, next) {
  const cfg = getSecurityConfig();
  if (!cfg.AuthEnabled) {
    return next();
  }

  // 1. Check Bearer / custom token
  const token = extractTokenFromReq(req);
  if (token) {
    const session = verifyToken(token);
    if (session) {
      req.user = session;
      return next();
    }
  }

  // 2. Check HTTP Basic Auth (for API callers or curl)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const b64Credentials = authHeader.substring(6).trim();
      const credentials = Buffer.from(b64Credentials, 'base64').toString('utf-8');
      const colonIdx = credentials.indexOf(':');
      const password = colonIdx !== -1 ? credentials.substring(colonIdx + 1) : credentials;

      if (verifyPassword(password)) {
        req.user = { user: 'Администратор', role: 'admin' };
        return next();
      }
    } catch (e) {
      // ignore
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Требуется авторизация (сессия не найдена или истекла)',
    requiresAuth: true
  });
}

/**
 * Express Middleware for Swagger UI (/api-docs):
 * Prompts with browser-native Basic Auth or accepts token/cookie
 */
function swaggerBasicAuth(req, res, next) {
  const cfg = getSecurityConfig();
  if (!cfg.AuthEnabled) {
    return next();
  }

  // 1. Allow if token is supplied via query param or cookie/header
  const token = extractTokenFromReq(req);
  if (token && verifyToken(token)) {
    return next();
  }

  // 2. Check HTTP Basic Auth
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const b64Credentials = authHeader.substring(6).trim();
      const credentials = Buffer.from(b64Credentials, 'base64').toString('utf-8');
      const colonIdx = credentials.indexOf(':');
      const password = colonIdx !== -1 ? credentials.substring(colonIdx + 1) : credentials;

      if (verifyPassword(password)) {
        return next();
      }
    } catch (e) {
      // ignore
    }
  }

  // Challenge with HTTP 401 and Basic Auth realm (must be strict ASCII)
  res.set('WWW-Authenticate', 'Basic realm="OrthoERP Swagger OpenAPI Docs"');
  return res.status(401).send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="utf-8">
      <title>401 Требуется авторизация — ОртоERP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0F172A; color: #F8FAFC; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1E293B; border: 1px solid #334155; padding: 32px; border-radius: 12px; max-width: 440px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h2 { color: #38BDF8; margin-top: 0; }
        p { color: #94A3B8; font-size: 14px; line-height: 1.5; }
        code { background: #0F172A; color: #38BDF8; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        button { background: #0284C7; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 16px; }
        button:hover { background: #0369A1; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🔒 Доступ защищен</h2>
        <p>Для просмотра спецификации REST API OpenAPI (Swagger UI) требуется авторизация по единому паролю клиники.</p>
        <p>Обновите страницу и введите единый пароль в окне браузера.</p>
        <button onclick="location.reload()">Войти снова</button>
      </div>
    </body>
    </html>
  `);
}

module.exports = {
  getSecurityConfig,
  verifyPassword,
  createToken,
  verifyToken,
  requireAuth,
  swaggerBasicAuth
};
