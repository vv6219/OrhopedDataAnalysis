const express = require('express');
const router = express.Router();
const { verifyPassword, createToken, verifyToken, requireAuth } = require('./auth');

/**
 * POST /api/auth/login
 * Authenticates user via encrypted password comparison
 */
router.post('/login', (req, res) => {
  const { password, username } = req.body || {};

  if (!password) {
    return res.status(400).json({ success: false, error: 'Пароль не указан' });
  }

  const isValid = verifyPassword(password);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'Неверный пароль доступа к системе ОртоERP'
    });
  }

  const user = username || 'Администратор клиники';
  const token = createToken({ user, role: 'admin' });

  res.json({
    success: true,
    message: 'Авторизация успешна',
    token,
    user,
    role: 'admin',
    expiresInHours: 24
  });
});

/**
 * GET /api/auth/verify
 * Checks if current token/session is valid
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  } else if (req.query && req.query.auth_token) {
    token = req.query.auth_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, authenticated: false, error: 'Токен отсутствует' });
  }

  const session = verifyToken(token);
  if (!session) {
    return res.status(401).json({ success: false, authenticated: false, error: 'Токен недействителен или истек' });
  }

  res.json({
    success: true,
    authenticated: true,
    user: session.user,
    role: session.role,
    expiresAt: session.exp
  });
});

/**
 * POST /api/auth/logout
 * Logs out user session
 */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Сессия завершена' });
});

module.exports = router;
