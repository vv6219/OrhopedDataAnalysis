const express = require('express');
const router = express.Router();
const db = require('./database');
const {
  generateSalt,
  hashUserPassword,
  requireAuth
} = require('./auth');
const { logUserAction, UserActionEvents, LogLevels, getClientIp } = require('./userActionAuditLogger');

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
 * GET /api/users
 * Returns list of all users joined with staff info and array of assigned permissions
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const users = await allAsync(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.role,
        u.staff_id,
        u.is_active,
        u.expires_at,
        u.auto_lock_minutes,
        u.main_screen,
        u.last_login_at,
        u.last_logout_at,
        u.created_at,
        u.updated_at,
        s.full_name as staff_name,
        s.role as staff_role,
        s.specialization as staff_specialization,
        s.contact_phone as staff_phone,
        s.email as staff_email
      FROM users u
      LEFT JOIN staff s ON u.staff_id = s.id
      ORDER BY u.is_active DESC, u.role ASC, u.id ASC
    `);

    // Fetch all user permissions in one batch query
    const userPerms = await allAsync(`
      SELECT 
        up.user_id,
        p.id,
        p.code,
        p.name,
        p.badge_color,
        p.description
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      ORDER BY p.is_system DESC, p.id ASC
    `);

    // Map permissions by user_id
    const permsByUserId = {};
    userPerms.forEach((up) => {
      if (!permsByUserId[up.user_id]) permsByUserId[up.user_id] = [];
      permsByUserId[up.user_id].push({
        id: up.id,
        code: up.code,
        name: up.name,
        badge_color: up.badge_color,
        description: up.description
      });
    });

    // Attach permissions to users
    users.forEach((u) => {
      u.permissions = permsByUserId[u.id] || [];
      u.permission_codes = u.permissions.map(p => p.code);
    });

    // Order users: active first (1 before 0), then alphabetical А..Я by full_name/username
    users.sort((a, b) => {
      if (b.is_active !== a.is_active) {
        return b.is_active - a.is_active;
      }
      const nameA = (a.full_name || a.username || '').trim();
      const nameB = (b.full_name || b.username || '').trim();
      return nameA.localeCompare(nameB, 'ru', { sensitivity: 'base' });
    });

    // Calculate quick stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active === 1).length;
    const linkedStaffCount = users.filter(u => u.staff_id != null).length;
    const blockedCount = totalUsers - activeUsers;

    res.json({
      success: true,
      users,
      stats: {
        totalUsers,
        activeUsers,
        linkedStaffCount,
        blockedCount
      }
    });
  } catch (err) {
    console.error('[Users API] Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Ошибка получения списка пользователей: ' + err.message });
  }
});

/**
 * GET /api/users/:id
 * Returns single user details with permissions
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await getAsync(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.role,
        u.staff_id,
        u.is_active,
        u.expires_at,
        u.auto_lock_minutes,
        u.main_screen,
        u.last_login_at,
        u.last_logout_at,
        u.created_at,
        u.updated_at,
        s.full_name as staff_name,
        s.role as staff_role,
        s.specialization as staff_specialization
      FROM users u
      LEFT JOIN staff s ON u.staff_id = s.id
      WHERE u.id = ?
    `, [req.params.id]);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const perms = await allAsync(`
      SELECT p.id, p.code, p.name, p.badge_color, p.description
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = ?
    `, [user.id]);

    user.permissions = perms;
    user.permission_codes = perms.map(p => p.code);

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users
 * Creates new user with password encryption, staff linkage, and multi-permission assignment
 */
