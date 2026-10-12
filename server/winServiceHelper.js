/**
 * Windows Service Helper for POS Acquiring & Peripheral Drivers.
 * Inspects and manages services like 'DualConnectorService' (INPAS DualConnector 2.x),
 * and checks local utility paths such as DCControl.exe.
 */
const { exec, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Normalizes Windows service name or alias
 * @param {string} serviceName 
 */
function normalizeServiceName(serviceName) {
  return (serviceName || 'DualConnectorService').trim();
}

/**
 * Checks status of a Windows Service
 * @param {string} serviceName e.g. 'DualConnectorService' or 'Dual Connector Service'
 * @returns {Promise<{ found: boolean, status: 'Running' | 'Stopped' | 'NotFound' | 'Error', displayName: string, startType: string, error?: string }>}
 */
function getWindowsServiceStatus(serviceName = 'DualConnectorService') {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve({
        found: false,
        status: 'NotFound',
        displayName: serviceName,
        startType: 'Unknown',
        error: 'Службы Windows поддерживаются только на платформе win32'
      });
    }

    const target = normalizeServiceName(serviceName);
    // Try Get-Service with fallback to alias matching
    const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$svc = Get-Service -Name '${target}' -ErrorAction SilentlyContinue; if (-not $svc) { $svc = Get-Service -DisplayName '*Dual*Connector*' -ErrorAction SilentlyContinue | Select-Object -First 1 }; if ($svc) { @{ found = $true; name = $svc.Name; displayName = $svc.DisplayName; status = $svc.Status.ToString(); startType = $svc.StartType.ToString() } | ConvertTo-Json -Compress } else { @{ found = $false } | ConvertTo-Json -Compress }"`;

    exec(psCmd, { timeout: 4000 }, (err, stdout) => {
      if (err || !stdout) {
        return resolve({
          found: false,
          status: 'Error',
          displayName: target,
          startType: 'Unknown',
          error: (err && err.message) || 'Таймаут запроса службы Windows'
        });
      }

      try {
        const info = JSON.parse(stdout.trim());
        if (!info.found) {
          return resolve({
            found: false,
            status: 'NotFound',
            displayName: target,
            startType: 'Unknown',
            error: `Служба '${target}' не зарегистрирована в системе`
          });
        }

        const rawStatus = String(info.status || '').toLowerCase();
        let normalizedStatus = 'Stopped';
        if (rawStatus === 'running') normalizedStatus = 'Running';
        else if (rawStatus === 'stopped') normalizedStatus = 'Stopped';
        else normalizedStatus = info.status || 'Stopped';

        return resolve({
          found: true,
          status: normalizedStatus,
          displayName: info.displayName || info.name || target,
          serviceName: info.name || target,
          startType: info.startType || 'Automatic'
        });
      } catch (parseErr) {
        return resolve({
          found: false,
          status: 'Error',
          displayName: target,
          startType: 'Unknown',
          error: parseErr.message
        });
      }
    });
  });
}

/**
 * Restarts a Windows Service
 * @param {string} serviceName 
 * @returns {Promise<{ success: boolean, message: string, error?: string }>}
 */
function restartWindowsService(serviceName = 'DualConnectorService') {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve({
        success: false,
        message: 'Перезапуск служб доступен только в среде Windows',
        error: 'Неподдерживаемая ОС'
      });
    }

    const target = normalizeServiceName(serviceName);
    const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Restart-Service -Name '${target}' -Force -ErrorAction Stop; (Get-Service -Name '${target}').Status.ToString()"`;

    exec(psCmd, { timeout: 10000 }, (err, stdout) => {
      if (err) {
        return resolve({
          success: false,
          message: `Не удалось перезапустить службу '${target}'. Возможно, требуются права администратора.`,
          error: err.message
        });
      }

      const status = (stdout || '').trim();
      resolve({
        success: true,
        message: `Служба '${target}' успешно перезапущена. Текущий статус: ${status}`,
        status
      });
    });
  });
}

/**
 * Launches an executable utility such as DCControl.exe
 * @param {string} exePath 
 * @returns {Promise<{ success: boolean, message: string, error?: string }>}
 */
function launchUtility(exePath) {
  return new Promise((resolve) => {
    if (!exePath) {
      return resolve({ success: false, message: 'Путь к исполняемому файлу не указан' });
    }

    if (!fs.existsSync(exePath)) {
      return resolve({
        success: false,
        message: `Файл не найден по пути: ${exePath}`,
        error: 'FILE_NOT_FOUND'
      });
    }

    if (process.platform !== 'win32') {
      return resolve({ success: false, message: 'Запуск EXE-файлов поддерживается только в Windows' });
    }

    // Launch detached process in Windows
    const dir = path.dirname(exePath);
    exec(`start "" "${exePath}"`, { cwd: dir }, (err) => {
      if (err) {
        return resolve({
          success: false,
          message: `Ошибка запуска: ${err.message}`,
          error: err.message
        });
      }

      resolve({
        success: true,
        message: `Утилита ${path.basename(exePath)} успешно запущена`
      });
    });
  });
}

module.exports = {
  getWindowsServiceStatus,
  restartWindowsService,
  launchUtility
};
