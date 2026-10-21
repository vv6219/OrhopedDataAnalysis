/**
 * menuConfigRoutes.js
 * API эндпоинты для безопасного управления, валидации и обновления menuPermissionsConfig.json
 * Доступ строго ограничен системными администраторами (sysadmin).
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('./auth');
const { validateMenuIntegrity } = require('./validators/menuIntegrityValidator');

// Путь к центральному файлу конфигурации
const CONFIG_FILE_PATH = path.resolve(__dirname, '../client/src/config/menuPermissionsConfig.json');
const BACKUPS_DIR = path.resolve(__dirname, './backups/menu-permissions');

/**
 * Middleware: Требует наличие прав системного администратора (sysadmin)
 */
function requireSysadmin(req, res, next) {
  requireAuth(req, res, () => {
    const user = req.user || {};
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];

    const isSysadmin =
      permissions.includes('sysadmin') ||
      user.role === 'sysadmin' ||
      user.role === 'admin' ||
      (Array.isArray(user.permissionCodes) && user.permissionCodes.includes('sysadmin'));

    if (!isSysadmin) {
      return res.status(403).json({
        success: false,
        error: 'Доступ запрещен: операция доступна исключительно пользователям с ролью системного администратора (sysadmin)'
      });
    }

    next();
  });
}

/**
 * Утилита: Ротация резервных копий (хранить не более maxBackups последних файлов)
 */
async function rotateBackups(backupDir, maxBackups = 30) {
  try {
    if (!fs.existsSync(backupDir)) return;
    const files = await fs.promises.readdir(backupDir);
    const backupFiles = files
      .filter(f => f.startsWith('menuPermissionsConfig_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);

    if (backupFiles.length > maxBackups) {
      const toDelete = backupFiles.slice(maxBackups);
      for (const item of toDelete) {
        await fs.promises.unlink(item.path).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[MenuConfigRoutes] Ошибка ротации бэкапов:', err);
  }
}

/**
 * GET /api/menu-permissions/config
 * Получить текущую конфигурацию menuPermissionsConfig.json
 */
router.get('/config', requireSysadmin, async (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      return res.status(404).json({
        success: false,
        error: 'Файл конфигурации menuPermissionsConfig.json не найден на сервере'
      });
    }

    const rawContent = await fs.promises.readFile(CONFIG_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(rawContent);

    // Валидация текущего файла
    const validation = validateMenuIntegrity(parsed);

    res.json({
      success: true,
      config: parsed,
      validation,
      filePath: CONFIG_FILE_PATH
    });
  } catch (err) {
    console.error('[MenuConfigRoutes] Ошибка чтения конфигурации:', err);
    res.status(500).json({
      success: false,
      error: 'Ошибка при чтении файла конфигурации: ' + err.message
    });
  }
});

/**
 * POST /api/menu-permissions/validate
 * Проверить валидность целостности без сохранения на диск
 */
router.post('/validate', requireSysadmin, (req, res) => {
  try {
    const candidateConfig = req.body;
    const validation = validateMenuIntegrity(candidateConfig);

    res.json({
      success: true,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      summary: validation.summary
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      isValid: false,
      errors: ['Ошибка синтаксиса тела запроса: ' + err.message]
    });
  }
});

/**
 * PUT /api/menu-permissions/config
 * Сохранить обновленную конфигурацию с обязательной проверкой целостности,
 * созданием резервной копии и двухфазной атомарной записью
 */
router.put('/config', requireSysadmin, async (req, res) => {
  try {
    const newConfig = req.body;

    // 1. Обязательная проверка целостности (Mandatory Integrity Validation)
    const validation = validateMenuIntegrity(newConfig);
    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        error: 'Сохранение отклонено: обнаружены критические нарушения целостности конфигурации',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // 2. Создание директории резервных копий
    if (!fs.existsSync(BACKUPS_DIR)) {
      await fs.promises.mkdir(BACKUPS_DIR, { recursive: true });
    }

    // 3. Создание снимка текущего рабочего файла (Rolling Backup)
    let backupFileName = null;
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const nowStr = new Date().toISOString().replace(/[:.]/g, '-');
      backupFileName = `menuPermissionsConfig_${nowStr}.json`;
      const backupPath = path.join(BACKUPS_DIR, backupFileName);
      await fs.promises.copyFile(CONFIG_FILE_PATH, backupPath);
    }

    // 4. Двухфазная атомарная запись через .tmp файл
    const formattedJson = JSON.stringify(newConfig, null, 2) + '\n';
    const tmpFilePath = `${CONFIG_FILE_PATH}.tmp`;

    await fs.promises.writeFile(tmpFilePath, formattedJson, 'utf-8');
    await fs.promises.rename(tmpFilePath, CONFIG_FILE_PATH);

    // 5. Ротация старых резервных копий
    await rotateBackups(BACKUPS_DIR, 30);

    console.log(`[MenuConfigRoutes] Конфигурация успешно обновлена пользователем ${req.user.user || req.user.username}. Создан бэкап: ${backupFileName}`);

    res.json({
      success: true,
      message: 'Конфигурация меню и прав успешно проверена и сохранена',
      backupCreated: backupFileName,
      warnings: validation.warnings,
      summary: validation.summary
    });
  } catch (err) {
    console.error('[MenuConfigRoutes] Критическая ошибка сохранения конфигурации:', err);
    res.status(500).json({
      success: false,
      error: 'Ошибка при сохранении конфигурации: ' + err.message
    });
  }
});

/**
 * GET /api/menu-permissions/backups
 * Список созданных резервных копий
 */
router.get('/backups', requireSysadmin, async (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ success: true, backups: [] });
    }

    const files = await fs.promises.readdir(BACKUPS_DIR);
    const backups = files
      .filter(f => f.startsWith('menuPermissionsConfig_') && f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(BACKUPS_DIR, f);
        const stats = fs.statSync(fullPath);
        return {
          filename: f,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString(),
          timestampMs: stats.mtimeMs
        };
      })
      .sort((a, b) => b.timestampMs - a.timestampMs);

    res.json({
      success: true,
      backups
    });
  } catch (err) {
    console.error('[MenuConfigRoutes] Ошибка получения списка бэкапов:', err);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения списка бэкапов: ' + err.message
    });
  }
});