router.post('/', requireAuth, async (req, res) => {
  const {
    username,
    password,
    full_name,
    role = 'doctor',
    staff_id = null,
    is_active = 1,
    expires_at = null,
    auto_lock_minutes = 15,
    main_screen = '/',
    permission_ids = []
  } = req.body || {};

  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, error: 'Логин пользователя обязателен' });
  }

  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, error: 'Пароль должен содержать минимум 4 символа' });
  }

  const cleanUsername = username.trim();
  const cleanFullName = (full_name && full_name.trim()) || cleanUsername;
  const cleanMainScreen = (main_screen && main_screen.trim()) || '/';

  try {
    // 1. Check unique username
    const existing = await getAsync(
      `SELECT id FROM users WHERE username = ? COLLATE NOCASE`,
      [cleanUsername]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Пользователь с логином «${cleanUsername}» уже зарегистрирован в системе`
      });
    }

    // 2. Hash password
    const salt = generateSalt();
    const hash = hashUserPassword(password, salt);

    // 3. Insert into database
    const result = await runAsync(`
      INSERT INTO users (
        username, password_hash, password_salt, staff_id, full_name,
        role, is_active, expires_at, auto_lock_minutes, main_screen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cleanUsername,
      hash,
      salt,
      staff_id ? Number(staff_id) : null,
      cleanFullName,
      role,
      is_active ? 1 : 0,
      expires_at ? expires_at.trim() : null,
      Number(auto_lock_minutes) || 15,
      cleanMainScreen
    ]);

    const newUserId = result.lastID;

    // 4. Assign permissions: default to 'default' if empty
    let finalPermIds = Array.isArray(permission_ids) && permission_ids.length > 0
      ? permission_ids.map(Number).filter(Boolean)
      : [];

    // Ensure 'default' permission is always present
    const defaultPerm = await getAsync(`SELECT id FROM permissions WHERE code = 'default'`);
    if (defaultPerm && !finalPermIds.includes(defaultPerm.id)) {
      finalPermIds.push(defaultPerm.id);
    }

    for (const pId of finalPermIds) {
      await runAsync(
        `INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)`,
        [newUserId, pId]
      );
    }

    logUserAction({
      level: LogLevels.INFO,
      eventType: UserActionEvents.USER_CREATED,
      sourceContext: 'OrthoErp.Users',
      message: `[user_created] Создан пользователь «${cleanUsername}» (${cleanFullName}), роль: ${role}`,
      userId: req.user?.userId || null,
      username: req.user?.username || 'admin',
      clientIp: getClientIp(req),
      properties: {
        createdUserId: newUserId,
        createdUsername: cleanUsername,
        role,
        staffId: staff_id,
        permissionsCount: finalPermIds.length
      }
    });

    res.status(201).json({
      success: true,
      message: `Пользователь «${cleanUsername}» успешно создан`,
      userId: newUserId
    });
  } catch (err) {
    console.error('[Users API] Error creating user:', err);
    res.status(500).json({ success: false, error: 'Ошибка создания пользователя: ' + err.message });
  }
});

/**
 * PUT /api/users/:id
 * Updates existing user record and synchronizes assigned permissions
 */
router.put('/:id', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  const {
    username,
    password,
    full_name,
    role,
    staff_id,
    is_active,
    expires_at,
    auto_lock_minutes,
    main_screen,
    permission_ids
  } = req.body || {};

  try {
    const existingUser = await getAsync(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    // Check if new username conflicts with another user
    if (username && username.trim().toLowerCase() !== existingUser.username.toLowerCase()) {
      const conflict = await getAsync(
        `SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?`,
        [username.trim(), userId]
      );
      if (conflict) {
        return res.status(409).json({
          success: false,
          error: `Логин «${username.trim()}» уже занят другим пользователем`
        });
      }
    }

    // Safety: ensure at least one active admin remains in system
    if (existingUser.role === 'admin' && (is_active === 0 || is_active === false || (role && role !== 'admin'))) {
      const activeAdminCount = await getAsync(
        `SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1 AND id != ?`,
        [userId]
      );
      if (!activeAdminCount || activeAdminCount.count < 1) {
        return res.status(400).json({
          success: false,
          error: 'Нельзя заблокировать или изменить роль последнего активного администратора системы.'
        });
      }
    }

    // If password provided, update hash and salt
    let newHash = existingUser.password_hash;
    let newSalt = existingUser.password_salt;
    if (password && password.trim().length >= 4) {
      newSalt = generateSalt();
      newHash = hashUserPassword(password.trim(), newSalt);
    }

    const updatedUsername = (username && username.trim()) || existingUser.username;
    const updatedFullName = (full_name && full_name.trim()) || existingUser.full_name;
    const updatedRole = role || existingUser.role;
    const updatedStaffId = staff_id !== undefined ? (staff_id ? Number(staff_id) : null) : existingUser.staff_id;
    const updatedIsActive = is_active !== undefined ? (is_active ? 1 : 0) : existingUser.is_active;
    const updatedExpiresAt = expires_at !== undefined ? (expires_at ? expires_at.trim() : null) : existingUser.expires_at;
    const updatedAutoLock = auto_lock_minutes !== undefined ? (Number(auto_lock_minutes) || 15) : existingUser.auto_lock_minutes;
    const updatedMainScreen = main_screen !== undefined ? (main_screen ? main_screen.trim() : '/') : (existingUser.main_screen || '/');

    await runAsync(`
      UPDATE users SET
        username = ?,
        password_hash = ?,
        password_salt = ?,
        full_name = ?,
        role = ?,
        staff_id = ?,
        is_active = ?,
        expires_at = ?,
        auto_lock_minutes = ?,
        main_screen = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `, [
      updatedUsername,
      newHash,
      newSalt,
      updatedFullName,
      updatedRole,
      updatedStaffId,
      updatedIsActive,
      updatedExpiresAt,
      updatedAutoLock,
      updatedMainScreen,
      userId
    ]);

    // Synchronize multi-permissions if permission_ids array was provided
    if (Array.isArray(permission_ids)) {
      await runAsync(`DELETE FROM user_permissions WHERE user_id = ?`, [userId]);
      const finalPermIds = permission_ids.map(Number).filter(Boolean);

      // Ensure 'default' permission is maintained
      const defaultPerm = await getAsync(`SELECT id FROM permissions WHERE code = 'default'`);
      if (defaultPerm && !finalPermIds.includes(defaultPerm.id)) {
        finalPermIds.push(defaultPerm.id);
      }

      for (const pId of finalPermIds) {
        await runAsync(
          `INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)`,
          [userId, pId]
        );
      }
    }

    logUserAction({
      level: LogLevels.INFO,
      eventType: UserActionEvents.USER_UPDATED,
      sourceContext: 'OrthoErp.Users',
      message: `[user_updated] Обновлены данные пользователя «${updatedUsername}» (ID: ${userId})`,
      userId: req.user?.userId || null,
      username: req.user?.username || 'admin',
      clientIp: getClientIp(req),
      properties: {
        targetUserId: userId,
        targetUsername: updatedUsername,
        role: updatedRole,
        isActive: updatedIsActive,
        passwordChanged: Boolean(password && password.trim().length >= 4)
      }
    });

    res.json({
      success: true,
      message: `Данные пользователя «${updatedUsername}» успешно обновлены`
    });
  } catch (err) {
    console.error('[Users API] Error updating user:', err);
    res.status(500).json({ success: false, error: 'Ошибка обновления пользователя: ' + err.message });
  }
});

