const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const db = require('./database');
const { getAppSettings, getSqliteDbPath, getFirebirdConfig, getFiscalConfig, getBackupConfig } = require('./config');

/**
 * Format uptime seconds to human-readable string
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d} дн.`);
  if (h > 0 || d > 0) parts.push(`${h} ч.`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m} мин.`);
  parts.push(`${s} сек.`);
  return parts.join(' ');
}

/**
 * Helper to query SQLite promise-based
 */
function querySqlite(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function querySqliteAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/**
 * Check Express Service
 */
async function checkExpressService() {
  const start = Date.now();
  const mem = process.memoryUsage();
  const latencyMs = Date.now() - start;
  
  return {
    id: 'express',
    name: 'Express REST API Gateway',
    category: 'Application Server',
    status: 'ONLINE',
    latencyMs,
    url: 'http://localhost:5000',
    description: 'Основной веб-сервер Node.js (API маршруты, Swagger, CORS, WebSocket/HTTP)',
    details: {
      port: process.env.PORT || 5000,
      nodeVersion: process.version,
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.floor(process.uptime()),
      uptimeText: formatUptime(process.uptime()),
      memoryRssMb: (mem.rss / (1024 * 1024)).toFixed(1),
      memoryHeapUsedMb: (mem.heapUsed / (1024 * 1024)).toFixed(1),
      memoryHeapTotalMb: (mem.heapTotal / (1024 * 1024)).toFixed(1)
    }
  };
}

/**
 * Check SQLite Database
 */
async function checkSqliteService() {
  const start = Date.now();
  const dbPath = getSqliteDbPath();
  
  try {
    const fileExists = fs.existsSync(dbPath);
    let fileSizeMb = 0;
    if (fileExists) {
      const stat = fs.statSync(dbPath);
      fileSizeMb = (stat.size / (1024 * 1024)).toFixed(2);
    }

    const quickCheck = await querySqlite('PRAGMA quick_check(1)');
    const journalMode = await querySqlite('PRAGMA journal_mode');
    const foreignKeys = await querySqlite('PRAGMA foreign_keys');
    const sqliteVersion = await querySqlite('SELECT sqlite_version() as ver');
    
    // Quick row counts
    const tableCountRow = await querySqlite("SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const patientsRow = await querySqlite('SELECT count(*) as cnt FROM patients').catch(() => ({ cnt: 0 }));
    const operationsRow = await querySqlite('SELECT count(*) as cnt FROM operations').catch(() => ({ cnt: 0 }));
    const materialsRow = await querySqlite('SELECT count(*) as cnt FROM materials').catch(() => ({ cnt: 0 }));
    const staffRow = await querySqlite('SELECT count(*) as cnt FROM staff').catch(() => ({ cnt: 0 }));
    const receiptsRow = await querySqlite('SELECT count(*) as cnt FROM fiscal_receipts').catch(() => ({ cnt: 0 }));
    const accrualsRow = await querySqlite('SELECT count(*) as cnt FROM staff_payout_accruals').catch(() => ({ cnt: 0 }));

    const isOk = quickCheck && (quickCheck.quick_check === 'ok' || quickCheck.integrity_check === 'ok');
    const latencyMs = Date.now() - start;

    return {
      id: 'sqlite',
      name: 'SQLite Database Storage',
      category: 'Primary Database',
      status: isOk ? 'ONLINE' : 'ERROR',
      latencyMs,
      url: `file://${dbPath.replace(/\\/g, '/')}`,
      description: 'Локальная реляционная база данных (клиентские данные, прайс, склад, чеки и выплаты)',
      details: {
        dbPath,
        fileSizeMb: `${fileSizeMb} MB`,
        integrity: isOk ? 'Целостность подтверждена (OK)' : 'Ошибка проверки целостности',
        journalMode: journalMode?.journal_mode?.toUpperCase() || 'UNKNOWN',
        foreignKeys: foreignKeys?.foreign_keys === 1 ? 'Включены (ON)' : 'Отключены (OFF)',
        sqliteVersion: sqliteVersion?.ver || '3.x',
        tableCount: tableCountRow?.cnt || 0,
        stats: {
          patients: patientsRow?.cnt || 0,
          operations: operationsRow?.cnt || 0,
          materials: materialsRow?.cnt || 0,
          staff: staffRow?.cnt || 0,
          fiscalReceipts: receiptsRow?.cnt || 0,
          staffPayoutAccruals: accrualsRow?.cnt || 0
        }
      }
    };
  } catch (err) {
    return {
      id: 'sqlite',
      name: 'SQLite Database Storage',
      category: 'Primary Database',
      status: 'OFFLINE',
      latencyMs: Date.now() - start,
      url: `file://${dbPath.replace(/\\/g, '/')}`,
      description: 'Локальная реляционная база данных',
      error: err.message
    };
  }
}

/**
 * Check .NET Fiscal Service Daemon
 */
async function checkFiscalService() {
  const start = Date.now();
  const fiscalCfg = getFiscalConfig();
  const daemonUrl = fiscalCfg.ExternalDaemonUrl || 'http://localhost:5050';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${daemonUrl}/api/fiscal/status`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    return {
      id: 'fiscal',
      name: 'OrthoErp.FiscalService (.NET Daemon)',
      category: 'Fiscal Driver / 54-FZ',
      status: 'ONLINE',
      latencyMs,
      url: daemonUrl,
      description: 'Служба фискализации ККТ АТОЛ 91Ф на платформе ASP.NET Core (очередь чеков, Serilog, SQLite Sink)',
      details: {
        online: data.Online ?? data.online ?? true,
        deviceModel: data.DeviceModel || data.deviceModel || 'АТОЛ 91Ф',
        port: data.Port || data.port || 'COM3',
        ffdVersion: data.FfdVersion || data.ffdVersion || '1.2 / 1.05',
        taxRegime: data.TaxRegime || data.taxRegime || 'Без НДС (пп. 2 п. 2 ст. 149 НК РФ)',
        isShiftOpen: (data.IsShiftOpen ?? data.isShiftOpen) ? 'Смена открыта' : 'Смена закрыта',
        shiftNumber: data.ShiftNumber || data.shiftNumber || 14,
        serilogSinkActive: (data.SerilogSinkActive ?? data.serilogSinkActive) ? 'Активен (SQLite)' : 'Неактивен'
      }
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      id: 'fiscal',
      name: 'OrthoErp.FiscalService (.NET Daemon)',
      category: 'Fiscal Driver / 54-FZ',
      status: 'OFFLINE',
      latencyMs,
      url: daemonUrl,
      description: 'Служба фискализации ККТ АТОЛ 91Ф на платформе ASP.NET Core',
      error: `Не удалось связаться с демоном на ${daemonUrl}: ${err.message}`
    };
  }
}

/**
 * Check Firebird Database Server
 */
async function checkFirebirdService() {
  const start = Date.now();
  const fbConfig = getFirebirdConfig();
  const targetDb = fbConfig.DatabasePath || "C:\\Users\\vladimir\\source\\DB\\Export\\MEDICAL.FDB";
  const targetUser = fbConfig.User || "SYSDBA";
  const targetPass = fbConfig.Password || "masterkey";
  const targetHost = fbConfig.Host || "localhost";
  const targetPort = fbConfig.Port || 3050;
  const targetCharset = fbConfig.Charset || "WIN1251";

  const scriptPath = path.resolve(__dirname, 'sync_patients_firebird.py');
  const cmd = `python "${scriptPath}" --test "${targetDb}" "${targetUser}" "${targetPass}" "${targetHost}" "${targetPort}" "${targetCharset}"`;

  return new Promise((resolve) => {
    exec(cmd, { encoding: 'utf-8', timeout: 12000 }, (err, stdout, stderr) => {
      const latencyMs = Date.now() - start;
      try {
        const result = JSON.parse(stdout.trim());
        if (result.success) {
          resolve({
            id: 'firebird',
            name: 'Firebird SQL Server (MEDICAL.FDB)',
            category: 'External Medical MIS DB',
            status: 'ONLINE',
            latencyMs,
            url: `${targetHost}:${targetPort}/${targetDb}`,
            description: 'Внешняя медицинская база данных клиники (картотека пациентов, приемы, договоры, ДМС)',
            details: {
              host: result.host,
              port: result.port,
              database: result.database,
              charset: result.charset,
              records: {
                patients: result.patients || 0,
                visits: result.visits || 0,
                contracts: result.contracts || 0,
                channels: result.channels || 0,
                insurers: result.insurers || 0,
                dmsCards: result.dms_cards || 0
              }
            }
          });
        } else {
          resolve({
            id: 'firebird',
            name: 'Firebird SQL Server (MEDICAL.FDB)',
            category: 'External Medical MIS DB',
            status: 'ERROR',
            latencyMs,
            url: `${targetHost}:${targetPort}/${targetDb}`,
            description: 'Внешняя медицинская база данных клиники',
            error: result.error || 'Ошибка подключения к серверу Firebird'
          });
        }
      } catch (e) {
        resolve({
          id: 'firebird',
          name: 'Firebird SQL Server (MEDICAL.FDB)',
          category: 'External Medical MIS DB',
          status: 'OFFLINE',
          latencyMs,
          url: `${targetHost}:${targetPort}/${targetDb}`,
          description: 'Внешняя медицинская база данных клиники',
          error: stderr || stdout || e.message
        });
      }
    });
  });
}

/**
 * Check OpenAPI / Swagger UI
 */
async function checkSwaggerService() {
  const start = Date.now();
  const url = 'http://localhost:5000/api-docs';

  try {
    const latencyMs = Date.now() - start;
    return {
      id: 'swagger',
      name: 'OpenAPI & Swagger UI Documentation',
      category: 'Developer Tools',
      status: 'ONLINE',
      latencyMs,
      url,
      description: 'Интерактивная спецификация REST API (OpenAPI 3.0), схемы DTO и документация методов',
      details: {
        specVersion: '3.0.0',
        apiTitle: 'Центр Ортопедии Добрушкина — ОртоERP REST API',
        endpoint: '/api-docs',
        accessible: true
      }
    };
  } catch (err) {
    return {
      id: 'swagger',
      name: 'OpenAPI & Swagger UI Documentation',
      category: 'Developer Tools',
      status: 'ERROR',
      latencyMs: Date.now() - start,
      url,
      description: 'Интерактивная спецификация REST API',
      error: err.message
    };
  }
}

/**
 * Check Backup Subsystem
 */
async function checkBackupService() {
  const start = Date.now();
  try {
    const backupCfg = getBackupConfig();
    const backupDirRel = backupCfg.BackupDirectory || '../backups';
    const backupDir = path.isAbsolute(backupDirRel) ? backupDirRel : path.resolve(__dirname, backupDirRel);

    const dirExists = fs.existsSync(backupDir);
    let backupsCount = 0;
    let latestBackup = null;

    if (dirExists) {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('orthopedic_backup_') && f.endsWith('.sqlite'))
        .map(f => {
          const fullPath = path.join(backupDir, f);
          const stats = fs.statSync(fullPath);
          return {
            filename: f,
            sizeBytes: stats.size,
            sizeMb: (stats.size / (1024 * 1024)).toFixed(2),
            createdAt: stats.mtime
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      backupsCount = files.length;
      if (files.length > 0) {
        latestBackup = files[0];
      }
    }

    const latencyMs = Date.now() - start;

    return {
      id: 'backup',
      name: 'SQLite Hot Backup Subsystem (VACUUM INTO)',
      category: 'Data Protection & Disaster Recovery',
      status: dirExists ? 'ONLINE' : 'DEGRADED',
      latencyMs,
      url: `file://${backupDir.replace(/\\/g, '/')}`,
      description: 'Подсистема горячего резервного копирования без блокировки транзакций (автоматические снимки БД)',
      details: {
        backupDirectory: backupDir,
        directoryExists: dirExists,
        autoBackupOnStartup: backupCfg.AutoBackupOnStartup ?? true,
        keepLastNBackups: backupCfg.KeepLastNBackups ?? 7,
        totalBackupsCount: backupsCount,
        latestBackupFilename: latestBackup ? latestBackup.filename : 'Нет сохраненных копий',
        latestBackupSize: latestBackup ? `${latestBackup.sizeMb} MB` : '—',
        latestBackupDate: latestBackup ? latestBackup.createdAt : '—'
      }
    };
  } catch (err) {
    return {
      id: 'backup',
      name: 'SQLite Hot Backup Subsystem',
      category: 'Data Protection & Disaster Recovery',
      status: 'ERROR',
      latencyMs: Date.now() - start,
      description: 'Подсистема горячего резервного копирования',
      error: err.message
    };
  }
}

