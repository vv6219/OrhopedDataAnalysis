/**
 * MedFlex Online Appointment Integration Schema & Seed Initializer.
 * Creates tables for Serilog audit logs, offline retry queue, RCA sync incidents,
 * adds columns to appointments and staff tables, and sets default calculation parameters.
 */

function initMedflexSchema(db, callback) {
  db.serialize(() => {
    // 1. Alter appointments table: add medflex_claim_id, medflex_source, medflex_synced_at
    db.run("ALTER TABLE appointments ADD COLUMN medflex_claim_id TEXT", (err) => {
      // Column may already exist, ignore duplicate column error
    });
    db.run("ALTER TABLE appointments ADD COLUMN medflex_source TEXT", (err) => {});
    db.run("ALTER TABLE appointments ADD COLUMN medflex_synced_at TEXT", (err) => {});

    // Create unique index on medflex_claim_id
    db.run(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_medflex_claim ON appointments(medflex_claim_id) WHERE medflex_claim_id IS NOT NULL",
      (err) => {
        if (err && !err.message.includes('already exists')) {
          console.warn('[initMedflexSchema] Error creating idx_appointments_medflex_claim:', err.message);
        }
      }
    );

    // 2. Alter staff table: add medflex_doctor_id, medflex_sync_enabled
    db.run("ALTER TABLE staff ADD COLUMN medflex_doctor_id INTEGER", (err) => {});
    db.run("ALTER TABLE staff ADD COLUMN medflex_sync_enabled INTEGER DEFAULT 1", (err) => {});

    // Set default medflex_doctor_id for existing doctors if null
    db.run(
      "UPDATE staff SET medflex_doctor_id = 10452, medflex_sync_enabled = 1 WHERE (id = 2 OR full_name LIKE '%Добрушкин%') AND medflex_doctor_id IS NULL"
    );
    db.run(
      "UPDATE staff SET medflex_doctor_id = 10453, medflex_sync_enabled = 1 WHERE (id = 4 OR full_name LIKE '%Петров%') AND medflex_doctor_id IS NULL"
    );

    // 3. Table for Serilog-compatible MedFlex Audit Logs (Dual-Sink: SQLite + CLEF File)
    db.run(`CREATE TABLE IF NOT EXISTS medflex_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT (datetime('now', 'localtime')),
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      event_type TEXT NOT NULL,
      direction TEXT NOT NULL,
      claim_id TEXT,
      appointment_id INTEGER,
      doctor_id INTEGER,
      http_status INTEGER,
      duration_ms INTEGER DEFAULT 0,
      endpoint TEXT,
      properties_json TEXT,
      exception TEXT,
      is_duplicate INTEGER DEFAULT 0,
      is_simulation INTEGER DEFAULT 0,
      sandbox_direction TEXT DEFAULT 'none'
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_mf_audit_ts ON medflex_audit_logs(timestamp DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_mf_audit_event ON medflex_audit_logs(event_type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_mf_audit_claim ON medflex_audit_logs(claim_id)`);

    // 4. Table for Persistent Offline Queue (Circuit Breaker Resilience)
    db.run(`CREATE TABLE IF NOT EXISTS medflex_offline_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      claim_id TEXT,
      doctor_id INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      attempt_count INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 10,
      next_retry_at TEXT NOT NULL,
      last_error TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      status TEXT DEFAULT 'pending'
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_mf_queue_status_retry ON medflex_offline_queue(status, next_retry_at)`);

    // 5. Table for RCA Sync Incidents & Diagnostics
    db.run(`CREATE TABLE IF NOT EXISTS medflex_sync_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_uuid TEXT UNIQUE NOT NULL,
      problem_code TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      explanation_human TEXT NOT NULL,
      root_cause_analysis TEXT NOT NULL,
      remediation_steps TEXT NOT NULL,
      action_type TEXT,
      claim_id TEXT,
      appointment_id INTEGER,
      doctor_id INTEGER,
      patient_phone TEXT,
      patient_name TEXT,
      technical_context_json TEXT,
      status TEXT DEFAULT 'open',
      resolved_at TEXT,
      resolved_by TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(appointment_id) REFERENCES appointments(id),
      FOREIGN KEY(doctor_id) REFERENCES staff(id)
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_mf_inc_status ON medflex_sync_incidents(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_mf_inc_code ON medflex_sync_incidents(problem_code)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_mf_inc_created ON medflex_sync_incidents(created_at DESC)`);

    // 6. Default parameters in calculation_parameters
    const defaultParams = [
      ['medflex_enabled', 'true'],
      ['medflex_mode', 'sandbox'],
      ['medflex_sandbox_direction', 'dual'],
      ['medflex_clinic_token', 'DEMO_MEDFLEX_TOKEN_770192'],
      ['medflex_webhook_secret', 'DEMO_WEBHOOK_SECRET_8821'],
      ['medflex_filial_id', '1'],
      ['medflex_filial_name', 'Центр Ортопедии Добрушкина, Сочи'],
      ['medflex_api_url', 'https://mis-api.medflex.ru'],
      ['medflex_partner_api_url', 'https://api.medflex.ru'],
      ['medflex_ping_interval_sec', '60'],
      ['medflex_schedule_sync_interval_min', '30'],
      ['medflex_default_duration', '30'],
      ['medflex_sync_days_ahead', '30'],
      ['medflex_auto_confirm', 'true'],
      ['medflex_log_retention_months', '3']
    ];

    const paramStmt = db.prepare('INSERT OR IGNORE INTO calculation_parameters (param_name, param_value) VALUES (?, ?)');
    defaultParams.forEach(([name, val]) => {
      paramStmt.run(name, val);
    });
    paramStmt.finalize((err) => {
      if (err) {
        console.warn('[initMedflexSchema] Error inserting calculation_parameters:', err.message);
      }
      if (typeof callback === 'function') {
        callback();
      }
    });
  });
}

module.exports = initMedflexSchema;
