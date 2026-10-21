const express = require('express');
const router = express.Router();
const db = require('./database');
const {
  verifyUserPassword,
  verifyPassword,
  createToken,
  verifyToken,
  requireAuth
} = require('./auth');

/**
 * Helper to execute db.get as a Promise
 */
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Helper to execute db.all as a Promise
 */
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * Helper to execute db.run as a Promise
 */
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

/**
 * POST /api/auth/login
 * Authenticates user via username and encrypted password against users table
 */
router.post('/login', async (req, res) => {
  const { password, username } = req.body || {};

  if (!password) {
    return res.status(400).json({ success: false, error: 'Пароль не указан' });
  }

  const cleanUsername = (username || '').trim();

  try {
    // 1. Try finding user in users table by username
    let userRow = null;
    if (cleanUsername) {
      userRow = await getAsync(
        `SELECT u.*, s.full_name as staff_name, s.role as staff_role, s.specialization as staff_specialization
         FROM users u
         LEFT JOIN staff s ON u.staff_id = s.id
         WHERE u.username = ? COLLATE NOCASE`,
        [cleanUsername]
      );
    }

    // 2. If no user row found with cleanUsername, but username wasn't given or is "Администратор",
    // check if there's an 'admin' record in users table
    if (!userRow && (!cleanUsername || cleanUsername.toLowerCase() === 'администратор' || cleanUsername.toLowerCase() === 'admin')) {
      userRow = await getAsync(
        `SELECT u.*, s.full_name as staff_name, s.role as staff_role, s.specialization as staff_specialization
         FROM users u
         LEFT JOIN staff s ON u.staff_id = s.id
         WHERE u.username = 'admin' COLLATE NOCASE`
      );
    }

    // 3. If user row found in database
    if (userRow) {
      // Check active status
      if (userRow.is_active !== 1) {
        return res.status(403).json({
          success: false,
          error: 'Учетная запись заблокирована администратором системы.'
        });
      }

      // Check account expiration date
      if (userRow.expires_at) {
        const expTime = new Date(userRow.expires_at).getTime();
        if (!isNaN(expTime) && expTime < Date.now()) {
          return res.status(403).json({
            success: false,
            error: `Срок действия учетной записи истек (${userRow.expires_at}). Обратитесь к администратору клиники.`
          });
        }
      }

      // Verify salted password
      const isPasswordValid = verifyUserPassword(
        password,
        userRow.password_hash,
        userRow.password_salt
      );

      // Fallback: also check master system password if user is admin
      const isMasterValid = userRow.role === 'admin' ? verifyPassword(password) : false;

      if (!isPasswordValid && !isMasterValid) {
        return res.status(401).json({
          success: false,
          error: 'Неверный пароль доступа к системе ОртоERP'
        });
      }

      // Update last_login_at
      await runAsync(
        `UPDATE users SET last_login_at = datetime('now', 'localtime') WHERE id = ?`,
        [userRow.id]
      ).catch(() => {});

      // Fetch user's permissions
      const userPerms = await allAsync(
        `SELECT p.id, p.code, p.name, p.badge_color, p.description
         FROM user_permissions up
         JOIN permissions p ON up.permission_id = p.id
         WHERE up.user_id = ?
         ORDER BY p.is_system DESC, p.id ASC`,
        [userRow.id]
      ).catch(() => []);

      const permCodes = userPerms.map(p => p.code);

      const tokenPayload = {
        userId: userRow.id,
        user: userRow.full_name || userRow.username,
        username: userRow.username,
        role: userRow.role,
        staffId: userRow.staff_id,
        staffName: userRow.staff_name,
        autoLockMinutes: userRow.auto_lock_minutes || 15,
        mainScreen: userRow.main_screen || '/',
        permissions: permCodes
      };

      const token = createToken(tokenPayload);

      return res.json({
        success: true,
        message: 'Авторизация успешна',
        token,
        userId: userRow.id,
        user: userRow.full_name || userRow.username,
        username: userRow.username,
        role: userRow.role,
        staffId: userRow.staff_id,
        staffName: userRow.staff_name,
        autoLockMinutes: userRow.auto_lock_minutes || 15,
        mainScreen: userRow.main_screen || '/',
        permissions: userPerms,
        permissionCodes: permCodes,
        expiresInHours: 24
      });
    }

    // 4. Legacy fallback if users table is somehow not matched: test system password
    const isMasterValid = verifyPassword(password);
    if (!isMasterValid) {
      return res.status(401).json({
        success: false,
        error: cleanUsername
          ? `Пользователь «${cleanUsername}» не найден или указан неверный пароль`
          : 'Неверный пароль доступа к системе ОртоERP'
      });
    }

    const fallbackUser = cleanUsername || 'Администратор';
    const token = createToken({ user: fallbackUser, username: 'admin', role: 'admin', autoLockMinutes: 15 });

    return res.json({
      success: true,
      message: 'Авторизация успешна (системный мастер-доступ)',
      token,
      userId: 1,
      user: fallbackUser,
      username: 'admin',
      role: 'admin',
      autoLockMinutes: 15,
      expiresInHours: 24
    });

  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера при авторизации: ' + err.message
    });
  }
});