/**
 * POST /api/menu-permissions/restore-backup
 * Восстановить конфигурацию из выбранного бэкапа
 */
router.post('/restore-backup', requireSysadmin, async (req, res) => {
  try {
    const { filename } = req.body || {};
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ success: false, error: 'Имя файла бэкапа не указано' });
    }

    // Защита от path traversal
    const safeFilename = path.basename(filename);
    const backupPath = path.join(BACKUPS_DIR, safeFilename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, error: 'Резервная копия не найдена: ' + safeFilename });
    }

    const backupContent = await fs.promises.readFile(backupPath, 'utf-8');
    const parsedBackup = JSON.parse(backupContent);

    // Валидация бэкапа перед восстановлением
    const validation = validateMenuIntegrity(parsedBackup);
    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        error: 'Резервная копия повреждена и не проходит валидацию целостности',
        errors: validation.errors
      });
    }

    // Создаем аварийный снимок перед откатом
    const emergencyStr = new Date().toISOString().replace(/[:.]/g, '-');
    const emergencyBackup = path.join(BACKUPS_DIR, `menuPermissionsConfig_pre_restore_${emergencyStr}.json`);
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      await fs.promises.copyFile(CONFIG_FILE_PATH, emergencyBackup);
    }

    // Атомарно восстанавливаем
    const tmpFilePath = `${CONFIG_FILE_PATH}.tmp`;
    await fs.promises.writeFile(tmpFilePath, backupContent, 'utf-8');
    await fs.promises.rename(tmpFilePath, CONFIG_FILE_PATH);

    res.json({
      success: true,
      message: `Конфигурация успешно восстановлена из ${safeFilename}`,
      restoredFrom: safeFilename,
      emergencyBackupCreated: path.basename(emergencyBackup)
    });
  } catch (err) {
    console.error('[MenuConfigRoutes] Ошибка отката к бэкапу:', err);
    res.status(500).json({
      success: false,
      error: 'Ошибка восстановления из резервной копии: ' + err.message
    });
  }
});

module.exports = router;