/**
 * POST /api/users/:id/toggle-status
 * Toggles active/blocked status
 */
router.post('/:id/toggle-status', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const user = await getAsync(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const newStatus = user.is_active === 1 ? 0 : 1;

    // Prevent deactivating last active admin
    if (user.role === 'admin' && newStatus === 0) {
      const activeAdminCount = await getAsync(
        `SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1 AND id != ?`,
        [userId]
      );
      if (!activeAdminCount || activeAdminCount.count < 1) {
        return res.status(400).json({
          success: false,
          error: 'Нельзя заблокировать последнего активного администратора.'
        });
      }
    }

    await runAsync(
      `UPDATE users SET is_active = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
      [newStatus, userId]
    );

    logUserAction({
      level: LogLevels.INFO,
      eventType: newStatus === 1 ? UserActionEvents.USER_UNLOCKED : UserActionEvents.USER_LOCKED,
      sourceContext: 'OrthoErp.Users',
      message: `[${newStatus === 1 ? 'user_unlocked' : 'user_locked'}] Статус пользователя «${user.username}» изменен на: ${newStatus === 1 ? 'Активен' : 'Заблокирован (152-ФЗ)'}`,
      userId: req.user?.userId || null,
      username: req.user?.username || 'admin',
      clientIp: getClientIp(req),
      properties: { targetUserId: userId, targetUsername: user.username, newStatus }
    });

    res.json({
      success: true,
      isActive: newStatus === 1,
      message: newStatus === 1 ? 'Пользователь активирован' : 'Пользователь заблокирован'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users/:id/reset-password
 * Resets user password
 */
router.post('/:id/reset-password', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  const { newPassword } = req.body || {};

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, error: 'Новый пароль должен содержать не менее 4 символов' });
  }

  try {
    const user = await getAsync(`SELECT id, username FROM users WHERE id = ?`, [userId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const salt = generateSalt();
    const hash = hashUserPassword(newPassword.trim(), salt);

    await runAsync(
      `UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
      [hash, salt, userId]
    );

    logUserAction({
      level: LogLevels.INFO,
      eventType: UserActionEvents.USER_PASSWORD_CHANGED,
      sourceContext: 'OrthoErp.Users',
      message: `[user_password_changed] Сброшен пароль пользователя «${user.username}» (ID: ${userId})`,
      userId: req.user?.userId || null,
      username: req.user?.username || 'admin',
      clientIp: getClientIp(req),
      properties: { targetUserId: userId, targetUsername: user.username }
    });

    res.json({
      success: true,
      message: `Пароль пользователя «${user.username}» успешно изменен`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/users/:id
 * Deletes user record
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);

  try {
    const user = await getAsync(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    // Safety: prevent deleting self
    if (req.user && req.user.userId === userId) {
      return res.status(400).json({
        success: false,
        error: 'Нельзя удалить собственную учетную запись во время активного сеанса.'
      });
    }

    // Safety: prevent deleting last active admin
    if (user.role === 'admin') {
      const adminCount = await getAsync(
        `SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND id != ?`,
        [userId]
      );
      if (!adminCount || adminCount.count < 1) {
        return res.status(400).json({
          success: false,
          error: 'Нельзя удалить единственного администратора системы.'
        });
      }
    }

    // Delete user (user_permissions cascading delete)
    await runAsync(`DELETE FROM users WHERE id = ?`, [userId]);

    logUserAction({
      level: LogLevels.WARN,
      eventType: UserActionEvents.USER_DELETED,
      sourceContext: 'OrthoErp.Users',
      message: `[user_deleted] Удален пользователь «${user.username}» (ID: ${userId}, Роль: ${user.role})`,
      userId: req.user?.userId || null,
      username: req.user?.username || 'admin',
      clientIp: getClientIp(req),
      properties: { deletedUserId: userId, deletedUsername: user.username, role: user.role }
    });

    res.json({
      success: true,
      message: `Пользователь «${user.username}» успешно удален`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
