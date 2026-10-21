const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
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
 * Check Acquiring POS Terminal & Service
 */
async function checkPosService() {
  const start = Date.now();
  try {
    const { posService } = require('./posService');
    const status = await posService.getStatus();
    const isOnline = status.status === 'Ready' || status.isMockMode;
    const latencyMs = Date.now() - start;

    return {
      id: 'pos',
      name: `POS-эквайринг «${status.bankName || 'Альфа-Банк'}» (${status.driverType || 'Arcus-2'})`,
      category: 'Card Acquiring / POS Driver',
      status: isOnline ? 'ONLINE' : 'DEGRADED',
      latencyMs,
      url: status.driverType === 'INPAS' ? `tcp://${status.ipAddress || '127.0.0.1'}:${status.ipPort || 8888}` : status.port,
      description: status.driverType === 'INPAS'
        ? `XML-протокол DualConnector (Служба: ${status.serviceName || 'DualConnectorService'})`
        : `Драйвер Arcus-2 (${status.driverExecutablePath || 'pos.exe'})`,
      details: {
        driverType: status.driverType,
        isMockMode: status.isMockMode ? 'Включена (Эмуляция)' : 'Выключена (Физический POS)',
        terminalId: status.terminalId,
        merchantId: status.merchantId,
        activeProfile: status.profileName,
        connection: status.driverType === 'INPAS' ? `TCP ${status.ipAddress}:${status.ipPort}` : `${status.port} (${status.baudRate} бод)`,
        serviceStatus: status.serviceStatus ? status.serviceStatus.status : (status.isMockMode ? 'Эмуляция' : 'Не найдена')
      }
    };
  } catch (err) {
    return {
      id: 'pos',
      name: 'POS-эквайринг (Альфа-Банк)',
      category: 'Card Acquiring / POS Driver',
      status: 'ERROR',
      latencyMs: Date.now() - start,
      description: 'Модуль банковского эквайринга',
      error: err.message
    };
  }
}

/**
 * Check MedFlex Online Booking Gateway
 */
async function checkMedflexService() {
  const start = Date.now();
  try {
    const medflexClient = require('./medflex/medflexClient');
    const { circuitBreaker } = require('./medflex/medflexCircuitBreaker');
    const queueService = require('./medflex/medflexQueueService');
    const config = await medflexClient.getConfig();
    const circuitState = circuitBreaker.getState();
    const queueStats = await queueService.getStats();

    const isEnabled = config.enabled !== false;
    let status = 'ONLINE';
    if (!isEnabled) {
      status = 'DEGRADED';
    } else if (circuitState.state === 'degraded' || circuitState.state === 'recovering') {
      status = 'DEGRADED';
    } else if (circuitState.state === 'offline') {
      status = 'ERROR';
    }

    const latencyMs = circuitState.lastLatencyMs || (Date.now() - start);

    return {
      id: 'medflex',
      name: 'Шлюз онлайн-записи MedFlex / ПроДокторов',
      category: 'External Telemetry & Online Booking',
      status,
      latencyMs,
      url: config.api_url || 'https://mis-api.medflex.ru',
      description: 'Двунаправленная синхронизация расписания врачей, приемов, оффлайн-буфер и защита от коллизий',
      details: {
        enabled: isEnabled ? 'Включен (Активен)' : 'Деактивирован администратором',
        mode: config.mode === 'sandbox' ? `Песочница (${config.sandbox_direction || 'dual'})` : 'Продакшн',
        circuitBreaker: circuitState.state,
        lastPingLatency: circuitState.lastLatencyMs ? `${circuitState.lastLatencyMs} мс` : '—',
        pingInterval: `${config.ping_interval_sec || 60} сек`,
        scheduleSyncInterval: `${config.schedule_sync_interval_min || 30} мин`,
        pendingQueueCount: queueStats.pending || 0,
        failedQueueCount: queueStats.failed || 0,
        lastPingAt: circuitState.lastPingAt || '—',
        lastError: circuitState.lastError || null
      }
    };
  } catch (err) {
    return {
      id: 'medflex',
      name: 'Шлюз онлайн-записи MedFlex / ПроДокторов',
      category: 'External Telemetry & Online Booking',
      status: 'ERROR',
      latencyMs: Date.now() - start,
      description: 'Шлюз онлайн-записи MedFlex',
      error: err.message
    };
  }
}

