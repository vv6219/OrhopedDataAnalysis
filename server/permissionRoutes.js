const express = require('express');
const router = express.Router();
const db = require('./database');
const { requireAuth } = require('./auth');

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

/**
 * GET /api/permissions
 * Returns all permissions with user assignment counts
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const permissions = await allAsync(`
      SELECT 
        p.*,
        COUNT(up.user_id) as users_count,
        COUNT(up.user_id) as assigned_users_count
      FROM permissions p
      LEFT JOIN user_permissions up ON p.id = up.permission_id
      GROUP BY p.id
      ORDER BY p.is_system DESC, p.id ASC
    `);

    res.json({
      success: true,
      permissions
    });
  } catch (err) {
    console.error('[Permissions API] Error fetching permissions:', err);
    res.status(500).json({ success: false, error: 'Ошибка получения прав: ' + err.message });
  }
});

/**
 * GET /api/permissions/:id
 * Single permission details
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const permission = await getAsync(`
      SELECT p.*, COUNT(up.user_id) as users_count
      FROM permissions p
      LEFT JOIN user_permissions up ON p.id = up.permission_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [req.params.id]);

    if (!permission) {
      return res.status(404).json({ success: false, error: 'Тип прав не найден' });
    }

    res.json({ success: true, permission });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/permissions
 * Creates new permission type
 */
router.post('/', requireAuth, async (req, res) => {
  const { code, name, description, badge_color = '#0F3C64' } = req.body || {};

  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, error: 'Код права доступа обязателен (на английском, напр. auditor)' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Наименование права доступа обязательно' });
  }

  const cleanCode = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanName = name.trim();

  try {
    const existing = await getAsync(`SELECT id FROM permissions WHERE code = ? COLLATE NOCASE`, [cleanCode]);
    if (existing) {
      return res.status(409).json({ success: false, error: `Право доступа с кодом «${cleanCode}» уже существует` });
    }

    const result = await runAsync(`
      INSERT INTO permissions (code, name, description, badge_color, is_system)
      VALUES (?, ?, ?, ?, 0)
    `, [
      cleanCode,
      cleanName,
      (description && description.trim()) || null,
      badge_color || '#0F3C64'
    ]);

    res.status(201).json({
      success: true,
      message: `Право доступа «${cleanName}» успешно создано`,
      permissionId: result.lastID
    });
  } catch (err) {
    console.error('[Permissions API] Error creating permission:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/permissions/:id
 * Updates permission type (code can only be changed if not a system permission)
 */
router.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { code, name, description, badge_color } = req.body || {};

  try {
    const existing = await getAsync(`SELECT * FROM permissions WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Тип прав не найден' });
    }

    let finalCode = existing.code;
    if (code && code.trim() && code.trim().toLowerCase() !== existing.code.toLowerCase()) {
      if (existing.is_system === 1) {
        return res.status(400).json({ success: false, error: 'Нельзя изменять системный код встроенного типа прав' });
      }
      finalCode = code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

      const conflict = await getAsync(`SELECT id FROM permissions WHERE code = ? COLLATE NOCASE AND id != ?`, [finalCode, id]);
      if (conflict) {
        return res.status(409).json({ success: false, error: `Код «${finalCode}» уже занят другим правом доступа` });
      }
    }

    const finalName = (name && name.trim()) || existing.name;
    const finalDesc = description !== undefined ? (description ? description.trim() : null) : existing.description;
    const finalColor = badge_color || existing.badge_color;

    await runAsync(`
      UPDATE permissions SET
        code = ?,
        name = ?,
        description = ?,
        badge_color = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `, [finalCode, finalName, finalDesc, finalColor, id]);

    res.json({
      success: true,
      message: `Право доступа «${finalName}» успешно обновлено`
    });
  } catch (err) {
    console.error('[Permissions API] Error updating permission:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/permissions/:id
 * Deletes custom permission type (disallowed for system permissions or if assigned to users)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await getAsync(`SELECT * FROM permissions WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Тип прав не найден' });
    }

    if (existing.is_system === 1) {
      return res.status(400).json({
        success: false,
        error: `Нельзя удалить встроенное системное право доступа «${existing.name}» (${existing.code}).`
      });
    }

    // Check if any users have this permission
    const countRow = await getAsync(`SELECT COUNT(*) as count FROM user_permissions WHERE permission_id = ?`, [id]);
    if (countRow && countRow.count > 0) {
      return res.status(400).json({
        success: false,
        error: `Нельзя удалить право «${existing.name}», так как оно назначено ${countRow.count} пользователям. Сначала снимите это право у пользователей.`
      });
    }

    await runAsync(`DELETE FROM permissions WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: `Право доступа «${existing.name}» удалено`
    });
  } catch (err) {
    console.error('[Permissions API] Error deleting permission:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
