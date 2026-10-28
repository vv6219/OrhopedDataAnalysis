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
  },
  BackupSettings: {
    AutoBackupOnStartup: true,
    BackupDirectory: '../backups',
    KeepLastNBackups: 7
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

/**
 * Dynamically resolves Backup configuration
 */
function getBackupConfig() {
  const settings = getAppSettings();
  return settings?.BackupSettings || defaultConfig.BackupSettings;
}

/**
 * Dynamically resolves Fiscal Service configuration
 */
function getFiscalConfig() {
  const settings = getAppSettings();
  return settings?.FiscalService || {
    Port: 'COM3',
    BaudRate: 115200,
    DeviceModel: 'АТОЛ 91Ф',
    IsMockMode: true,
    SingleConsumerQueue: true,
    ExecutionTimeoutSeconds: 35,
    FnNumber: '9960440301984210',
    KktRegNumber: '0004928103049182',
    DefaultTaxType: 6,
    TaxRegimeName: 'Без НДС (пп. 2 п. 2 ст. 149 НК РФ — медицинские услуги)',
    PaymentSubjectType: 4,
    PaymentMethodType: 4,
    DefaultShiftNumber: 14,
    BaseFiscalDocumentNumber: 1041,
    ExternalDaemonUrl: 'http://localhost:5050'
  };
}

/**
 * Dynamically resolves Alfa-Bank Acquiring POS Terminal configuration
 */
function getPosConfig() {
  const settings = getAppSettings();
  return settings?.AlfaPosTerminal || {
    Port: 'COM4',
    BaudRate: 115200,
    IpAddress: '192.168.1.150',
    IpPort: 8888,
    TerminalId: 'ALFA_770192',
    MerchantId: 'MERCH_884102',
    DriverType: 'Arcus-2',
    ConnectionType: 'COM',
    IsMockMode: true,
    ExecutionTimeoutSeconds: 60,
    DriverExecutablePath: 'C:\\Arcus2\\pos.exe',
    EnableSbpQr: true,
    MockScenario: 'success',
    MockDelaySeconds: 2
  };
}

/**
 * Dynamically resolves Serilog configuration
 */
function getSerilogConfig() {
  const settings = getAppSettings();
  return settings?.Serilog || {
    MinimumLevel: 'Information',
    RollingInterval: 'Day',
    RetentionDays: 180,
    LogsDirectory: '../logs',
    FileSizeLimitBytes: 10485760,
    RetainedFileCountLimit: 31,
    Enrich: [
      'FromLogContext',
      'WithMachineName',
      'WithEnvironmentUserName',
      'WithProcessId',
      'WithThreadId',
      'WithClientIp',
      'WithApplicationVersion'
    ],
    Properties: {
      Application: 'OrthoERP.ClinicServer',
      Environment: 'Production',
      Version: '2.0.1'
    },
    Sinks: {
      Console: {
        Enabled: true,
        OutputTemplate: '[{Timestamp:HH:mm:ss}] [{Level}] [{EventType}] {Message}'
      },
      File: {
        Enabled: true,
        Path: '../logs/ortho_audit-.clef',
        RollingInterval: 'Day',
        RollOnFileSizeLimit: true,
        FileSizeLimitBytes: 10485760,
        RetainedFileCountLimit: 31
      },
      SQLite: {
        Enabled: true,
        TableName: 'serilog',
        RetentionDays: 180
      }
    }
  };
}

module.exports = {
  getAppSettings,
  saveAppSettings,
  getSqliteDbPath,
  getFirebirdConfig,
  getSqliteConfig,
  getBackupConfig,
  getFiscalConfig,
  getPosConfig,
  getSerilogConfig,
  configPath
};