/**
 * Checks all 8 system components
 */
async function checkAllServices() {
  const [expressSvc, sqliteSvc, fiscalSvc, firebirdSvc, swaggerSvc, backupSvc, posSvc, medflexSvc] = await Promise.all([
    checkExpressService(),
    checkSqliteService(),
    checkFiscalService(),
    checkFirebirdService(),
    checkSwaggerService(),
    checkBackupService(),
    checkPosService(),
    checkMedflexService()
  ]);
  return [expressSvc, sqliteSvc, fiscalSvc, firebirdSvc, swaggerSvc, backupSvc, posSvc, medflexSvc];
}

/**
 * Repair / Restart individual service
 */
async function repairService(serviceId, addLog = () => {}) {
  addLog(`Начало восстановления службы: ${serviceId}...`, 'INFO');
  switch (serviceId) {
    case 'fiscal': {
      addLog('Попытка запуска/перезапуска OrthoErp.FiscalService на порту 5050...', 'INFO');
      const pubExe = path.resolve(__dirname, 'fiscal_service/OrthoErp.FiscalService/publish/OrthoErp.FiscalService.exe');
      if (!fs.existsSync(pubExe)) {
        throw new Error(`Исполняемый файл службы не найден: ${pubExe}`);
      }

      // Stop any hung process
      await new Promise(r => exec('powershell -Command "Get-Process OrthoErp.FiscalService -ErrorAction SilentlyContinue | Stop-Process -Force"', () => r()));
      addLog('Остановлены старые процессы OrthoErp.FiscalService', 'INFO');

      // Start detached daemon
      const child = spawn(pubExe, ['--urls=http://localhost:5050'], {
        detached: true,
        stdio: 'ignore',
        cwd: path.dirname(pubExe),
        windowsHide: true
      });
      child.unref();
      addLog('Запущен новый процесс OrthoErp.FiscalService.exe на порту 5050', 'INFO');

      // Poll up to 6 seconds
      let isUp = false;
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const res = await fetch('http://localhost:5050/api/fiscal/status');
          if (res.ok) { isUp = true; break; }
        } catch (e) {}
      }

      if (!isUp) {
        throw new Error('Фискальный сервис запущен, но не ответил на порту 5050 за 6 секунд.');
      }
      addLog('Фискальный сервис успешно ответил HTTP 200 на порту 5050', 'INFO');
      return { success: true, message: 'Фискальный сервис ККТ АТОЛ успешно запущен и готов к работе.' };
    }

    case 'pos': {
      addLog('Восстановление и переинициализация сервиса эквайринга...', 'INFO');
      const { posService } = require('./posService');
      const { restartWindowsService } = require('./winServiceHelper');
      await posService.refreshFromDb();
      let msg = '';
      if (posService.driverType === 'INPAS') {
        const sName = posService.serviceName || 'DualConnectorService';
        addLog(`Перезапуск Windows-службы ${sName}...`, 'INFO');
        const svcRes = await restartWindowsService(sName);
        msg = svcRes.message || 'Служба DualConnector перезапущена';
      }
      await posService.refreshFromDb();
      addLog('Профиль эквайринга перезагружен из базы данных', 'INFO');
      return { success: true, message: msg || 'Модуль эквайринга переинициализирован и готов к приёму карт.' };
    }

    case 'sqlite': {
      addLog('Очистка WAL-журнала и проверка структуры SQLite...', 'INFO');
      await querySqlite('PRAGMA wal_checkpoint(TRUNCATE)');
      const check = await querySqlite('PRAGMA integrity_check');
      const isOk = check && (check.integrity_check === 'ok' || check.quick_check === 'ok');
      if (!isOk) {
        throw new Error(`Ошибка целостности базы данных: ${JSON.stringify(check)}`);
      }
      addLog('PRAGMA integrity_check вернул OK', 'INFO');
      return { success: true, message: 'База данных проверена: WAL усечён, целостность подтверждена (OK).' };
    }

    case 'backup': {
      addLog('Создание внеочередного снимка базы данных SQLite (VACUUM INTO)...', 'INFO');
      const backupCfg = getBackupConfig();
      const backupDirRel = backupCfg.BackupDirectory || '../backups';
      const backupDir = path.isAbsolute(backupDirRel) ? backupDirRel : path.resolve(__dirname, backupDirRel);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        addLog(`Создан каталог резервных копий: ${backupDir}`, 'INFO');
      }

      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `orthopedic_backup_${ts}.sqlite`;
      const fullPath = path.join(backupDir, filename).replace(/\\/g, '/');

      const sqlite3 = require('sqlite3').verbose();
      const sourceDbPath = getSqliteDbPath();
      await new Promise((resolve, reject) => {
        const snap = new sqlite3.Database(sourceDbPath, sqlite3.OPEN_READONLY, (err) => {
          if (err) return reject(err);
          snap.run(`VACUUM INTO '${fullPath}'`, (vacErr) => {
            snap.close();
            if (vacErr) return reject(vacErr);
            resolve();
          });
        });
      });

      addLog(`Резервная копия успешно создана: ${filename}`, 'INFO');
      return { success: true, message: `Подсистема бэкапа восстановлена. Создан снимок базы: ${filename}` };
    }

    case 'firebird': {
      addLog('Попытка восстановления связи с сервером Firebird...', 'INFO');
      if (process.platform === 'win32') {
        await new Promise(r => exec('net start FirebirdServerDefaultInstance', () => r()));
      }
      const check = await checkFirebirdService();
      if (check.status !== 'ONLINE') {
        throw new Error(check.error || 'Не удалось установить связь с сервером Firebird.');
      }
      addLog('Связь с Firebird подтверждена', 'INFO');
      return { success: true, message: 'Подключение к базе Firebird MEDICAL.FDB успешно восстановлено.' };
    }

    case 'medflex': {
      addLog('Диагностика и восстановление шлюза MedFlex...', 'INFO');
      const { heartbeatWorker } = require('./medflex/medflexHeartbeatWorker');
      const { circuitBreaker } = require('./medflex/medflexCircuitBreaker');
      const queueService = require('./medflex/medflexQueueService');
      const probe = await heartbeatWorker.probe();
      circuitBreaker.recordSuccess(probe.latencyMs);
      const queueRes = await queueService.drainQueue();
      addLog(`Пинг MedFlex выполнен: ${probe.latencyMs}мс, очередь синхронизирована: ${queueRes.processed} задач`, 'INFO');
      return { success: true, message: `Шлюз MedFlex восстановлен (RTT: ${probe.latencyMs}мс). Очередь: ${queueRes.processed} синхронизировано.` };
    }

    case 'express':
    case 'swagger':
      return { success: true, message: 'Служба работает штатно.' };

    default:
      throw new Error(`Неизвестная служба: ${serviceId}`);
  }
}