/**
 * POST /api/auth/unlock
 * Fast re-authentication for the Lock Screen (verifies password of current locked user)
 */
router.post('/unlock', async (req, res) => {
  const { password, username, userId } = req.body || {};

  if (!password) {
    return res.status(400).json({ success: false, error: 'Пароль не указан' });
  }

  try {
    let userRow = null;
    if (userId) {
      userRow = await getAsync(`SELECT * FROM users WHERE id = ?`, [userId]);
    } else if (username) {
      userRow = await getAsync(`SELECT * FROM users WHERE username = ? COLLATE NOCASE`, [username]);
    }

    if (userRow) {
      if (userRow.is_active !== 1) {
        return res.status(403).json({
          success: false,
          error: 'Учетная запись заблокирована администратором.'
        });
      }

      const isPasswordValid = verifyUserPassword(
        password,
        userRow.password_hash,
        userRow.password_salt
      );

      const isMasterValid = userRow.role === 'admin' ? verifyPassword(password) : false;

      if (!isPasswordValid && !isMasterValid) {
        return res.status(401).json({ success: false, error: 'Неверный пароль разблокировки' });
      }

      await runAsync(
        `UPDATE users SET last_login_at = datetime('now', 'localtime') WHERE id = ?`,
        [userRow.id]
      ).catch(() => {});

      return res.json({
        success: true,
        message: 'Экран успешно разблокирован',
        user: userRow.full_name || userRow.username,
        role: userRow.role
      });
    }

    // Fallback: verify master system password
    if (verifyPassword(password)) {
      return res.json({ success: true, message: 'Экран разблокирован' });
    }

    return res.status(401).json({ success: false, error: 'Неверный пароль разблокировки' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/verify
 * Checks if current token/session is valid
 */
router.get('/verify', async (req, res) => {
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

  // Check if user is still active in database
  let dbUser = null;
  if (session.userId || session.username) {
    try {
      dbUser = await getAsync(
        `SELECT id, username, full_name, role, staff_id, is_active, auto_lock_minutes, expires_at
         FROM users
         WHERE id = ? OR username = ? COLLATE NOCASE`,
        [session.userId || 0, session.username || '']
      );
    } catch {}
  }

  if (dbUser && dbUser.is_active !== 1) {
    return res.status(403).json({ success: false, authenticated: false, error: 'Учетная запись заблокирована' });
  }

  const targetUserId = dbUser ? dbUser.id : session.userId;
  let userPerms = [];
  if (targetUserId) {
    userPerms = await allAsync(
      `SELECT p.id, p.code, p.name, p.badge_color, p.description
       FROM user_permissions up
       JOIN permissions p ON up.permission_id = p.id
       WHERE up.user_id = ?
       ORDER BY p.is_system DESC, p.id ASC`,
      [targetUserId]
    ).catch(() => []);
  }

  const permCodes = userPerms.map(p => p.code);

  res.json({
    success: true,
    authenticated: true,
    userId: targetUserId,
    user: dbUser ? dbUser.full_name : session.user,
    username: dbUser ? dbUser.username : session.username,
    role: dbUser ? dbUser.role : session.role,
    staffId: dbUser ? dbUser.staff_id : session.staffId,
    autoLockMinutes: dbUser?.auto_lock_minutes || session.autoLockMinutes || 15,
    mainScreen: dbUser?.main_screen || session.mainScreen || '/',
    permissions: userPerms,
    permissionCodes: permCodes,
    expiresAt: session.exp
  });
});

/**
 * POST /api/auth/logout
 * Logs out user session and updates last_logout_at
 */
router.post('/logout', async (req, res) => {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (token) {
    const session = verifyToken(token);
    if (session && (session.userId || session.username)) {
      try {
        await runAsync(
          `UPDATE users SET last_logout_at = datetime('now', 'localtime') WHERE id = ? OR username = ? COLLATE NOCASE`,
          [session.userId || 0, session.username || '']
        );
      } catch (e) {
        console.error('[Auth] Logout timestamp update error:', e.message);
      }
    }
  }

  res.json({ success: true, message: 'Сессия успешно завершена' });
});

module.exports = router;
