const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, 'appsettings.json');

const defaultConfig = {
  ConnectionStrings: {
    SQLite: {
      DatabasePath: '../db/orthopedic_data_center.sqlite',
      JournalMode: 'WAL',
      Synchronous: 'NORMAL',
      BusyTimeoutMs: 5000,
      ForeignKeys: true
    },
    Firebird: {
      Host: 'localhost',
      Port: 3050,
      DatabasePath: 'C:\\Users\\vladimir\\source\\DB\\Export\\MEDICAL.FDB',
      User: 'SYSDBA',
      Password: 'masterkey',
      Charset: 'WIN1251'
    }
  },
  SyncSettings: {
    BatchSize: 1000,
    NormalizePhones: true,
    AutoCalculateContracts: true
  },
  Server: {
    Port: 5000,
    Host: '0.0.0.0'
  }
};

/**
 * Dynamically reads appsettings.json from disk on runtime
 */
function getAppSettings() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading appsettings.json, falling back to defaults:', err.message);
  }
  return defaultConfig;
}

/**
 * Persists updated configuration into appsettings.json
 */
function saveAppSettings(newConfig) {
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
  return getAppSettings();
}

/**
 * Dynamically resolves absolute SQLite database path
 */
function getSqliteDbPath() {
  const settings = getAppSettings();
  const relOrAbs = settings?.ConnectionStrings?.SQLite?.DatabasePath || '../db/orthopedic_data_center.sqlite';
  return path.isAbsolute(relOrAbs) ? relOrAbs : path.resolve(__dirname, relOrAbs);
}

/**
 * Dynamically resolves Firebird connection configuration
 */
function getFirebirdConfig() {
  const settings = getAppSettings();
  return settings?.ConnectionStrings?.Firebird || defaultConfig.ConnectionStrings.Firebird;
}

/**
 * Dynamically resolves SQLite connection configuration
 */
function getSqliteConfig() {
  const settings = getAppSettings();
  return settings?.ConnectionStrings?.SQLite || defaultConfig.ConnectionStrings.SQLite;
}

module.exports = {
  getAppSettings,
  saveAppSettings,
  getSqliteDbPath,
  getFirebirdConfig,
  getSqliteConfig,
  configPath
};