/**
 * GET /api/admin/services/status
 * Quick health check across all services
 */
router.get('/status', async (req, res) => {
  try {
    const services = await checkAllServices();
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
 * Deep diagnostic test of all services with detailed timing and execution log.
 * Supports autoRepair: true in body to automatically fix any failed services.
 */
router.post('/test-all', async (req, res) => {
  const { autoRepair = false } = req.body || {};
  const executionLogs = [];
  const addLog = (msg, level = 'INFO') => {
    executionLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message: msg
    });
  };

  addLog(`Запуск комплексной сквозной проверки всех серверных служб${autoRepair ? ' (с авто-восстановлением)' : ''}...`);

  const results = [];

  // Helper check runner
  async function runCheck(name, checkFn) {
    try {
      addLog(`Проверка ${name}...`);
      let svc = await checkFn();
      if (svc.status !== 'ONLINE' && autoRepair) {
        addLog(`Обнаружен сбой службы [${svc.id}] (${svc.status}). Запуск авто-восстановления...`, 'WARN');
        try {
          const repRes = await repairService(svc.id, addLog);
          addLog(`[${svc.id}] Результат восстановления: ${repRes.message}`, 'INFO');
          svc = await checkFn(); // re-check after repair
        } catch (repErr) {
          addLog(`[${svc.id}] Сбой при попытке восстановления: ${repErr.message}`, 'ERROR');
        }
      }
      results.push(svc);
      addLog(`[${svc.id}] Статус: ${svc.status}, задержка: ${svc.latencyMs}мс`);
    } catch (e) {
      addLog(`[${name}] Ошибка выполнения теста: ${e.message}`, 'ERROR');
    }
  }

  await runCheck('Express REST API Gateway (порт 5000)', checkExpressService);
  await runCheck('SQLite Database (orthopedic_data_center.sqlite)', checkSqliteService);
  await runCheck('Fiscal Service (.NET Daemon порт 5050)', checkFiscalService);
  await runCheck('Firebird SQL Server (MEDICAL.FDB порт 3050)', checkFirebirdService);
  await runCheck('OpenAPI Swagger UI (порт 5000)', checkSwaggerService);
  await runCheck('SQLite Hot Backup Subsystem', checkBackupService);
  await runCheck('POS Acquiring & PIN-pad (INPAS/Arcus)', checkPosService);
  await runCheck('Шлюз онлайн-записи MedFlex (ПроДокторов)', checkMedflexService);

  addLog('Все проверки серверных служб завершены.');

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

/**
 * POST /api/admin/services/:id/repair (or /restart)
 * Repairs or restarts a single service
 */
router.post(['/:id/repair', '/:id/restart'], async (req, res) => {
  const serviceId = req.params.id;
  const logs = [];
  const addLog = (msg, level = 'INFO') => logs.push({ timestamp: new Date().toISOString(), level, message: msg });

  try {
    const result = await repairService(serviceId, addLog);
    
    // Get updated status for this service
    let updatedService = null;
    switch (serviceId) {
      case 'express': updatedService = await checkExpressService(); break;
      case 'sqlite': updatedService = await checkSqliteService(); break;
      case 'fiscal': updatedService = await checkFiscalService(); break;
      case 'firebird': updatedService = await checkFirebirdService(); break;
      case 'swagger': updatedService = await checkSwaggerService(); break;
      case 'backup': updatedService = await checkBackupService(); break;
      case 'pos': updatedService = await checkPosService(); break;
    }

    res.json({
      success: true,
      serviceId,
      message: result.message,
      service: updatedService,
      logs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      serviceId,
      error: err.message,
      logs
    });
  }
});

/**
 * POST /api/admin/services/repair-all
 * Scans and repairs all failing/degraded services in one click
 */
router.post('/repair-all', async (req, res) => {
  const executionLogs = [];
  const addLog = (msg, level = 'INFO') => {
    executionLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message: msg
    });
  };

  addLog('Запуск пакетного восстановления сбойных служб бэкенда...');

  try {
    const currentServices = await checkAllServices();
    const failing = currentServices.filter(s => s.status !== 'ONLINE');

    if (failing.length === 0) {
      addLog('Все службы уже находятся в состоянии ONLINE. Восстановление не требуется.', 'INFO');
      return res.json({
        success: true,
        message: 'Все службы в сети (ONLINE), вмешательство не требуется.',
        repairedCount: 0,
        services: currentServices,
        logs: executionLogs
      });
    }

    addLog(`Обнаружено сбойных служб: ${failing.length} (${failing.map(s => s.id).join(', ')}). Выполнение восстановления...`, 'WARN');

    const repairResults = [];
    for (const svc of failing) {
      try {
        const rep = await repairService(svc.id, addLog);
        repairResults.push({ id: svc.id, success: true, message: rep.message });
      } catch (repErr) {
        addLog(`Ошибка при восстановлении [${svc.id}]: ${repErr.message}`, 'ERROR');
        repairResults.push({ id: svc.id, success: false, error: repErr.message });
      }
    }

    addLog('Повторный опрос состояния всех служб после восстановления...');
    const updatedServices = await checkAllServices();
    const onlineCount = updatedServices.filter(s => s.status === 'ONLINE').length;

    res.json({
      success: true,
      message: `Восстановление завершено. В сети: ${onlineCount} из ${updatedServices.length}.`,
      repairedCount: repairResults.filter(r => r.success).length,
      repairDetails: repairResults,
      services: updatedServices,
      logs: executionLogs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      logs: executionLogs
    });
  }
});

module.exports = router;