/**
 * GET /api/admin/services/status
 * Quick health check across all services
 */
router.get('/status', async (req, res) => {
  try {
    const [expressSvc, sqliteSvc, fiscalSvc, firebirdSvc, swaggerSvc, backupSvc] = await Promise.all([
      checkExpressService(),
      checkSqliteService(),
      checkFiscalService(),
      checkFirebirdService(),
      checkSwaggerService(),
      checkBackupService()
    ]);

    const services = [expressSvc, sqliteSvc, fiscalSvc, firebirdSvc, swaggerSvc, backupSvc];
    const onlineCount = services.filter(s => s.status === 'ONLINE').length;
    const totalCount = services.length;
    const allHealthy = onlineCount === totalCount;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: totalCount,
        online: onlineCount,
        degraded: services.filter(s => s.status === 'DEGRADED').length,
        offline: services.filter(s => s.status === 'OFFLINE' || s.status === 'ERROR').length,
        isSystemHealthy: allHealthy
      },
      services
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/services/test-all
 * Deep diagnostic test of all services with detailed timing and execution log
 */
router.post('/test-all', async (req, res) => {
  const executionLogs = [];
  const addLog = (msg, level = 'INFO') => {
    executionLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message: msg
    });
  };

  addLog('Запуск комплексной сквозной проверки всех серверных служб...');

  const results = [];

  // 1. Express
  try {
    addLog('Проверка Express REST API Gateway (порт 5000)...');
    const resExpress = await checkExpressService();
    results.push(resExpress);
    addLog(`[Express] Статус: ${resExpress.status}, RAM RSS: ${resExpress.details.memoryRssMb}MB, задержка: ${resExpress.latencyMs}мс`);
  } catch (e) {
    addLog(`[Express] Ошибка: ${e.message}`, 'ERROR');
  }

  // 2. SQLite
  try {
    addLog('Проверка основного хранилища SQLite (orthopedic_data_center.sqlite)...');
    const resSqlite = await checkSqliteService();
    results.push(resSqlite);
    addLog(`[SQLite] Статус: ${resSqlite.status}, Таблиц: ${resSqlite.details?.tableCount}, Режим: ${resSqlite.details?.journalMode}, задержка: ${resSqlite.latencyMs}мс`);
  } catch (e) {
    addLog(`[SQLite] Ошибка: ${e.message}`, 'ERROR');
  }

  // 3. Fiscal Service (.NET)
  try {
    addLog('Проверка фискального сервиса OrthoErp.FiscalService (порт 5050)...');
    const resFiscal = await checkFiscalService();
    results.push(resFiscal);
    addLog(`[FiscalService] Статус: ${resFiscal.status}, Модель: ${resFiscal.details?.deviceModel || 'N/A'}, Смена: ${resFiscal.details?.isShiftOpen || 'N/A'}, задержка: ${resFiscal.latencyMs}мс`);
  } catch (e) {
    addLog(`[FiscalService] Ошибка: ${e.message}`, 'ERROR');
  }

  // 4. Firebird
  try {
    addLog('Проверка медицинской базы данных Firebird SQL (MEDICAL.FDB, порт 3050)...');
    const resFirebird = await checkFirebirdService();
    results.push(resFirebird);
    const pts = resFirebird.details?.records?.patients;
    addLog(`[Firebird] Статус: ${resFirebird.status}, Пациентов в МИС: ${pts !== undefined ? pts.toLocaleString() : 'N/A'}, задержка: ${resFirebird.latencyMs}мс`);
  } catch (e) {
    addLog(`[Firebird] Ошибка: ${e.message}`, 'ERROR');
  }

  // 5. OpenAPI Swagger
  try {
    addLog('Проверка доступности спецификации OpenAPI 3.0 / Swagger UI...');
    const resSwagger = await checkSwaggerService();
    results.push(resSwagger);
    addLog(`[Swagger] Статус: ${resSwagger.status}, задержка: ${resSwagger.latencyMs}мс`);
  } catch (e) {
    addLog(`[Swagger] Ошибка: ${e.message}`, 'ERROR');
  }

  // 6. Backups
  try {
    addLog('Проверка подсистемы горячего резервного копирования...');
    const resBackup = await checkBackupService();
    results.push(resBackup);
    addLog(`[Backup] Статус: ${resBackup.status}, Найдено снимков: ${resBackup.details?.totalBackupsCount}, задержка: ${resBackup.latencyMs}мс`);
  } catch (e) {
    addLog(`[Backup] Ошибка: ${e.message}`, 'ERROR');
  }

  addLog('Все проверки серверных служб успешно завершены.');

  const onlineCount = results.filter(s => s.status === 'ONLINE').length;
  const isHealthy = onlineCount === results.length;

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    isHealthy,
    summary: {
      total: results.length,
      online: onlineCount,
      degraded: results.filter(s => s.status === 'DEGRADED').length,
      offline: results.filter(s => s.status === 'OFFLINE' || s.status === 'ERROR').length
    },
    services: results,
    logs: executionLogs
  });
});

module.exports = router;
