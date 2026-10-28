const express = require('express');
const router = express.Router();
const db = require('./database');
const { requireAuth } = require('./auth');
const { getSerilogConfig } = require('./config');

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
 * Build dynamic WHERE clause and parameters from request query
 */
function buildFilterQuery(query) {
  const conditions = [];
  const params = [];
  let useFts = false;
  let ftsSearchTerm = '';

  const {
    startDate,
    endDate,
    levels,
    sources,
    eventTypes,
    search,
    userId,
    doctorId,
    patientId
  } = query;

  if (startDate) {
    conditions.push("s.timestamp >= ?");
    params.push(startDate.includes(' ') ? startDate : `${startDate} 00:00:00`);
  }

  if (endDate) {
    conditions.push("s.timestamp <= ?");
    params.push(endDate.includes(' ') ? endDate : `${endDate} 23:59:59`);
  }

  if (levels) {
    const lvlList = levels.split(',').map(s => s.trim()).filter(Boolean);
    if (lvlList.length > 0) {
      const placeholders = lvlList.map(() => '?').join(',');
      conditions.push(`s.level IN (${placeholders})`);
      params.push(...lvlList);
    }
  }

  if (sources) {
    const srcList = sources.split(',').map(s => s.trim()).filter(Boolean);
    if (srcList.length > 0) {
      const placeholders = srcList.map(() => '?').join(',');
      conditions.push(`s.source_context IN (${placeholders})`);
      params.push(...srcList);
    }
  }

  if (eventTypes) {
    const evtList = eventTypes.split(',').map(s => s.trim()).filter(Boolean);
    if (evtList.length > 0) {
      const placeholders = evtList.map(() => '?').join(',');
      conditions.push(`s.event_type IN (${placeholders})`);
      params.push(...evtList);
    }
  }

  if (userId) {
    conditions.push("s.user_id = ?");
    params.push(Number(userId));
  }

  if (doctorId) {
    conditions.push("s.doctor_id = ?");
    params.push(Number(doctorId));
  }

  if (patientId) {
    conditions.push("s.patient_id = ?");
    params.push(Number(patientId));
  }

  if (search && search.trim()) {
    const cleanSearch = search.trim();
    // Sanitize search query for FTS5 (remove special characters that break MATCH syntax)
    const sanitizedFts = cleanSearch.replace(/["'*^(){}[\]:;+\-~]/g, ' ').trim();
    if (sanitizedFts) {
      useFts = true;
      ftsSearchTerm = `${sanitizedFts}*`;
    } else {
      conditions.push("(s.message LIKE ? OR s.properties_json LIKE ? OR s.username LIKE ?)");
      const likeParam = `%${cleanSearch}%`;
      params.push(likeParam, likeParam, likeParam);
    }
  }

  return { conditions, params, useFts, ftsSearchTerm };
}

/**
 * GET /api/admin/serilog/logs
 * Retrieve paginated, filtered, and full-text searched log entries
 */
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize, 10) || 25));
    const offset = (page - 1) * pageSize;

    const allowedSortFields = {
      timestamp: 's.timestamp',
      level: 's.level',
      source_context: 's.source_context',
      event_type: 's.event_type',
      duration_ms: 's.duration_ms',
      username: 's.username',
      id: 's.id'
    };

    const sortBy = allowedSortFields[req.query.sortBy] || 's.timestamp';
    const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { conditions, params, useFts, ftsSearchTerm } = buildFilterQuery(req.query);

    let fromClause = 'FROM serilog s';
    if (useFts) {
      fromClause = 'FROM serilog s JOIN serilog_fts f ON s.id = f.rowid';
      conditions.unshift('serilog_fts MATCH ?');
      params.unshift(ftsSearchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching rows
    const countSql = `SELECT COUNT(*) as total ${fromClause} ${whereClause}`;
    const countRow = await getAsync(countSql, params);
    const total = countRow ? countRow.total : 0;

    // Fetch paginated items
    const selectSql = `
      SELECT 
        s.id,
        s.timestamp,
        s.level,
        s.event_type,
        s.source_context,
        s.message,
        s.properties_json,
        s.protocol_id,
        s.appointment_id,
        s.patient_id,
        s.doctor_id,
        s.user_id,
        s.username,
        s.duration_ms,
        s.client_ip,
        s.exception
      ${fromClause}
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const items = await allAsync(selectSql, [...params, pageSize, offset]);

    res.json({
      success: true,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    console.error('[SerilogAnalytics API] Logs query error:', err);
    res.status(500).json({ success: false, error: 'Ошибка получения логов Serilog: ' + err.message });
  }
});

/**
 * GET /api/admin/serilog/summary
 * KPI summary metrics (total logs, error/warn breakdown, timeline, top events)
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { conditions, params, useFts, ftsSearchTerm } = buildFilterQuery(req.query);

    let fromClause = 'FROM serilog s';
    if (useFts) {
      fromClause = 'FROM serilog s JOIN serilog_fts f ON s.id = f.rowid';
      conditions.unshift('serilog_fts MATCH ?');
      params.unshift(ftsSearchTerm);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Overall counts by level
    const levelCountsSql = `
      SELECT s.level, COUNT(*) as count 
      ${fromClause} 
      ${whereClause} 
      GROUP BY s.level
    `;
    const levelRows = await allAsync(levelCountsSql, params);
    const levelBreakdown = {
      Information: 0,
      Warning: 0,
      Error: 0,
      Fatal: 0,
      Debug: 0
    };
    let totalLogs = 0;
    for (const r of levelRows) {
      if (levelBreakdown[r.level] !== undefined) {
        levelBreakdown[r.level] = r.count;
      }
      totalLogs += r.count;
    }

    const totalErrors = (levelBreakdown.Error || 0) + (levelBreakdown.Fatal || 0);
    const totalWarnings = levelBreakdown.Warning || 0;

    // 2. Count of User Actions (events from OrthoErp.Auth, OrthoErp.Users, or user_id not null)
    const userActionSql = `
      SELECT COUNT(*) as count 
      ${fromClause} 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} (s.user_id IS NOT NULL OR s.source_context IN ('OrthoErp.Auth', 'OrthoErp.Users'))
    `;
    const userActionRow = await getAsync(userActionSql, params);
    const totalUserActions = userActionRow ? userActionRow.count : 0;

    // 3. Top 10 Event Types
    const topEventsSql = `
      SELECT s.event_type, COUNT(*) as count 
      ${fromClause} 
      ${whereClause} 
      GROUP BY s.event_type 
      ORDER BY count DESC 
      LIMIT 10
    `;
    const topEvents = await allAsync(topEventsSql, params);

    // 4. Source Context Breakdown
    const sourcesSql = `
      SELECT s.source_context, COUNT(*) as count 
      ${fromClause} 
      ${whereClause} 
      GROUP BY s.source_context 
      ORDER BY count DESC
    `;
    const sourcesBreakdown = await allAsync(sourcesSql, params);

    // 5. Timeline by day (last 14 days or filtered period)
    const timelineSql = `
      SELECT 
        substr(s.timestamp, 1, 10) as date,
        SUM(CASE WHEN s.level = 'Information' THEN 1 ELSE 0 END) as info_count,
        SUM(CASE WHEN s.level = 'Warning' THEN 1 ELSE 0 END) as warn_count,
        SUM(CASE WHEN s.level IN ('Error', 'Fatal') THEN 1 ELSE 0 END) as error_count,
        COUNT(*) as total
      ${fromClause}
      ${whereClause}
      GROUP BY substr(s.timestamp, 1, 10)
      ORDER BY date ASC
      LIMIT 30
    `;
    const timeline = await allAsync(timelineSql, params);

    // 6. Average operation duration
    const avgDurationSql = `
      SELECT ROUND(AVG(s.duration_ms), 1) as avg_duration 
      ${fromClause} 
      ${whereClause ? whereClause + ' AND' : 'WHERE'} s.duration_ms > 0
    `;
    const avgRow = await getAsync(avgDurationSql, params);
    const avgDurationMs = avgRow ? avgRow.avg_duration || 0 : 0;

    res.json({
      success: true,
      totalLogs,
      totalErrors,
      totalWarnings,
      totalUserActions,
      levelBreakdown,
      topEvents,
      sourcesBreakdown,
      timeline,
      avgDurationMs
    });
  } catch (err) {
    console.error('[SerilogAnalytics API] Summary query error:', err);
    res.status(500).json({ success: false, error: 'Ошибка получения сводки Serilog: ' + err.message });
  }
});

/**
 * GET /api/admin/serilog/sources-and-events
 * Lists distinct sources and event types for dropdown selectors
 */
router.get('/sources-and-events', requireAuth, async (req, res) => {
  try {
    const sources = await allAsync(
      `SELECT DISTINCT source_context FROM serilog WHERE source_context IS NOT NULL ORDER BY source_context`
    );
    const eventTypes = await allAsync(
      `SELECT DISTINCT event_type FROM serilog WHERE event_type IS NOT NULL ORDER BY event_type`
    );

    // Standard known system sources
    const defaultSources = [
      'OrthoErp.Workstation',
      'OrthoErp.FiscalDaemon',
      'OrthoErp.MedFlexSync',
      'OrthoErp.AlfaPos',
      'OrthoErp.Auth',
      'OrthoErp.Users',
      'OrthoErp.Admin'
    ];

    const sourceSet = new Set(defaultSources);
    sources.forEach(s => sourceSet.add(s.source_context));

    res.json({
      success: true,
      sources: Array.from(sourceSet),
      eventTypes: eventTypes.map(e => e.event_type),
      levels: ['Information', 'Warning', 'Error', 'Fatal', 'Debug']
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/serilog/export
 * Exports filtered log records as CSV (with UTF-8 BOM for MS Excel) or JSON
 */
router.get('/export', requireAuth, async (req, res) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const { conditions, params, useFts, ftsSearchTerm } = buildFilterQuery(req.query);

    let fromClause = 'FROM serilog s';
    if (useFts) {
      fromClause = 'FROM serilog s JOIN serilog_fts f ON s.id = f.rowid';
      conditions.unshift('serilog_fts MATCH ?');
      params.unshift(ftsSearchTerm);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const exportSql = `
      SELECT 
        s.id,
        s.timestamp,
        s.level,
        s.source_context,
        s.event_type,
        s.username,
        s.duration_ms,
        s.client_ip,
        s.message,
        s.properties_json,
        s.exception
      ${fromClause}
      ${whereClause}
      ORDER BY s.timestamp DESC
      LIMIT 10000
    `;

    const rows = await allAsync(exportSql, params);

    const nowStr = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="serilog_export_${nowStr}.json"`);
      return res.json(rows);
    }

    // CSV format with UTF-8 BOM for MS Excel compatibility
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="serilog_export_${nowStr}.csv"`);

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = ['ID', 'Время', 'Уровень', 'Служба', 'Тип события', 'Пользователь', 'Длит (мс)', 'IP адрес', 'Сообщение', 'Параметры JSON', 'Исключение'];
    let csvContent = '\uFEFF' + headers.map(escapeCsv).join(';') + '\r\n';

    for (const r of rows) {
      const line = [
        r.id,
        r.timestamp,
        r.level,
        r.source_context,
        r.event_type,
        r.username || '',
        r.duration_ms || 0,
        r.client_ip || '',
        r.message,
        r.properties_json || '',
        r.exception || ''
      ].map(escapeCsv).join(';');
      csvContent += line + '\r\n';
    }

    res.send(csvContent);
  } catch (err) {
    console.error('[SerilogAnalytics API] Export error:', err);
    res.status(500).json({ success: false, error: 'Ошибка экспорта логов: ' + err.message });
  }
});

/**
 * DELETE /api/admin/serilog/purge
 * Sysadmin retention maintenance: purge logs older than N days
 */
router.delete('/purge', requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'admin' && !req.user?.permissions?.includes('sysadmin')) {
      return res.status(403).json({ success: false, error: 'Доступ разрешен только системному администратору' });
    }

    const serilogCfg = getSerilogConfig();
    const days = Math.max(7, parseInt(req.query.days, 10) || Number(serilogCfg.RetentionDays) || 180);

    const result = await runAsync(
      `DELETE FROM serilog WHERE timestamp < datetime('now', '-${days} days', 'localtime')`
    );

    res.json({
      success: true,
      purgedCount: result.changes,
      message: `Очищено записей старше ${days} дней: ${result.changes}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

