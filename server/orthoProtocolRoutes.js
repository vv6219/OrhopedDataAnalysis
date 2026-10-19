const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const db = require('./database');
const { logOrthoAudit, LogLevels, EventTypes } = require('./orthoAuditLogger');

// Configure multer storage for patient media uploads
const uploadsDir = path.resolve(__dirname, '../uploads/patient_media');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const patientSubdir = req.body.patientId ? path.join(uploadsDir, String(req.body.patientId)) : uploadsDir;
    if (!fs.existsSync(patientSubdir)) {
      fs.mkdirSync(patientSubdir, { recursive: true });
    }
    cb(null, patientSubdir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e6);
    cb(null, `media_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Helper: Compute SHA-256 hash
function computeSha256(content) {
  return crypto.createHash('sha256').update(content || '').digest('hex');
}

// Helper: Detect anatomical joint area and ICD-10 code from template title/content
function detectJointAndMkb(title = '', content = '') {
  const t = (title || '').toLowerCase();
  const c = (content || '').toLowerCase();

  const check = (str) => {
    if (/гон|колен|мениск|patell|cruciat/.test(str)) return 'knee';
    if (/кокс|тазобедр|вертлуж|trochanter/.test(str)) return 'hip';
    if (/плеч|надостн|подостн|лопатк|ротатор|акромион/.test(str)) return 'shoulder';
    if (/локт|эпикондил|олекранон/.test(str)) return 'elbow';
    if (/кист|лучезап|запяст|ладьевид|фаланг|пальц|карпал|кервен/.test(str)) return 'wrist';
    if (/стоп|голеностоп|пятк|плантар|фасци|ахилл|таран/.test(str)) return 'foot';
    if (/позвоноч|шеин|грудн|пояснич|дорсопат|люмба|копчик|кокциг|спондил/.test(str)) return 'spine';
    return '';
  };

  const joint_name = check(t) || check(c) || 'knee';

  // Search MKB code in XML capt="Диагноз" or capt="Диагноз МКБ"
  let mkb_code = '';
  const diagMatch = (content || '').match(/capt="[^"]*?(?:диагноз|мкб)[^"]*"[^>]*>([^<]+)/i);
  if (diagMatch) {
    const codeMatch = diagMatch[1].match(/\b([A-ZА-Я][0-9]{2}(?:\.[0-9]{1,2})?)\b/);
    if (codeMatch) mkb_code = codeMatch[1].toUpperCase();
  }
  if (!mkb_code) {
    const generalMkb = (content || '').match(/\b([A-ZА-Я][0-9]{2}\.[0-9]{1,2})\b/);
    if (generalMkb) mkb_code = generalMkb[1].toUpperCase();
  }

  return { joint_name, mkb_code };
}

// -----------------------------------------------------------------------------
// Helper query to fetch enriched template metadata with counts of clinical domains
function getOrthoTemplatesSql() {
  return `
    SELECT ot.id, ot.title, ot.joint_name, ot.default_mkb_code, ot.template_json, ot.category,
           ot.cluster_id, ot.cluster_name, ot.stage_or_severity, ot.is_custom, ot.author_doctor_name, ot.clinical_tags,
           ot.default_side, ot.complaints_template, ot.anamnesis_template, ot.anamnesis_vitae_template,
           ot.objective_template, ot.objective_status_template, ot.special_studies_template,
           ot.performed_manipulations_template, ot.default_sections_mask, ot.recommendations_template,
           ot.rom_norm_preset, ot.rom_priority, ot.rom_sftr_preview,
           (SELECT COUNT(*) FROM ortho_template_tests WHERE template_id = ot.id) AS tests_count,
           (SELECT COUNT(*) FROM ortho_template_diagnostics WHERE template_id = ot.id) AS diagnostics_count,
           (SELECT COUNT(*) FROM ortho_template_manipulations WHERE template_id = ot.id) AS manipulations_count,
           (SELECT COUNT(*) FROM ortho_template_physiotherapy WHERE template_id = ot.id) AS physiotherapy_count,
           (SELECT COUNT(*) FROM ortho_template_orthotics WHERE template_id = ot.id) AS orthotics_count,
           (SELECT COUNT(*) FROM ortho_template_lfk WHERE template_id = ot.id) AS lfk_count,
           'biomechanics' AS source
    FROM ortho_templates ot
    WHERE (ot.is_active = 1 OR ot.is_active IS NULL)
    ORDER BY ot.is_custom DESC, ot.sort_order ASC, ot.id ASC
  `;
}

function mapOrthoTemplateRow(ot) {
  return {
    id: `ortho-${ot.id}`,
    rawId: ot.id,
    title: ot.title,
    joint_name: ot.joint_name,
    default_mkb_code: ot.default_mkb_code,
    template_json: ot.template_json,
    category: ot.category || 'Биомеханика Neutral-0 ROM',
    cluster_id: ot.cluster_id || '',
    cluster_name: ot.cluster_name || '',
    stage_or_severity: ot.stage_or_severity || '',
    default_side: ot.default_side || 'right',
    is_custom: Boolean(ot.is_custom),
    author_doctor_name: ot.author_doctor_name || '',
    clinical_tags: ot.clinical_tags || '',
    complaints_template: ot.complaints_template || '',
    anamnesis_template: ot.anamnesis_template || '',
    anamnesis_vitae_template: ot.anamnesis_vitae_template || '',
    objective_template: ot.objective_template || '',
    objective_status_template: ot.objective_status_template || '',
    special_studies_template: ot.special_studies_template || '',
    performed_manipulations_template: ot.performed_manipulations_template || '',
    default_sections_mask: ot.default_sections_mask || '',
    recommendations_template: ot.recommendations_template || '',
    rom_norm_preset: ot.rom_norm_preset || null,
    rom_priority: ot.rom_priority || 'P2',
    rom_sftr_preview: ot.rom_sftr_preview || '',
    tests_count: Number(ot.tests_count || 0),
    diagnostics_count: Number(ot.diagnostics_count || 0),
    manipulations_count: Number(ot.manipulations_count || 0),
    physiotherapy_count: Number(ot.physiotherapy_count || 0),
    orthotics_count: Number(ot.orthotics_count || 0),
    lfk_count: Number(ot.lfk_count || 0),
    source: 'biomechanics'
  };
}

// 0. GET /api/ortho/templates - Unified clinical templates (ortho_templates + protdict)
// -----------------------------------------------------------------------------
router.get('/templates', (req, res) => {
  const search = req.query.search ? String(req.query.search).trim() : '';
  const joint = req.query.joint ? String(req.query.joint).trim() : '';

  db.all(getOrthoTemplatesSql(), [], (oErr, orthoTemplates) => {
    if (oErr) return res.status(500).json({ success: false, error: oErr.message });

    let pSql = `SELECT id, name AS title, title AS full_title, content, kind, post, 'protdict' AS source FROM protdict WHERE hide_f = 0`;
    const pParams = [];
    if (search) {
      pSql += ` AND (name LIKE ? OR title LIKE ?)`;
      pParams.push(`%${search}%`, `%${search}%`);
    }
    pSql += ` ORDER BY name ASC`;

    db.all(pSql, pParams, (pErr, protdictRows) => {
      if (pErr) return res.status(500).json({ success: false, error: pErr.message });

      const mappedOrtho = (orthoTemplates || []).map(mapOrthoTemplateRow);

      const mappedProtdict = (protdictRows || []).map((row) => {
        const detected = detectJointAndMkb(row.title, row.content);
        return {
          id: `protdict-${row.id}`,
          rawId: row.id,
          title: row.title,
          full_title: row.full_title,
          content: row.content,
          joint_name: detected.joint_name,
          default_mkb_code: detected.mkb_code,
          category: 'Клинические протоколы (Firebird)',
          source: 'protdict'
        };
      });

      let combined = [...mappedOrtho, ...mappedProtdict];
      if (joint) {
        combined = combined.filter((t) => !t.joint_name || t.joint_name.includes(joint) || joint.includes(t.joint_name));
      }

      res.json({
        success: true,
        total: combined.length,
        templates: combined
      });
    });
  });
});

// -----------------------------------------------------------------------------
// 1. GET /api/ortho/registry - Paginated list of protocols with FTS5 search
// -----------------------------------------------------------------------------
router.get('/registry', (req, res) => {
  const t0 = performance.now();
  const {
    search,
    joint,
    status,
    doctorId,
    startDate,
    endDate,
    page = 1,
    pageSize = 25,
    sortBy = 'vdate',
    sortOrder = 'DESC'
  } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limit = Math.min(100, Math.max(5, Number(pageSize)));
  const offset = (pageNum - 1) * limit;

  // If full-text search term is provided, use FTS5 virtual table
  if (search && search.trim().length > 0) {
    const rawSearch = search.trim();
    // Format search tokens with prefix wildcard
    const ftsQuery = rawSearch
      .replace(/[^\w\u0400-\u04FF\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => `"${w}"*`)
      .join(' AND ');

    let countSql = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM protocols_fts fts
      JOIN protocols p ON p.id = fts.protocol_id
      WHERE protocols_fts MATCH ?
    `;
    const countParams = [ftsQuery];

    if (joint) {
      countSql += ` AND (p.primary_joint = ? OR fts.joint_area LIKE ?)`;
      countParams.push(joint, `%${joint}%`);
    }
    if (status) {
      countSql += ` AND p.status = ?`;
      countParams.push(status);
    }
    if (startDate) {
      countSql += ` AND date(p.vdate) >= date(?)`;
      countParams.push(startDate);
    }
    if (endDate) {
      countSql += ` AND date(p.vdate) <= date(?)`;
      countParams.push(endDate);
    }

    db.get(countSql, countParams, (err, countRow) => {
      if (err) {
        console.error('FTS5 Count Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }

      const total = countRow ? countRow.total : 0;

      let selectSql = `
        SELECT 
          p.id,
          p.docn,
          p.pt_id,
          p.vdate,
          p.title,
          p.content,
          p.protocol_json,
          p.status,
          p.vas_score,
          p.primary_joint,
          p.side,
          p.is_signed,
          p.signed_at,
          p.signature_hash,
          p.revocation_reason,
          COALESCE(st.full_name, 'Добрушкин Александр Моисеевич') AS doctor_name,
          pt.full_name AS patient_name,
          pt.bdate AS patient_bdate,
          pt.age AS patient_age,
          pt.mednum AS patient_mednum,
          pt.sphone AS patient_phone,
          (SELECT GROUP_CONCAT(mkb_code, ', ') FROM diagnoses WHERE pr_id = p.id) AS mkb_code,
          (SELECT GROUP_CONCAT(mkb_name, '; ') FROM diagnoses WHERE pr_id = p.id) AS mkb_name,
          (
            CASE 
              WHEN (SELECT COUNT(*) FROM ortho_treatment_prescriptions WHERE protocol_id = p.id) > 0 
              THEN (SELECT COUNT(*) FROM ortho_treatment_prescriptions WHERE protocol_id = p.id)
              ELSE (SELECT COUNT(*) FROM servplan WHERE pr_id = p.id)
            END
          ) AS prescriptions_count,
          (
            CASE 
              WHEN (SELECT COUNT(*) FROM ortho_treatment_prescriptions WHERE protocol_id = p.id) > 0 
              THEN (SELECT COALESCE(SUM(total_price), 0) FROM ortho_treatment_prescriptions WHERE protocol_id = p.id)
              ELSE (SELECT COALESCE(SUM(sd.price * sp.cnt), 0) FROM servplan sp JOIN servdict sd ON sd.id = sp.sd_id WHERE sp.pr_id = p.id)
            END
          ) AS total_prescriptions_amount
        FROM protocols_fts fts
        JOIN protocols p ON p.id = fts.protocol_id
        LEFT JOIN staff st ON st.id = p.docn
        LEFT JOIN patients pt ON pt.id = p.pt_id
        WHERE protocols_fts MATCH ?
      `;
      const selectParams = [ftsQuery];

      if (joint) {
        selectSql += ` AND (p.primary_joint = ? OR fts.joint_area LIKE ?)`;
        selectParams.push(joint, `%${joint}%`);
      }
      if (status) {
        selectSql += ` AND p.status = ?`;
        selectParams.push(status);
      }
      if (startDate) {
        selectSql += ` AND date(p.vdate) >= date(?)`;
        selectParams.push(startDate);
      }
      if (endDate) {
        selectSql += ` AND date(p.vdate) <= date(?)`;
        selectParams.push(endDate);
      }

      selectSql += ` GROUP BY p.id ORDER BY p.id DESC LIMIT ? OFFSET ?`;
      selectParams.push(limit, offset);

      db.all(selectSql, selectParams, (err2, rows) => {
        if (err2) {
          console.error('FTS5 Select Error:', err2.message);
          return res.status(500).json({ success: false, error: err2.message });
        }

        const durationMs = performance.now() - t0;
        logOrthoAudit({
          eventType: EventTypes.FTS_SEARCH_PERFORMED,
          message: `FTS5 полнотекстовый поиск по запросу "${rawSearch}": найдено ${total} записей (${durationMs.toFixed(1)} мс)`,
          durationMs,
          properties: { SearchTerm: rawSearch, TotalResults: total }
        });

        res.json({
          success: true,
          total,
          page: pageNum,
          pageSize: limit,
          rows: rows || [],
          durationMs: Math.round(durationMs)
        });
      });
    });
  } else {
    // Standard filtered SQL query
    let whereClauses = ['1=1'];
    const params = [];

    if (joint) {
      whereClauses.push('(p.primary_joint = ? OR p.title LIKE ?)');
      params.push(joint, `%${joint}%`);
    }
    if (status) {
      whereClauses.push('p.status = ?');
      params.push(status);
    }
    if (doctorId) {
      whereClauses.push('p.docn = ?');
      params.push(doctorId);
    }
    if (startDate) {
      whereClauses.push('date(p.vdate) >= date(?)');
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push('date(p.vdate) <= date(?)');
      params.push(endDate);
    }

    const whereStr = whereClauses.join(' AND ');

    db.get(`SELECT COUNT(*) AS total FROM protocols p WHERE ${whereStr}`, params, (err, countRow) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      const total = countRow ? countRow.total : 0;

      const safeSortCol = ['vdate', 'id', 'vas_score', 'docn'].includes(sortBy) ? sortBy : 'id';
      const safeSortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const selectSql = `
        SELECT 
          p.id,
          p.docn,
          p.pt_id,
          p.vdate,
          p.title,
          p.content,
          p.protocol_json,
          p.status,
          p.vas_score,
          p.primary_joint,
          p.side,
          p.is_signed,
          p.signed_at,
          p.signature_hash,
          p.revocation_reason,
          COALESCE(st.full_name, 'Добрушкин Александр Моисеевич') AS doctor_name,
          pt.full_name AS patient_name,
          pt.bdate AS patient_bdate,
          pt.age AS patient_age,
          pt.mednum AS patient_mednum,
          pt.sphone AS patient_phone,
          (SELECT GROUP_CONCAT(mkb_code, ', ') FROM diagnoses WHERE pr_id = p.id) AS mkb_code,
          (SELECT GROUP_CONCAT(mkb_name, '; ') FROM diagnoses WHERE pr_id = p.id) AS mkb_name,
          (
            CASE 
              WHEN (SELECT COUNT(*) FROM ortho_treatment_prescriptions WHERE protocol_id = p.id) > 0 
              THEN (SELECT COUNT(*) FROM ortho_treatment_prescriptions WHERE protocol_id = p.id)
              ELSE (SELECT COUNT(*) FROM servplan WHERE pr_id = p.id)
            END
          ) AS prescriptions_count,
          (
            CASE 
              WHEN (SELECT COUNT(*) FROM ortho_treatment_prescriptions WHERE protocol_id = p.id) > 0 
              THEN (SELECT COALESCE(SUM(total_price), 0) FROM ortho_treatment_prescriptions WHERE protocol_id = p.id)
              ELSE (SELECT COALESCE(SUM(sd.price * sp.cnt), 0) FROM servplan sp JOIN servdict sd ON sd.id = sp.sd_id WHERE sp.pr_id = p.id)
            END
          ) AS total_prescriptions_amount
        FROM protocols p
        LEFT JOIN staff st ON st.id = p.docn
        LEFT JOIN patients pt ON pt.id = p.pt_id
        WHERE ${whereStr}
        ORDER BY p.${safeSortCol} ${safeSortDir}
        LIMIT ? OFFSET ?
      `;

      db.all(selectSql, [...params, limit, offset], (err2, rows) => {
        if (err2) {
          return res.status(500).json({ success: false, error: err2.message });
        }

        res.json({
          success: true,
          total,
          page: pageNum,
          pageSize: limit,
          rows: rows || []
        });
      });
    });
  }
});

// -----------------------------------------------------------------------------
// 2. GET /api/ortho/context/:identifier? - Full patient and clinical exam context
// Supports: /context/:id, /context?protocolId=..., /context?patientId=..., /context?appointmentId=...
// -----------------------------------------------------------------------------
router.get(['/context', '/context/:identifier'], (req, res) => {
  const t0 = performance.now();
  const rawId = req.params.identifier || req.query.appointmentId || req.query.protocolId || req.query.patientId;
  const protocolIdQuery = req.query.protocolId;
  const patientIdQuery = req.query.patientId;
  const appointmentIdQuery = req.query.appointmentId;

  // Resolve target patientId, appointmentId, and targetProtocol
  function resolveTargetContext(callback) {
    if (protocolIdQuery || (rawId && String(rawId).startsWith('protocol-'))) {
      const pId = protocolIdQuery || String(rawId).replace('protocol-', '');
      db.get(`SELECT p.*, d.mkb_code, d.mkb_name FROM protocols p LEFT JOIN diagnoses d ON d.pr_id = p.id WHERE p.id = ?`, [pId], (err, proto) => {
        if (!err && proto) {
          return callback(null, { patientId: proto.pt_id, appointmentId: proto.appointment_id || null, initialProtocol: proto });
        }
        fallbackResolve(callback);
      });
      return;
    }

    if (patientIdQuery || (rawId && String(rawId).startsWith('patient-'))) {
      const ptId = patientIdQuery || String(rawId).replace('patient-', '');
      return callback(null, { patientId: Number(ptId), appointmentId: null, initialProtocol: null });
    }

    if (appointmentIdQuery) {
      db.get(`
        SELECT a.*, d.full_name AS doctor_name, d.specialization AS doctor_specialization
        FROM appointments a
        LEFT JOIN staff d ON d.id = a.doctor_id
        WHERE a.id = ?
      `, [appointmentIdQuery], (err, appt) => {
        if (!err && appt) {
          return callback(null, { patientId: appt.patient_id, appointmentId: appt.id, appointment: appt, initialProtocol: null });
        }
        fallbackResolve(callback);
      });
      return;
    }

    fallbackResolve(callback);
  }

  function fallbackResolve(callback) {
    const numId = Number(rawId);
    if (!isNaN(numId) && numId > 0) {
      // 1. Try appointment
      db.get(`
        SELECT a.*, d.full_name AS doctor_name, d.specialization AS doctor_specialization
        FROM appointments a
        LEFT JOIN staff d ON d.id = a.doctor_id
        WHERE a.id = ?
      `, [numId], (err, appt) => {
        if (!err && appt) {
          return callback(null, { patientId: appt.patient_id, appointmentId: appt.id, appointment: appt, initialProtocol: null });
        }

        // 2. Try protocol
        db.get(`SELECT p.*, d.mkb_code, d.mkb_name FROM protocols p LEFT JOIN diagnoses d ON d.pr_id = p.id WHERE p.id = ?`, [numId], (pErr, proto) => {
          if (!pErr && proto) {
            return callback(null, { patientId: proto.pt_id, appointmentId: proto.appointment_id || null, initialProtocol: proto });
          }

          // 3. Try patient
          db.get(`SELECT id FROM patients WHERE id = ?`, [numId], (ptErr, pt) => {
            if (!ptErr && pt) {
              return callback(null, { patientId: pt.id, appointmentId: null, initialProtocol: null });
            }
            defaultPatient(callback);
          });
        });
      });
    } else {
      defaultPatient(callback);
    }
  }

  function defaultPatient(callback) {
    // Fallback to latest appointment or patient #1
    db.get(`SELECT id, patient_id FROM appointments ORDER BY id DESC LIMIT 1`, [], (err, lastAppt) => {
      if (!err && lastAppt) {
        return callback(null, { patientId: lastAppt.patient_id, appointmentId: lastAppt.id, initialProtocol: null });
      }
      db.get(`SELECT id FROM patients ORDER BY id ASC LIMIT 1`, [], (pErr, pt) => {
        callback(null, { patientId: pt ? pt.id : 1, appointmentId: null, initialProtocol: null });
      });
    });
  }

  resolveTargetContext((rErr, resolved) => {
    if (rErr || !resolved || !resolved.patientId) {
      return res.status(404).json({ success: false, error: 'Пациент или запись не найдены' });
    }

    const { patientId, appointmentId, initialProtocol } = resolved;
    let appointment = resolved.appointment;

    // 2. Fetch patient demographics
    db.get(`SELECT * FROM patients WHERE id = ?`, [patientId], (pErr, patient) => {
      if (pErr || !patient) {
        return res.status(404).json({ success: false, error: 'Пациент не найден' });
      }

      // If appointment was not preloaded, attempt load or build pseudo-appointment
      const completeAppointment = (doneAppt) => {
        if (appointment) return doneAppt();
        if (appointmentId) {
          db.get(`
            SELECT a.*, d.full_name AS doctor_name, d.specialization AS doctor_specialization
            FROM appointments a
            LEFT JOIN staff d ON d.id = a.doctor_id
            WHERE a.id = ?
          `, [appointmentId], (aErr, loadedAppt) => {
            appointment = loadedAppt || {
              id: appointmentId,
              patient_id: patientId,
              appointment_date: new Date().toISOString().slice(0, 10),
              doctor_name: 'Добрушкин Александр Моисеевич'
            };
            doneAppt();
          });
        } else {
          db.get(`
            SELECT a.*, d.full_name AS doctor_name, d.specialization AS doctor_specialization
            FROM appointments a
            LEFT JOIN staff d ON d.id = a.doctor_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.id DESC LIMIT 1
          `, [patientId], (aErr, loadedAppt) => {
            appointment = loadedAppt || {
              id: initialProtocol ? initialProtocol.id : null,
              patient_id: patientId,
              appointment_date: initialProtocol ? initialProtocol.vdate : new Date().toISOString().slice(0, 10),
              doctor_name: 'Добрушкин Александр Моисеевич'
            };
            doneAppt();
          });
        }
      };

      completeAppointment(() => {
        // 3. Fetch clinical profile
        db.get(`SELECT * FROM patient_clinical_profiles WHERE patient_id = ?`, [patientId], (cpErr, clinicalProfile) => {
          
          // 4. Fetch last historical protocol for longitudinal trend comparison
          db.get(`
            SELECT id, vdate, primary_joint, side, vas_score, title, content, protocol_json
            FROM protocols
            WHERE pt_id = ? AND status = 'signed'
            ORDER BY id DESC LIMIT 1
          `, [patientId], (lpErr, lastProtocol) => {

            // 5. Fetch patient media attachments (uploads + protshots)
            db.all(`
              SELECT id, media_category, joint_area, title, file_name, file_path, thumbnail_path, mime_type, file_size_bytes, study_date, description
              FROM patient_media_attachments
              WHERE patient_id = ?
              ORDER BY id DESC
            `, [patientId], (mErr, mediaAttachments) => {

              // Also check legacy protshots table
              db.all(`
                SELECT s.id, s.title, s.fname, s.shot_size_bytes, p.vdate
                FROM protshots s
                JOIN protocols p ON p.id = s.pr_id
                WHERE p.pt_id = ?
                ORDER BY s.id DESC LIMIT 10
              `, [patientId], (psErr, legacyShots) => {

                // 6. Fetch biomechanics history
                db.all(`
                  SELECT recorded_date, joint_name, side, flexion_active, flexion_passive, extension_deficit, vas_score, key_findings
                  FROM joint_biomechanics_history
                  WHERE patient_id = ?
                  ORDER BY id DESC LIMIT 10
                `, [patientId], (bErr, biomechanicsHistory) => {

                  // 7. Fetch active templates (ortho_templates + protdict)
                  db.all(getOrthoTemplatesSql(), [], (tErr, orthoTemplates) => {
                    db.all(`SELECT id, name AS title, title AS full_title, content, kind, post, 'protdict' AS source FROM protdict WHERE hide_f = 0 ORDER BY name ASC`, [], (pdErr, protdictRows) => {
                      const allTemplates = [
                        ...(orthoTemplates || []).map(mapOrthoTemplateRow),
                        ...(protdictRows || []).map((pr) => {
                          const detected = detectJointAndMkb(pr.title, pr.content);
                          return {
                            id: `protdict-${pr.id}`,
                            rawId: pr.id,
                            title: pr.title,
                            full_title: pr.full_title,
                            content: pr.content,
                            joint_name: detected.joint_name,
                            default_mkb_code: detected.mkb_code,
                            category: 'Клинические протоколы (Firebird)',
                            source: 'protdict'
                          };
                        })
                      ];

                      // 8. Fetch medical services price list
                      db.all(`SELECT id, code, name, price, kind FROM servdict WHERE group_f = 0 ORDER BY name ASC`, [], (sErr, servicesList) => {

                      // If initialProtocol was preloaded (e.g. from protocolId), use it; otherwise search by appointment or patient
                      const resolveCurrentProtocol = (doneProto) => {
                        if (initialProtocol) return doneProto(initialProtocol);
                        const apptIdToSearch = appointmentId || (appointment ? appointment.id : null);
                        if (apptIdToSearch) {
                          db.get(`
                            SELECT p.*, d.mkb_code, d.mkb_name
                            FROM protocols p
                            LEFT JOIN diagnoses d ON d.pr_id = p.id
                            WHERE p.appointment_id = ?
                            ORDER BY p.id DESC LIMIT 1
                          `, [apptIdToSearch], (curErr, curP) => {
                            if (!curErr && curP) return doneProto(curP);
                            db.get(`
                              SELECT p.*, d.mkb_code, d.mkb_name
                              FROM protocols p
                              LEFT JOIN diagnoses d ON d.pr_id = p.id
                              WHERE p.pt_id = ?
                              ORDER BY p.vdate DESC, p.id DESC LIMIT 1
                            `, [patientId], (ptErr, ptP) => {
                              doneProto(ptP || null);
                            });
                          });
                        } else {
                          db.get(`
                            SELECT p.*, d.mkb_code, d.mkb_name
                            FROM protocols p
                            LEFT JOIN diagnoses d ON d.pr_id = p.id
                            WHERE p.pt_id = ?
                            ORDER BY p.vdate DESC, p.id DESC LIMIT 1
                          `, [patientId], (curErr, curP) => {
                            doneProto(curP || null);
                          });
                        }
                      };

                      resolveCurrentProtocol((currentProtocol) => {
                        // Check if current protocol has prescriptions in ortho_treatment_prescriptions
                        const protocolIdToFetch = currentProtocol ? currentProtocol.id : null;
                        const fetchCurrentPrescriptions = (donePresc) => {
                          if (!protocolIdToFetch) return donePresc([]);
                          db.all(`SELECT * FROM ortho_treatment_prescriptions WHERE protocol_id = ?`, [protocolIdToFetch], (prErr, prescRows) => {
                            if (!prErr && prescRows && prescRows.length > 0) {
                              return donePresc(prescRows);
                            }
                            // Fallback to legacy servplan table
                            db.all(`
                              SELECT 
                                sp.id,
                                sp.pr_id AS protocol_id,
                                sp.cnt AS quantity,
                                sp.sd_id AS service_id,
                                sd.code AS service_code,
                                sd.name AS title,
                                sd.price AS unit_price,
                                (sd.price * sp.cnt) AS total_price,
                                COALESCE(sd.kind, 'service') AS category,
                                '{}' AS details_json
                              FROM servplan sp
                              JOIN servdict sd ON sd.id = sp.sd_id
                              WHERE sp.pr_id = ?
                            `, [protocolIdToFetch], (spErr, legacyRows) => {
                              donePresc(legacyRows || []);
                            });
                          });
                        };

                        fetchCurrentPrescriptions((currentPrescriptions) => {
                          const durationMs = performance.now() - t0;
                          logOrthoAudit({
                            eventType: EventTypes.VISIT_INITIATED,
                            appointmentId: appointmentId ? Number(appointmentId) : null,
                            patientId,
                            doctorId: appointment ? appointment.doctor_id : 1,
                            durationMs,
                            message: `Открыт приём пациента ${patient.full_name} в АРМ Ортопеда`
                          });

                          res.json({
                            success: true,
                            appointment,
                            patient,
                            clinicalProfile: clinicalProfile || {
                              patient_id: patientId,
                              allergies: '',
                              implants_endoprosthetics: '',
                              has_pacemaker: 0,
                              dominant_limb: 'right',
                              chronic_conditions: '',
                              ortho_anamnesis_notes: ''
                            },
                            lastProtocol,
                            currentProtocol,
                            currentPrescriptions,
                            mediaAttachments: mediaAttachments || [],
                            legacyShots: legacyShots || [],
                            biomechanicsHistory: biomechanicsHistory || [],
                            templates: allTemplates || [],
                            services: servicesList || [],
                            servicesList: servicesList || [],
                            durationMs
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
  });
});


// -----------------------------------------------------------------------------
// 2.1 GET /api/ortho/prescriptions/:protocolId - Prescriptions for specific protocol
// -----------------------------------------------------------------------------
router.get('/prescriptions/:protocolId', (req, res) => {
  const pId = Number(req.params.protocolId);
  if (!pId) return res.status(400).json({ success: false, error: 'Invalid protocolId' });

  db.all(`SELECT * FROM ortho_treatment_prescriptions WHERE protocol_id = ?`, [pId], (err, rows) => {
    if (!err && rows && rows.length > 0) {
      return res.json({ success: true, source: 'ortho_treatment_prescriptions', prescriptions: rows });
    }
    // Fallback to legacy servplan joined with servdict
    db.all(`
      SELECT 
        sp.id,
        sp.pr_id AS protocol_id,
        sp.cnt AS quantity,
        sp.sd_id AS service_id,
        sd.code AS service_code,
        sd.name AS title,
        sd.price AS unit_price,
        (sd.price * sp.cnt) AS total_price,
        COALESCE(sd.kind, 'service') AS category,
        '{}' AS details_json
      FROM servplan sp
      JOIN servdict sd ON sd.id = sp.sd_id
      WHERE sp.pr_id = ?
    `, [pId], (spErr, legacyRows) => {
      if (spErr) return res.status(500).json({ success: false, error: spErr.message });
      res.json({ success: true, source: 'servplan', prescriptions: legacyRows || [] });
    });
  });
});

// -----------------------------------------------------------------------------
// 3. POST /api/ortho/save - Save draft or signed protocol with dual projection
// -----------------------------------------------------------------------------
router.post('/save', (req, res) => {
  const t0 = performance.now();
  const {
    protocolId,
    appointmentId,
    patientId,
    doctorId = 1,
    jointArea,
    side,
    vasScore = 0,
    painTriggers,
    rom,
    tests,
    complaints,
    anamnesis,
    anamnesis_vitae,
    anamnesisVitae,
    objective_status,
    objectiveStatus,
    special_studies,
    specialStudies,
    performed_manipulations,
    performedManipulations,
    active_sections_mask,
    activeSectionsMask,
    recommendations,
    diagnosis,
    prescriptions = [],
    contentText,
    status = 'draft',
    clinicalProfileUpdate
  } = req.body;

  if (!patientId) {
    return res.status(400).json({ success: false, error: 'Не указан patientId' });
  }

  const resolvedAnamnesisVitae = anamnesis_vitae !== undefined ? anamnesis_vitae : (anamnesisVitae || '');
  const resolvedObjectiveStatus = objective_status !== undefined ? objective_status : (objectiveStatus || '');
  const resolvedSpecialStudies = special_studies !== undefined ? special_studies : (specialStudies || '');
  const resolvedPerformedManipulations = performed_manipulations !== undefined ? performed_manipulations : (performedManipulations || '');
  const resolvedActiveSectionsMask = typeof active_sections_mask === 'object' ? JSON.stringify(active_sections_mask) :
    (typeof activeSectionsMask === 'object' ? JSON.stringify(activeSectionsMask) : (active_sections_mask || activeSectionsMask || ''));

  const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const todayDate = new Date().toISOString().slice(0, 10);

  const fullProtocolJson = JSON.stringify({
    jointArea,
    side,
    vasScore,
    painTriggers,
    rom,
    tests,
    complaints,
    anamnesis,
    anamnesis_vitae: resolvedAnamnesisVitae,
    objective_status: resolvedObjectiveStatus,
    special_studies: resolvedSpecialStudies,
    performed_manipulations: resolvedPerformedManipulations,
    active_sections_mask: resolvedActiveSectionsMask,
    recommendations,
    diagnosis,
    prescriptions,
    updatedAt: nowIso
  });

  const signatureHash = status === 'signed' ? computeSha256(contentText + nowIso + doctorId) : null;

  db.serialize(() => {
    // 1. Update or Insert protocol
    if (protocolId) {
      db.run(`
        UPDATE protocols SET
          title = ?,
          content = ?,
          protocol_json = ?,
          status = ?,
          vas_score = ?,
          primary_joint = ?,
          side = ?,
          is_signed = ?,
          signed_at = CASE WHEN ? = 'signed' THEN ? ELSE signed_at END,
          signed_by_docn = ?,
          signature_hash = COALESCE(?, signature_hash),
          moddate = ?,
          anamnesis_vitae = ?,
          objective_status = ?,
          special_studies = ?,
          performed_manipulations = ?,
          active_sections_mask = ?
        WHERE id = ?
      `, [
        diagnosis ? `${diagnosis.mkb_code || ''} ${diagnosis.mkb_name || ''}`.trim() : 'Ортопедический осмотр',
        contentText,
        fullProtocolJson,
        status,
        vasScore,
        jointArea,
        side,
        status === 'signed' ? 1 : 0,
        status,
        nowIso,
        doctorId,
        signatureHash,
        nowIso,
        resolvedAnamnesisVitae,
        resolvedObjectiveStatus,
        resolvedSpecialStudies,
        resolvedPerformedManipulations,
        resolvedActiveSectionsMask,
        protocolId
      ], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        postSaveHandler(protocolId);
      });
    } else {
      db.run(`
        INSERT INTO protocols (
          docn, pt_id, vdate, kind, mode, title, content, post, rdate, fname, hide_f, moddate, moduser, shot_f,
          protocol_json, schema_version, appointment_id, status, vas_score, primary_joint, side, is_signed, signed_at, signed_by_docn, signature_hash,
          anamnesis_vitae, objective_status, special_studies, performed_manipulations, active_sections_mask
        ) VALUES (
          ?, ?, ?, 1, 1, ?, ?, 'Врач травматолог-ортопед', ?, 'protocol.rtf', 0, ?, 'ortho_workstation', 0,
          ?, '2.0', ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
      `, [
        doctorId,
        patientId,
        todayDate,
        diagnosis ? `${diagnosis.mkb_code || ''} ${diagnosis.mkb_name || ''}`.trim() : 'Ортопедический осмотр',
        contentText,
        nowIso,
        nowIso,
        fullProtocolJson,
        appointmentId,
        status,
        vasScore,
        jointArea,
        side,
        status === 'signed' ? 1 : 0,
        status === 'signed' ? nowIso : null,
        doctorId,
        signatureHash,
        resolvedAnamnesisVitae,
        resolvedObjectiveStatus,
        resolvedSpecialStudies,
        resolvedPerformedManipulations,
        resolvedActiveSectionsMask
      ], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        postSaveHandler(this.lastID);
      });
    }

    function postSaveHandler(savedProtocolId) {
      // 2. Update appointments table status
      if (appointmentId) {
        const nextAppStatus = status === 'signed' ? 'protocol_signed' : 'in_progress';
        db.run(`UPDATE appointments SET status = ? WHERE id = ?`, [nextAppStatus, appointmentId]);
      }

      // 3. Sync diagnoses table
      if (diagnosis && diagnosis.mkb_code) {
        db.run(`DELETE FROM diagnoses WHERE pr_id = ?`, [savedProtocolId], () => {
          db.run(`
            INSERT INTO diagnoses (pr_id, mk_id, mkb_code, mkb_name)
            VALUES (?, 1, ?, ?)
          `, [savedProtocolId, diagnosis.mkb_code, diagnosis.mkb_name || '']);
        });
      }

      // 4. Sync prescriptions to ortho_treatment_prescriptions and legacy servplan
      db.run(`DELETE FROM ortho_treatment_prescriptions WHERE protocol_id = ?`, [savedProtocolId], () => {
        if (Array.isArray(prescriptions) && prescriptions.length > 0) {
          const stmt = db.prepare(`
            INSERT INTO ortho_treatment_prescriptions (
              protocol_id, appointment_id, patient_id, category, service_id, service_code, title, details_json, quantity, unit_price, total_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          prescriptions.forEach((p) => {
            stmt.run([
              savedProtocolId,
              appointmentId,
              patientId,
              p.category || 'service',
              p.serviceId || null,
              p.serviceCode || null,
              p.title || p.name || 'Медицинская услуга',
              JSON.stringify(p.details || {}),
              p.quantity || 1,
              p.unitPrice ?? p.price ?? 0,
              (p.unitPrice ?? p.price ?? 0) * (p.quantity || 1)
            ]);
          });
          stmt.finalize();
        }

        // Also sync to legacy servplan table
        db.run(`DELETE FROM servplan WHERE pr_id = ?`, [savedProtocolId], () => {
          if (Array.isArray(prescriptions) && prescriptions.length > 0) {
            const spStmt = db.prepare(`INSERT INTO servplan (pr_id, sd_id, cnt) VALUES (?, ?, ?)`);
            prescriptions.forEach((p) => {
              if (p.serviceId) {
                spStmt.run([savedProtocolId, p.serviceId, p.quantity || 1]);
              }
            });
            spStmt.finalize();
          }
        });
      });

      // 5. Update patient clinical profile if provided
      if (clinicalProfileUpdate) {
        db.run(`
          INSERT INTO patient_clinical_profiles (
            patient_id, allergies, implants_endoprosthetics, has_pacemaker, dominant_limb, chronic_conditions, ortho_anamnesis_notes, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(patient_id) DO UPDATE SET
            allergies = excluded.allergies,
            implants_endoprosthetics = excluded.implants_endoprosthetics,
            has_pacemaker = excluded.has_pacemaker,
            dominant_limb = excluded.dominant_limb,
            chronic_conditions = excluded.chronic_conditions,
            ortho_anamnesis_notes = excluded.ortho_anamnesis_notes,
            updated_at = excluded.updated_at
        `, [
          patientId,
          clinicalProfileUpdate.allergies || '',
          clinicalProfileUpdate.implants_endoprosthetics || '',
          clinicalProfileUpdate.has_pacemaker ? 1 : 0,
          clinicalProfileUpdate.dominant_limb || 'right',
          clinicalProfileUpdate.chronic_conditions || '',
          clinicalProfileUpdate.ortho_anamnesis_notes || '',
          nowIso
        ]);
      }

      // 6. Record biomechanics history on sign
      if (status === 'signed' && rom) {
        db.run(`
          INSERT INTO joint_biomechanics_history (
            patient_id, protocol_id, recorded_date, joint_name, side, flexion_active, flexion_passive, extension_deficit, vas_score, key_findings
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          patientId,
          savedProtocolId,
          todayDate,
          jointArea || 'knee',
          side || 'right',
          rom.flexion_active || null,
          rom.flexion_passive || null,
          rom.extension_deficit || null,
          vasScore,
          tests ? JSON.stringify(tests) : null
        ]);
      }

      // 7. Update FTS5 virtual table
      db.run(`DELETE FROM protocols_fts WHERE protocol_id = ?`, [savedProtocolId], () => {
        const aggregatedText = [complaints, anamnesis, contentText, recommendations].filter(Boolean).join('\n\n');
        db.run(`
          INSERT INTO protocols_fts (
            protocol_id, patient_id, patient_name, doctor_name, joint_area, mkb_codes, mkb_names, complaints, status_localis, full_content
          ) VALUES (
            ?, ?, (SELECT full_name FROM patients WHERE id = ?), 'Добрушкин А.М.', ?, ?, ?, ?, ?, ?
          )
        `, [
          savedProtocolId,
          patientId,
          patientId,
          jointArea || '',
          diagnosis ? diagnosis.mkb_code || '' : '',
          diagnosis ? diagnosis.mkb_name || '' : '',
          complaints || '',
          contentText || '',
          aggregatedText || contentText || ''
        ]);
      });

      const durationMs = performance.now() - t0;
      logOrthoAudit({
        eventType: status === 'signed' ? EventTypes.PROTOCOL_SIGNED : EventTypes.EXAM_DRAFT_SAVED,
        appointmentId,
        protocolId: savedProtocolId,
        patientId,
        doctorId,
        durationMs,
        message: status === 'signed'
          ? `Протокол осмотра #${savedProtocolId} успешно подписан ЭЦП (хэш: ${signatureHash ? signatureHash.slice(0, 10) : ''}...)`
          : `Черновик протокола #${savedProtocolId} сохранён в SQLite`
      });

      res.json({
        success: true,
        protocolId: savedProtocolId,
        status,
        signatureHash,
        message: status === 'signed' ? 'Протокол успешно подписан' : 'Черновик сохранён'
      });
    }
  });
});

// -----------------------------------------------------------------------------
// 4. POST /api/ortho/revoke - Soft delete / revoke signed protocol
// -----------------------------------------------------------------------------
router.post('/revoke', (req, res) => {
  const { protocolId, reason } = req.body;
  if (!protocolId) {
    return res.status(400).json({ success: false, error: 'Укажите protocolId' });
  }

  const revocationReason = reason || 'Аннулировано врачом';

  db.run(`
    UPDATE protocols
    SET status = 'revoked', revocation_reason = ?
    WHERE id = ?
  `, [revocationReason, protocolId], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    logOrthoAudit({
      eventType: EventTypes.PROTOCOL_REVOKED,
      protocolId,
      level: LogLevels.WARN,
      message: `Протокол #${protocolId} аннулирован. Причина: "${revocationReason}"`
    });

    res.json({
      success: true,
      message: `Протокол #${protocolId} успешно аннулирован`
    });
  });
});

// -----------------------------------------------------------------------------
// 5. POST /api/ortho/transfer-to-checkout - Transfer services to cashier
// -----------------------------------------------------------------------------
router.post('/transfer-to-checkout', (req, res) => {
  const { appointmentId, protocolId, patientId, patientName, doctorId, doctorName, items = [] } = req.body;

  if (protocolId) {
    db.run(`UPDATE ortho_treatment_prescriptions SET is_transferred_to_cashier = 1 WHERE protocol_id = ?`, [protocolId]);
  }

  // Pack session prefill payload
  const checkoutPrefill = {
    appointmentId,
    protocolId,
    patientId,
    patientName,
    doctorId,
    doctorName,
    items: items.map((it) => {
      const pPrice = Number(it.unitPrice ?? it.price ?? it.unit_price ?? 0);
      return {
        id: it.id || it.serviceId || it.service_id,
        serviceId: it.serviceId || it.id || it.service_id,
        name: it.name || it.title || 'Медицинская услуга',
        title: it.title || it.name || 'Медицинская услуга',
        price: pPrice,
        unit_price: pPrice,
        unitPrice: pPrice,
        quantity: Number(it.quantity || 1),
        code: it.code || it.service_code || '',
        category: it.category || 'medical_service'
      };
    })
  };

  logOrthoAudit({
    eventType: EventTypes.TRANSFERRED_TO_CHECKOUT,
    appointmentId,
    protocolId,
    patientId,
    message: `Пакет назначений (${items.length} поз.) передан на оплату в кассовый узел (CheckoutWizard)`
  });

  res.json({
    success: true,
    checkoutPrefill,
    message: 'Назначения успешно переданы в кассу'
  });
});

// -----------------------------------------------------------------------------
// 6. POST /api/ortho/media/upload - Upload clinical media attachment
// -----------------------------------------------------------------------------
router.post('/media/upload', upload.single('mediaFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Файл не прикреплен' });
  }

  const {
    patientId,
    protocolId,
    appointmentId,
    mediaCategory = 'xray',
    jointArea,
    title,
    description,
    studyDate
  } = req.body;

  const relativePath = path.relative(path.resolve(__dirname, '..'), req.file.path).replace(/\\/g, '/');
  const fileHash = computeSha256(fs.readFileSync(req.file.path));

  db.run(`
    INSERT INTO patient_media_attachments (
      patient_id, protocol_id, appointment_id, media_category, joint_area, title, file_name, file_path, file_size_bytes, mime_type, description, study_date, sha256_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    patientId,
    protocolId || null,
    appointmentId || null,
    mediaCategory,
    jointArea || null,
    title || req.file.originalname,
    req.file.originalname,
    relativePath,
    req.file.size,
    req.file.mimetype,
    description || null,
    studyDate || new Date().toISOString().slice(0, 10),
    fileHash
  ], function (err) {
    if (err) {
      console.error('Media attachment insert error:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }

    const newMediaId = this.lastID;
    logOrthoAudit({
      eventType: EventTypes.MEDIA_UPLOADED,
      patientId: Number(patientId),
      protocolId: protocolId ? Number(protocolId) : null,
      message: `Загружен медиафайл "${req.file.originalname}" (${(req.file.size / 1024).toFixed(1)} КБ) категории ${mediaCategory}`
    });

    res.json({
      success: true,
      mediaId: newMediaId,
      filePath: relativePath,
      message: 'Файл успешно загружен в медиа-хаб пациента'
    });
  });
});

// -----------------------------------------------------------------------------
// 7. GET /api/ortho/media/:patientId - Get all media for patient
// -----------------------------------------------------------------------------
router.get('/media/:patientId', (req, res) => {
  const { patientId } = req.params;
  const { joint } = req.query;

  let query = `SELECT * FROM patient_media_attachments WHERE patient_id = ?`;
  const params = [patientId];

  if (joint) {
    query += ` AND (joint_area = ? OR joint_area IS NULL)`;
    params.push(joint);
  }

  query += ` ORDER BY id DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, media: rows || [] });
  });
});

// -----------------------------------------------------------------------------
// 8. DELETE /api/ortho/media/:mediaId - Delete media attachment
// -----------------------------------------------------------------------------
router.delete('/media/:mediaId', (req, res) => {
  const { mediaId } = req.params;

  db.get(`SELECT * FROM patient_media_attachments WHERE id = ?`, [mediaId], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ success: false, error: 'Файл не найден' });
    }

    db.run(`DELETE FROM patient_media_attachments WHERE id = ?`, [mediaId], (delErr) => {
      if (delErr) {
        return res.status(500).json({ success: false, error: delErr.message });
      }

      // Try unlinking physical file
      try {
        const fullPath = path.resolve(__dirname, '..', row.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (fErr) {
        // ignore
      }

      logOrthoAudit({
        eventType: EventTypes.MEDIA_DELETED,
        patientId: row.patient_id,
        message: `Удален медиафайл #${mediaId} (${row.file_name})`
      });

      res.json({ success: true, message: 'Медиафайл удален' });
    });
  });
});

// -----------------------------------------------------------------------------
// 9. KNOWLEDGE BASE 2.0 REST API: Tests, Diagnostics, Templates CRUD
// -----------------------------------------------------------------------------

// 9.1. GET /api/ortho/tests/catalog - List all validated clinical tests with search, filter, counts, and aliases
router.get('/tests/catalog', (req, res) => {
  const { joint, search, includeInactive, test_type, only_supplemented } = req.query;
  const allowInactive = includeInactive === 'true' || includeInactive === '1' ? 1 : 0;

  let sql = `
    SELECT t.*,
           t.name_ru AS name,
           t.methodology AS technique_description,
           t.positive_criteria AS positive_criterion,
           t.joint_category AS target_joint,
           (SELECT COUNT(*) FROM ortho_template_tests WHERE test_code = t.code) AS templates_count,
           COALESCE(
             (SELECT priority_level FROM ortho_template_tests WHERE test_code = t.code LIMIT 1),
             CASE 
               WHEN t.sensitivity_pct >= 90 OR t.test_type = 'multifactor_cluster' THEN 'high'
               WHEN t.specificity_pct >= 85 THEN 'medium'
               ELSE 'low'
             END
           ) AS priority_level
    FROM ortho_test_catalog t
    WHERE (t.is_active = 1 OR ? = 1)
  `;
  const params = [allowInactive];

  if (joint && joint !== 'all') {
    sql += ` AND t.joint_category = ?`;
    params.push(joint);
  }

  if (test_type && test_type !== 'all') {
    sql += ` AND t.test_type = ?`;
    params.push(test_type);
  }

  if (only_supplemented === 'true' || only_supplemented === '1') {
    sql += ` AND t.is_supplemented = 1`;
  }

  if (search) {
    const term = `%${String(search).trim()}%`;
    sql += ` AND (t.name_ru LIKE ? OR t.name_lat LIKE ? OR t.target_structure LIKE ? OR t.code LIKE ? OR t.methodology LIKE ? OR t.clinical_interpretation LIKE ? OR t.false_positive_factors LIKE ?)`;
    params.push(term, term, term, term, term, term, term);
  }

  sql += ` ORDER BY t.sort_order ASC, t.name_ru ASC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, total: (rows || []).length, tests: rows || [] });
  });
});

// 9.1.1. POST /api/ortho/tests/catalog - Create a new validated orthopedic test
router.post('/tests/catalog', (req, res) => {
  const {
    code,
    name_ru,
    name_lat,
    joint_category,
    target_structure,
    methodology,
    technique_description,
    positive_criteria,
    positive_criterion,
    sensitivity_specificity,
    sensitivity_pct,
    specificity_pct,
    evidence_level,
    patient_position,
    doctor_hand_placement,
    applied_force_direction,
    false_positive_factors,
    clinical_interpretation,
    illustration_key,
    icon_type,
    sort_order
  } = req.body;

  const cleanCode = code ? String(code).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') : '';
  const finalNameRu = (name_ru || '').trim();
  const finalMethodology = (methodology || technique_description || '').trim();
  const finalPositive = (positive_criteria || positive_criterion || '').trim();
  const finalJoint = (joint_category || 'knee').trim();

  if (!cleanCode || !finalNameRu || !finalMethodology || !finalPositive) {
    return res.status(400).json({
      success: false,
      error: 'Обязательные поля: код теста, русское наименование, методика проведения и критерий положительного результата.'
    });
  }

  // Format sensitivity_specificity string if not provided
  let sensSpecStr = sensitivity_specificity;
  if (!sensSpecStr && (sensitivity_pct !== undefined || specificity_pct !== undefined)) {
    sensSpecStr = `Se: ${sensitivity_pct ?? '?'}%, Sp: ${specificity_pct ?? '?'}%`;
  }

  db.run(`
    INSERT INTO ortho_test_catalog (
      code, name_ru, name_lat, joint_category, target_structure,
      methodology, positive_criteria, sensitivity_specificity,
      sensitivity_pct, specificity_pct, evidence_level,
      patient_position, doctor_hand_placement, applied_force_direction,
      false_positive_factors, clinical_interpretation, illustration_key,
      icon_type, is_active, sort_order
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    cleanCode,
    finalNameRu,
    (name_lat || '').trim(),
    finalJoint,
    (target_structure || '').trim(),
    finalMethodology,
    finalPositive,
    sensSpecStr || null,
    sensitivity_pct !== undefined && sensitivity_pct !== '' ? Number(sensitivity_pct) : null,
    specificity_pct !== undefined && specificity_pct !== '' ? Number(specificity_pct) : null,
    evidence_level || 'B',
    patient_position !== undefined ? (patient_position || '').trim() : null,
    doctor_hand_placement !== undefined ? (doctor_hand_placement || '').trim() : null,
    applied_force_direction !== undefined ? (applied_force_direction || '').trim() : null,
    false_positive_factors !== undefined ? (false_positive_factors || '').trim() : null,
    clinical_interpretation !== undefined ? (clinical_interpretation || '').trim() : null,
    illustration_key || 'default_joint',
    icon_type || 'joint_stress',
    sort_order !== undefined && sort_order !== '' ? Number(sort_order) : 50
  ], function(err) {
    if (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ success: false, error: `Тест с кодом "${cleanCode}" уже существует в справочнике.` });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, code: cleanCode, message: 'Ортопедический тест успешно добавлен в справочник.' });
  });
});

// 9.1.2. PUT /api/ortho/tests/catalog/:code - Update orthopedic test
router.put('/tests/catalog/:code', (req, res) => {
  const targetCode = req.params.code;
  const {
    name_ru,
    name_lat,
    joint_category,
    target_structure,
    methodology,
    technique_description,
    positive_criteria,
    positive_criterion,
    sensitivity_specificity,
    sensitivity_pct,
    specificity_pct,
    evidence_level,
    patient_position,
    doctor_hand_placement,
    applied_force_direction,
    false_positive_factors,
    clinical_interpretation,
    illustration_key,
    icon_type,
    is_active,
    sort_order
  } = req.body;

  const finalMethodology = methodology !== undefined ? methodology : technique_description;
  const finalPositive = positive_criteria !== undefined ? positive_criteria : positive_criterion;

  // Recalculate sensSpecStr if pct provided
  let sensSpecStr = sensitivity_specificity;
  if (!sensSpecStr && (sensitivity_pct !== undefined && specificity_pct !== undefined)) {
    sensSpecStr = `Se: ${sensitivity_pct}%, Sp: ${specificity_pct}%`;
  }

  db.run(`
    UPDATE ortho_test_catalog
    SET name_ru = COALESCE(?, name_ru),
        name_lat = COALESCE(?, name_lat),
        joint_category = COALESCE(?, joint_category),
        target_structure = COALESCE(?, target_structure),
        methodology = COALESCE(?, methodology),
        positive_criteria = COALESCE(?, positive_criteria),
        sensitivity_specificity = COALESCE(?, sensitivity_specificity),
        sensitivity_pct = ?,
        specificity_pct = ?,
        evidence_level = COALESCE(?, evidence_level),
        patient_position = COALESCE(?, patient_position),
        doctor_hand_placement = COALESCE(?, doctor_hand_placement),
        applied_force_direction = COALESCE(?, applied_force_direction),
        false_positive_factors = COALESCE(?, false_positive_factors),
        clinical_interpretation = COALESCE(?, clinical_interpretation),
        illustration_key = COALESCE(?, illustration_key),
        icon_type = COALESCE(?, icon_type),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order)
    WHERE code = ?
  `, [
    name_ru ? name_ru.trim() : null,
    name_lat !== undefined ? name_lat.trim() : null,
    joint_category || null,
    target_structure !== undefined ? target_structure.trim() : null,
    finalMethodology !== undefined ? finalMethodology.trim() : null,
    finalPositive !== undefined ? finalPositive.trim() : null,
    sensSpecStr || null,
    sensitivity_pct !== undefined && sensitivity_pct !== '' ? Number(sensitivity_pct) : null,
    specificity_pct !== undefined && specificity_pct !== '' ? Number(specificity_pct) : null,
    evidence_level || null,
    patient_position !== undefined ? patient_position.trim() : null,
    doctor_hand_placement !== undefined ? doctor_hand_placement.trim() : null,
    applied_force_direction !== undefined ? applied_force_direction.trim() : null,
    false_positive_factors !== undefined ? false_positive_factors.trim() : null,
    clinical_interpretation !== undefined ? clinical_interpretation.trim() : null,
    illustration_key || null,
    icon_type || null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    sort_order !== undefined && sort_order !== '' ? Number(sort_order) : null,
    targetCode
  ], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, error: 'Тест не найден.' });
    res.json({ success: true, message: 'Ортопедический тест успешно обновлен.' });
  });
});

// 9.1.3. DELETE /api/ortho/tests/catalog/:code - Delete or deactivate orthopedic test
router.delete('/tests/catalog/:code', (req, res) => {
  const targetCode = req.params.code;
  db.get(`SELECT COUNT(*) AS cnt FROM ortho_template_tests WHERE test_code = ?`, [targetCode], (cntErr, row) => {
    if (cntErr) return res.status(500).json({ success: false, error: cntErr.message });
    const count = row ? row.cnt : 0;
    if (count > 0 && req.query.force !== 'true') {
      // Soft deactivate
      db.run(`UPDATE ortho_test_catalog SET is_active = 0 WHERE code = ?`, [targetCode], (uErr) => {
        if (uErr) return res.status(500).json({ success: false, error: uErr.message });
        return res.json({
          success: true,
          softDeleted: true,
          message: `Тест деактивирован, так как привязан к ${count} шаблонам. Для полного удаления передайте ?force=true.`
        });
      });
      return;
    }

    db.run(`DELETE FROM ortho_template_tests WHERE test_code = ?`, [targetCode], () => {
      db.run(`DELETE FROM ortho_test_catalog WHERE code = ?`, [targetCode], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Ортопедический тест успешно удален из справочника.' });
      });
    });
  });
});


// 9.2. Clinic Services Search from servdict
router.get('/services', (req, res) => {
  const search = req.query.search ? String(req.query.search).trim() : '';
  let sql = `SELECT id, code, name, price, kind FROM servdict WHERE group_f = 0`;
  const params = [];
  if (search) {
    sql += ` AND (name LIKE ? OR code LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ` ORDER BY name ASC LIMIT 150`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, services: rows || [] });
  });
});

// 9.2.1. GET /api/ortho/diagnostics/catalog - List diagnostic & lab methods with servdict details & usage count
router.get('/diagnostics/catalog', (req, res) => {
  const { joint, modality, search, includeInactive } = req.query;
  const allowInactive = includeInactive === 'true' || includeInactive === '1' ? 1 : 0;
  
  let sql = `
    SELECT d.*, 
           sd.name AS servdict_name, 
           sd.price AS servdict_price,
           sd.code AS servdict_code,
           (SELECT COUNT(*) FROM ortho_template_diagnostics WHERE diagnostic_code = d.code) AS templates_count
    FROM diagnostic_methods_catalog d
    LEFT JOIN servdict sd ON sd.id = d.servdict_id
    WHERE (d.is_active = 1 OR ? = 1)
  `;
  const params = [allowInactive];

  if (joint && joint !== 'all') {
    sql += ` AND (d.target_joint = ? OR d.target_joint = 'general')`;
    params.push(joint);
  }
  if (modality && modality !== 'all') {
    sql += ` AND d.modality = ?`;
    params.push(modality);
  }
  if (search && search.trim()) {
    sql += ` AND (d.name LIKE ? OR d.code LIKE ? OR d.protocol_phrase LIKE ?)`;
    params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
  }

  sql += ` ORDER BY d.sort_order ASC, d.name ASC`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, total: (rows || []).length, diagnostics: rows || [] });
  });
});

// 9.2.2. POST /api/ortho/diagnostics/catalog - Create diagnostic method
router.post('/diagnostics/catalog', (req, res) => {
  const {
    code, name, modality, target_joint, servdict_id,
    clinical_indications, protocol_phrase, priority_level = 'primary',
    is_active = 1, sort_order = 0,
    description, technique_details, patient_preparation, diagnostic_criteria, contraindications
  } = req.body;

  if (!code || !name || !modality || !target_joint || !protocol_phrase) {
    return res.status(400).json({ success: false, error: 'Код, наименование, модальность, сустав и текст направления обязательны' });
  }

  const cleanCode = code.trim().toLowerCase().replace(/\s+/g, '_');

  db.run(`
    INSERT INTO diagnostic_methods_catalog (
      code, name, modality, target_joint, servdict_id,
      clinical_indications, protocol_phrase, priority_level, is_active, sort_order,
      description, technique_details, patient_preparation, diagnostic_criteria, contraindications
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    cleanCode, name.trim(), modality, target_joint,
    servdict_id ? Number(servdict_id) : null,
    clinical_indications || null, protocol_phrase.trim(),
    priority_level, is_active ? 1 : 0, Number(sort_order) || 0,
    description || null, technique_details || null, patient_preparation || null,
    diagnostic_criteria || null, contraindications || null
  ], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE') || err.message.includes('PRIMARY')) {
        return res.status(409).json({ success: false, error: `Метод с кодом «${cleanCode}» уже существует` });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, code: cleanCode, message: 'Метод диагностики успешно добавлен в справочник' });
  });
});

// 9.2.3. PUT /api/ortho/diagnostics/catalog/:code - Update diagnostic method
router.put('/diagnostics/catalog/:code', (req, res) => {
  const targetCode = req.params.code;
  const {
    name, modality, target_joint, servdict_id,
    clinical_indications, protocol_phrase, priority_level,
    is_active, sort_order,
    description, technique_details, patient_preparation, diagnostic_criteria, contraindications
  } = req.body;

  db.run(`
    UPDATE diagnostic_methods_catalog
    SET name = COALESCE(?, name),
        modality = COALESCE(?, modality),
        target_joint = COALESCE(?, target_joint),
        servdict_id = ?,
        clinical_indications = ?,
        protocol_phrase = COALESCE(?, protocol_phrase),
        priority_level = COALESCE(?, priority_level),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order),
        description = COALESCE(?, description),
        technique_details = COALESCE(?, technique_details),
        patient_preparation = COALESCE(?, patient_preparation),
        diagnostic_criteria = COALESCE(?, diagnostic_criteria),
        contraindications = COALESCE(?, contraindications)
    WHERE code = ?
  `, [
    name ? name.trim() : null,
    modality || null,
    target_joint || null,
    servdict_id !== undefined ? (servdict_id ? Number(servdict_id) : null) : null,
    clinical_indications !== undefined ? clinical_indications : null,
    protocol_phrase ? protocol_phrase.trim() : null,
    priority_level || null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    sort_order !== undefined ? Number(sort_order) : null,
    description !== undefined ? description : null,
    technique_details !== undefined ? technique_details : null,
    patient_preparation !== undefined ? patient_preparation : null,
    diagnostic_criteria !== undefined ? diagnostic_criteria : null,
    contraindications !== undefined ? contraindications : null,
    targetCode
  ], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, error: 'Метод диагностики не найден' });
    res.json({ success: true, message: 'Метод диагностики успешно обновлен' });
  });
});

// 9.2.4. DELETE /api/ortho/diagnostics/catalog/:code - Delete or deactivate diagnostic method
router.delete('/diagnostics/catalog/:code', (req, res) => {
  const targetCode = req.params.code;
  db.get(`SELECT COUNT(*) AS cnt FROM ortho_template_diagnostics WHERE diagnostic_code = ?`, [targetCode], (cntErr, row) => {
    if (cntErr) return res.status(500).json({ success: false, error: cntErr.message });
    const count = row ? row.cnt : 0;
    if (count > 0 && req.query.force !== 'true') {
      // Soft deactivate
      db.run(`UPDATE diagnostic_methods_catalog SET is_active = 0 WHERE code = ?`, [targetCode], (uErr) => {
        if (uErr) return res.status(500).json({ success: false, error: uErr.message });
        return res.json({
          success: true,
          softDeleted: true,
          message: `Метод деактивирован, так как привязан к ${count} шаблонам. Для полного удаления передайте ?force=true.`
        });
      });
      return;
    }

    db.run(`DELETE FROM ortho_template_diagnostics WHERE diagnostic_code = ?`, [targetCode], () => {
      db.run(`DELETE FROM diagnostic_methods_catalog WHERE code = ?`, [targetCode], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Метод диагностики успешно удален из справочника' });
      });
    });
  });
});

// 9.2.5. GET /api/ortho/clusters - List master clusters with calculated counts
router.get('/clusters', (req, res) => {
  const sql = `
    SELECT oc.*,
      (SELECT COUNT(*) FROM ortho_templates WHERE cluster_id = oc.id AND (is_active = 1 OR is_active IS NULL)) AS templates_count,
      (SELECT COUNT(*) FROM ortho_test_catalog WHERE joint_category = oc.joint_affinity OR (oc.joint_affinity = 'general' AND joint_category = 'general')) AS tests_count,
      (SELECT COUNT(*) FROM diagnostic_methods_catalog WHERE target_joint = oc.joint_affinity OR (oc.joint_affinity = 'general' AND target_joint = 'general')) AS diagnostics_count
    FROM ortho_clusters oc
    WHERE (oc.is_active = 1 OR oc.is_active IS NULL)
    ORDER BY oc.sort_order ASC, oc.id ASC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, total: (rows || []).length, clusters: rows || [] });
  });
});

// 9.2.6. GET /api/ortho/treatments/manipulations - List manipulations catalog with servdict
router.get('/treatments/manipulations', (req, res) => {
  const { joint, search } = req.query;
  let sql = `
    SELECT m.*, sd.name AS servdict_name, sd.price AS servdict_price
    FROM ortho_manipulations_catalog m
    LEFT JOIN servdict sd ON sd.id = m.servdict_id
    WHERE m.is_active = 1
  `;
  const params = [];
  if (joint && joint !== 'all') {
    sql += ` AND (m.target_joint = ? OR m.target_joint = 'general')`;
    params.push(joint);
  }
  if (search && search.trim()) {
    sql += ` AND (m.name LIKE ? OR m.code LIKE ? OR m.description LIKE ?)`;
    params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
  }
  sql += ` ORDER BY m.sort_order ASC, m.name ASC`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, total: (rows || []).length, manipulations: rows || [] });
  });
});

// 9.2.7. GET /api/ortho/treatments/physiotherapy - List physiotherapy catalog with servdict
router.get('/treatments/physiotherapy', (req, res) => {
  const { joint, search } = req.query;
  let sql = `
    SELECT p.*, sd.name AS servdict_name, sd.price AS servdict_price
    FROM ortho_physiotherapy_catalog p
    LEFT JOIN servdict sd ON sd.id = p.servdict_id
    WHERE p.is_active = 1
  `;
  const params = [];
  if (joint && joint !== 'all') {
    sql += ` AND (p.target_joint = ? OR p.target_joint = 'general')`;
    params.push(joint);
  }
  if (search && search.trim()) {
    sql += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.description LIKE ?)`;
    params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
  }
  sql += ` ORDER BY p.sort_order ASC, p.name ASC`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, total: (rows || []).length, physiotherapy: rows || [] });
  });
});

// 9.2.8. GET /api/ortho/treatments/orthotics - List orthotics catalog with servdict
router.get('/treatments/orthotics', (req, res) => {
  const { joint, search } = req.query;
  let sql = `
    SELECT o.*, sd.name AS servdict_name, sd.price AS servdict_price
    FROM ortho_orthotics_catalog o
    LEFT JOIN servdict sd ON sd.id = o.servdict_id
    WHERE o.is_active = 1
  `;
  const params = [];
  if (joint && joint !== 'all') {
    sql += ` AND (o.target_joint = ? OR o.target_joint = 'general')`;
    params.push(joint);
  }
  if (search && search.trim()) {
    sql += ` AND (o.name LIKE ? OR o.code LIKE ? OR o.description LIKE ?)`;
    params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
  }
  sql += ` ORDER BY o.sort_order ASC, o.name ASC`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, total: (rows || []).length, orthotics: rows || [] });
  });
});

// 9.2.9. GET /api/ortho/cdss/physio-blocks - List CDSS safety and risk constraint blocks
router.get('/cdss/physio-blocks', (req, res) => {
  db.all('SELECT * FROM ortho_cdss_physio_blocks ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, blocks: rows || [] });
  });
});

// 9.2.10. GET /api/ortho/treatments/lfk - List LFK catalog exercises with servdict links
router.get('/treatments/lfk', (req, res) => {
  const { joint, type, chain, search } = req.query;
  let sql = `
    SELECT l.*, sd.name AS servdict_name, sd.price AS servdict_price
    FROM ortho_lfk_catalog l
    LEFT JOIN servdict sd ON sd.id = l.servdict_id
    WHERE l.is_active = 1
  `;
  const params = [];
  if (joint && joint !== 'all') {
    sql += ` AND (l.target_joint = ? OR l.target_joint = 'general')`;
    params.push(joint);
  }
  if (type && type !== 'all') {
    sql += ` AND l.exercise_type = ?`;
    params.push(type);
  }
  if (chain && chain !== 'all') {
    sql += ` AND l.kinetic_chain = ?`;
    params.push(chain);
  }
  if (search && search.trim()) {
    sql += ` AND (l.name LIKE ? OR l.code LIKE ? OR l.short_name LIKE ? OR l.technique_description LIKE ? OR l.equipment_tags LIKE ?)`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term, term);
  }
  sql += ` ORDER BY l.target_joint ASC, l.code ASC`;
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, total: (rows || []).length, lfk: rows || [] });
  });
});

// 9.2.11. GET /api/ortho/catalogs/summary - Unified counts for all 8 catalogs
router.get('/catalogs/summary', (req, res) => {
  const sql = `
    SELECT 'templates' as key, COUNT(*) as count FROM ortho_templates WHERE is_active = 1 OR is_active IS NULL
    UNION ALL
    SELECT 'tests' as key, COUNT(*) as count FROM ortho_test_catalog WHERE is_active = 1
    UNION ALL
    SELECT 'diagnostics' as key, COUNT(*) as count FROM diagnostic_methods_catalog WHERE is_active = 1
    UNION ALL
    SELECT 'manipulations' as key, COUNT(*) as count FROM ortho_manipulations_catalog WHERE is_active = 1
    UNION ALL
    SELECT 'physiotherapy' as key, COUNT(*) as count FROM ortho_physiotherapy_catalog WHERE is_active = 1
    UNION ALL
    SELECT 'orthotics' as key, COUNT(*) as count FROM ortho_orthotics_catalog WHERE is_active = 1
    UNION ALL
    SELECT 'lfk' as key, COUNT(*) as count FROM ortho_lfk_catalog WHERE is_active = 1
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const counts = {
      templates: 0,
      rom_joints: 10,
      tests: 0,
      diagnostics: 0,
      manipulations: 0,
      physiotherapy: 0,
      orthotics: 0,
      lfk: 0
    };
    (rows || []).forEach(r => {
      counts[r.key] = r.count;
    });
    res.json({ success: true, counts });
  });
});

// 9.2.12. Manipulations CRUD
router.post('/treatments/manipulations', (req, res) => {
  const {
    code, name, subcategory, target_joint, service_scope = 'internal', default_priority = 'high',
    ebm_priority = 'P2', navigation_type = 'us_guided', anatomical_access = '', drug_class = '',
    is_stop_warning = 0, stop_rationale = '', description = '', technique_details = '',
    regimen_standard = '', patient_preparation = '', post_procedure_care = '',
    clinical_indications = '', contraindications = '', servdict_id = null, sort_order = 0
  } = req.body;

  if (!code || !name || !target_joint) {
    return res.status(400).json({ success: false, error: 'Код, название и сустав обязательны' });
  }

  const sql = `
    INSERT INTO ortho_manipulations_catalog (
      code, name, subcategory, target_joint, service_scope, default_priority,
      ebm_priority, navigation_type, anatomical_access, drug_class,
      is_stop_warning, stop_rationale, description, technique_details,
      regimen_standard, patient_preparation, post_procedure_care,
      clinical_indications, contraindications, servdict_id, sort_order, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;
  db.run(sql, [
    code, name, subcategory || 'Инъекционная терапия', target_joint, service_scope, default_priority,
    ebm_priority, navigation_type, anatomical_access, drug_class,
    is_stop_warning ? 1 : 0, stop_rationale, description, technique_details,
    regimen_standard, patient_preparation, post_procedure_care,
    clinical_indications, contraindications, servdict_id, sort_order
  ], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Создана манипуляция: ${name} (${code})` });
    res.json({ success: true, message: 'Манипуляция успешно создана', code });
  });
});

router.put('/treatments/manipulations/:code', (req, res) => {
  const { code } = req.params;
  const {
    name, subcategory, target_joint, service_scope, default_priority,
    ebm_priority, navigation_type, anatomical_access, drug_class,
    is_stop_warning, stop_rationale, description, technique_details,
    regimen_standard, patient_preparation, post_procedure_care,
    clinical_indications, contraindications, servdict_id, sort_order, is_active
  } = req.body;

  const sql = `
    UPDATE ortho_manipulations_catalog SET
      name = COALESCE(?, name),
      subcategory = COALESCE(?, subcategory),
      target_joint = COALESCE(?, target_joint),
      service_scope = COALESCE(?, service_scope),
      default_priority = COALESCE(?, default_priority),
      ebm_priority = COALESCE(?, ebm_priority),
      navigation_type = COALESCE(?, navigation_type),
      anatomical_access = COALESCE(?, anatomical_access),
      drug_class = COALESCE(?, drug_class),
      is_stop_warning = COALESCE(?, is_stop_warning),
      stop_rationale = COALESCE(?, stop_rationale),
      description = COALESCE(?, description),
      technique_details = COALESCE(?, technique_details),
      regimen_standard = COALESCE(?, regimen_standard),
      patient_preparation = COALESCE(?, patient_preparation),
      post_procedure_care = COALESCE(?, post_procedure_care),
      clinical_indications = COALESCE(?, clinical_indications),
      contraindications = COALESCE(?, contraindications),
      servdict_id = COALESCE(?, servdict_id),
      sort_order = COALESCE(?, sort_order),
      is_active = COALESCE(?, is_active)
    WHERE code = ?
  `;
  db.run(sql, [
    name, subcategory, target_joint, service_scope, default_priority,
    ebm_priority, navigation_type, anatomical_access, drug_class,
    is_stop_warning !== undefined ? (is_stop_warning ? 1 : 0) : null, stop_rationale,
    description, technique_details, regimen_standard, patient_preparation, post_procedure_care,
    clinical_indications, contraindications, servdict_id, sort_order, is_active,
    code
  ], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Обновлена манипуляция: ${code}` });
    res.json({ success: true, message: 'Манипуляция успешно обновлена' });
  });
});

router.delete('/treatments/manipulations/:code', (req, res) => {
  const { code } = req.params;
  db.run(`UPDATE ortho_manipulations_catalog SET is_active = 0 WHERE code = ?`, [code], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Манипуляция ${code} отправлена в архив` });
    res.json({ success: true, message: 'Манипуляция отправлена в архив' });
  });
});

// 9.2.13. Physiotherapy CRUD
router.post('/treatments/physiotherapy', (req, res) => {
  const {
    code, name, subcategory, target_joint, service_scope = 'internal', default_priority = 'high',
    modality_tag, biophysical_profile, evidence_level = '1A', cdss_contraindication_tags, apparatus_examples,
    description = '', technique_details = '', regimen_standard = '', patient_preparation = '',
    post_procedure_care = '', clinical_indications = '', contraindications = '', servdict_id = null, sort_order = 0
  } = req.body;

  if (!code || !name || !target_joint) {
    return res.status(400).json({ success: false, error: 'Код, название и сустав обязательны' });
  }

  const sql = `
    INSERT INTO ortho_physiotherapy_catalog (
      code, name, subcategory, target_joint, service_scope, default_priority,
      modality_tag, biophysical_profile, evidence_level, cdss_contraindication_tags, apparatus_examples,
      description, technique_details, regimen_standard, patient_preparation, post_procedure_care,
      clinical_indications, contraindications, servdict_id, sort_order, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;
  db.run(sql, [
    code, name, subcategory || 'Аппаратная физиотерапия', target_joint, service_scope, default_priority,
    modality_tag, biophysical_profile, evidence_level, cdss_contraindication_tags, apparatus_examples,
    description, technique_details, regimen_standard, patient_preparation, post_procedure_care,
    clinical_indications, contraindications, servdict_id, sort_order
  ], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Создан метод физиотерапии: ${name} (${code})` });
    res.json({ success: true, message: 'Метод физиотерапии успешно создан', code });
  });
});

router.put('/treatments/physiotherapy/:code', (req, res) => {
  const { code } = req.params;
  const {
    name, subcategory, target_joint, service_scope, default_priority,
    modality_tag, biophysical_profile, evidence_level, cdss_contraindication_tags, apparatus_examples,
    description, technique_details, regimen_standard, patient_preparation, post_procedure_care,
    clinical_indications, contraindications, servdict_id, sort_order, is_active
  } = req.body;

  const sql = `
    UPDATE ortho_physiotherapy_catalog SET
      name = COALESCE(?, name),
      subcategory = COALESCE(?, subcategory),
      target_joint = COALESCE(?, target_joint),
      service_scope = COALESCE(?, service_scope),
      default_priority = COALESCE(?, default_priority),
      modality_tag = COALESCE(?, modality_tag),
      biophysical_profile = COALESCE(?, biophysical_profile),
      evidence_level = COALESCE(?, evidence_level),
      cdss_contraindication_tags = COALESCE(?, cdss_contraindication_tags),
      apparatus_examples = COALESCE(?, apparatus_examples),
      description = COALESCE(?, description),
      technique_details = COALESCE(?, technique_details),
      regimen_standard = COALESCE(?, regimen_standard),
      patient_preparation = COALESCE(?, patient_preparation),
      post_procedure_care = COALESCE(?, post_procedure_care),
      clinical_indications = COALESCE(?, clinical_indications),
      contraindications = COALESCE(?, contraindications),
      servdict_id = COALESCE(?, servdict_id),
      sort_order = COALESCE(?, sort_order),
      is_active = COALESCE(?, is_active)
    WHERE code = ?
  `;
  db.run(sql, [
    name, subcategory, target_joint, service_scope, default_priority,
    modality_tag, biophysical_profile, evidence_level, cdss_contraindication_tags, apparatus_examples,
    description, technique_details, regimen_standard, patient_preparation, post_procedure_care,
    clinical_indications, contraindications, servdict_id, sort_order, is_active,
    code
  ], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Обновлен метод физиотерапии: ${code}` });
    res.json({ success: true, message: 'Метод физиотерапии успешно обновлен' });
  });
});

router.delete('/treatments/physiotherapy/:code', (req, res) => {
  const { code } = req.params;
  db.run(`UPDATE ortho_physiotherapy_catalog SET is_active = 0 WHERE code = ?`, [code], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Метод физиотерапии ${code} отправлен в архив` });
    res.json({ success: true, message: 'Метод физиотерапии отправлен в архив' });
  });
});

// 9.2.14. Orthotics CRUD
router.post('/treatments/orthotics', (req, res) => {
  const {
    code, name, subcategory, target_joint, service_scope = 'internal', default_priority = 'high',
    description = '', technique_details = '', regimen_standard = '', patient_preparation = '',
    post_procedure_care = '', clinical_indications = '', contraindications = '', servdict_id = null, sort_order = 0
  } = req.body;

  if (!code || !name || !target_joint) {
    return res.status(400).json({ success: false, error: 'Код, название и сустав обязательны' });
  }

  const sql = `
    INSERT INTO ortho_orthotics_catalog (
      code, name, subcategory, target_joint, service_scope, default_priority,
      description, technique_details, regimen_standard, patient_preparation, post_procedure_care,
      clinical_indications, contraindications, servdict_id, sort_order, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;
  db.run(sql, [
    code, name, subcategory || 'Ортопедические изделия', target_joint, service_scope, default_priority,
    description, technique_details, regimen_standard, patient_preparation, post_procedure_care,
    clinical_indications, contraindications, servdict_id, sort_order
  ], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Создано ортопедическое изделие: ${name} (${code})` });
    res.json({ success: true, message: 'Изделие успешно создано', code });
  });
});

router.put('/treatments/orthotics/:code', (req, res) => {
  const { code } = req.params;
  const {
    name, subcategory, target_joint, service_scope, default_priority,
    description, technique_details, regimen_standard, patient_preparation, post_procedure_care,
    clinical_indications, contraindications, servdict_id, sort_order, is_active
  } = req.body;

  const sql = `
    UPDATE ortho_orthotics_catalog SET
      name = COALESCE(?, name),
      subcategory = COALESCE(?, subcategory),
      target_joint = COALESCE(?, target_joint),
      service_scope = COALESCE(?, service_scope),
      default_priority = COALESCE(?, default_priority),
      description = COALESCE(?, description),
      technique_details = COALESCE(?, technique_details),
      regimen_standard = COALESCE(?, regimen_standard),
      patient_preparation = COALESCE(?, patient_preparation),
      post_procedure_care = COALESCE(?, post_procedure_care),
      clinical_indications = COALESCE(?, clinical_indications),
      contraindications = COALESCE(?, contraindications),
      servdict_id = COALESCE(?, servdict_id),
      sort_order = COALESCE(?, sort_order),
      is_active = COALESCE(?, is_active)
    WHERE code = ?
  `;
  db.run(sql, [
    name, subcategory, target_joint, service_scope, default_priority,
    description, technique_details, regimen_standard, patient_preparation, post_procedure_care,
    clinical_indications, contraindications, servdict_id, sort_order, is_active,
    code
  ], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Обновлено ортопедическое изделие: ${code}` });
    res.json({ success: true, message: 'Изделие успешно обновлено' });
  });
});

router.delete('/treatments/orthotics/:code', (req, res) => {
  const { code } = req.params;
  db.run(`UPDATE ortho_orthotics_catalog SET is_active = 0 WHERE code = ?`, [code], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Ортопедическое изделие ${code} отправлено в архив` });
    res.json({ success: true, message: 'Изделие отправлено в архив' });
  });
});

// 9.2.15. LFK CRUD
router.post('/treatments/lfk', (req, res) => {
  const {
    code, name, short_name, exercise_type, target_joint, target_muscle_group,
    kinetic_chain = 'CKC', default_phase = 'Phase 1', default_stage_step = 'Ступень 1',
    standard_dosage = '3 подхода × 12 повторений', tempo_formula = '3-1-3',
    equipment_tags = '', technique_description = '', contraindications_notes = '', servdict_id = null
  } = req.body;

  if (!code || !name || !target_joint) {
    return res.status(400).json({ success: false, error: 'Код, название и сустав обязательны' });
  }

  const sql = `
    INSERT INTO ortho_lfk_catalog (
      code, name, short_name, exercise_type, target_joint, target_muscle_group,
      kinetic_chain, default_phase, default_stage_step, standard_dosage,
      tempo_formula, equipment_tags, technique_description, contraindications_notes,
      servdict_id, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;
  db.run(sql, [
    code, name, short_name, exercise_type || 'Силовое / Укрепление', target_joint, target_muscle_group,
    kinetic_chain, default_phase, default_stage_step, standard_dosage,
    tempo_formula, equipment_tags, technique_description, contraindications_notes,
    servdict_id
  ], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Создано упражнение ЛФК: ${name} (${code})` });
    res.json({ success: true, message: 'Упражнение ЛФК успешно создано', code });
  });
});

router.put('/treatments/lfk/:code', (req, res) => {
  const { code } = req.params;
  const {
    name, short_name, exercise_type, target_joint, target_muscle_group,
    kinetic_chain, default_phase, default_stage_step, standard_dosage,
    tempo_formula, equipment_tags, technique_description, contraindications_notes,
    servdict_id, is_active
  } = req.body;

  const sql = `
    UPDATE ortho_lfk_catalog SET
      name = COALESCE(?, name),
      short_name = COALESCE(?, short_name),
      exercise_type = COALESCE(?, exercise_type),
      target_joint = COALESCE(?, target_joint),
      target_muscle_group = COALESCE(?, target_muscle_group),
      kinetic_chain = COALESCE(?, kinetic_chain),
      default_phase = COALESCE(?, default_phase),
      default_stage_step = COALESCE(?, default_stage_step),
      standard_dosage = COALESCE(?, standard_dosage),
      tempo_formula = COALESCE(?, tempo_formula),
      equipment_tags = COALESCE(?, equipment_tags),
      technique_description = COALESCE(?, technique_description),
      contraindications_notes = COALESCE(?, contraindications_notes),
      servdict_id = COALESCE(?, servdict_id),
      is_active = COALESCE(?, is_active)
    WHERE code = ?
  `;
  db.run(sql, [
    name, short_name, exercise_type, target_joint, target_muscle_group,
    kinetic_chain, default_phase, default_stage_step, standard_dosage,
    tempo_formula, equipment_tags, technique_description, contraindications_notes,
    servdict_id, is_active,
    code
  ], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Обновлено упражнение ЛФК: ${code}` });
    res.json({ success: true, message: 'Упражнение ЛФК успешно обновлено' });
  });
});

router.delete('/treatments/lfk/:code', (req, res) => {
  const { code } = req.params;
  db.run(`UPDATE ortho_lfk_catalog SET is_active = 0 WHERE code = ?`, [code], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({ eventType: EventTypes.PROTOCOL_SAVED, message: `Упражнение ЛФК ${code} отправлено в архив` });
    res.json({ success: true, message: 'Упражнение ЛФК отправлено в архив' });
  });
});

// 9.3. GET /api/ortho/templates/detailed - List templates with counts, cluster metadata & filters
router.get('/templates/detailed', (req, res) => {
  const { joint, search, cluster, with_details, only_custom, rom_priority, manipulations_priority, orthotics_priority, orthotics_weight_bearing, lfk_priority, lfk_pain_monitoring_zone } = req.query;
  let sql = `
    SELECT ot.*,
      (SELECT COUNT(*) FROM ortho_template_tests WHERE template_id = ot.id) AS tests_count,
      (SELECT COUNT(*) FROM ortho_template_diagnostics WHERE template_id = ot.id) AS diagnostics_count,
      (SELECT COUNT(*) FROM ortho_template_manipulations WHERE template_id = ot.id) AS manipulations_count,
      (SELECT COUNT(*) FROM ortho_template_physiotherapy WHERE template_id = ot.id) AS physiotherapy_count,
      (SELECT COUNT(*) FROM ortho_template_orthotics WHERE template_id = ot.id) AS orthotics_count,
      (SELECT COUNT(*) FROM ortho_template_lfk WHERE template_id = ot.id) AS lfk_count
    FROM ortho_templates ot
    WHERE (ot.is_active = 1 OR ot.is_active IS NULL)
  `;
  const params = [];
  if (cluster && cluster !== 'all') {
    sql += ` AND ot.cluster_id = ?`;
    params.push(cluster);
  }
  if (joint && joint !== 'all') {
    sql += ` AND ot.joint_name = ?`;
    params.push(joint);
  }
  if (rom_priority && rom_priority !== 'all') {
    sql += ` AND ot.rom_priority = ?`;
    params.push(rom_priority);
  }
  if (manipulations_priority && manipulations_priority !== 'all') {
    sql += ` AND ot.manipulations_priority = ?`;
    params.push(manipulations_priority);
  }
  if (orthotics_priority && orthotics_priority !== 'all') {
    sql += ` AND ot.orthotics_priority = ?`;
    params.push(orthotics_priority);
  }
  if (orthotics_weight_bearing && orthotics_weight_bearing !== 'all') {
    sql += ` AND ot.orthotics_weight_bearing = ?`;
    params.push(orthotics_weight_bearing);
  }
  if (lfk_priority && lfk_priority !== 'all') {
    sql += ` AND ot.lfk_priority = ?`;
    params.push(lfk_priority);
  }
  if (lfk_pain_monitoring_zone && lfk_pain_monitoring_zone !== 'all') {
    sql += ` AND ot.lfk_pain_monitoring_zone = ?`;
    params.push(lfk_pain_monitoring_zone);
  }
  if (only_custom === 'true' || only_custom === '1') {
    sql += ` AND ot.is_custom = 1`;
  }
  if (search) {
    const sLower = search.trim().toLowerCase();
    const isCustomKeyword = ['кастом', 'custom', 'автор'].some(k => sLower.includes(k));
    if (isCustomKeyword) {
      sql += ` AND (ot.title LIKE ? OR ot.default_mkb_code LIKE ? OR ot.stage_or_severity LIKE ? OR ot.category LIKE ? OR ot.clinical_tags LIKE ? OR ot.author_doctor_name LIKE ? OR ot.is_custom = 1)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    } else {
      sql += ` AND (ot.title LIKE ? OR ot.default_mkb_code LIKE ? OR ot.stage_or_severity LIKE ? OR ot.category LIKE ? OR ot.clinical_tags LIKE ? OR ot.author_doctor_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
  }
  sql += ` ORDER BY ot.is_custom DESC, ot.sort_order ASC, ot.id ASC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const templates = rows || [];

    if (!with_details || templates.length === 0) {
      return res.json({ success: true, total: templates.length, templates });
    }

    const tIds = templates.map(t => t.id);
    const placeholders = tIds.map(() => '?').join(',');

    const testsSql = `
      SELECT ott.template_id, ott.test_code, ott.expected_result, ott.is_mandatory,
             ott.priority_level, ott.test_type_tag, ott.is_supplemented,
             otc.name_ru, otc.name_lat, otc.test_type, otc.sensitivity_pct, otc.specificity_pct,
             otc.target_structure, otc.evidence_level
      FROM ortho_template_tests ott
      JOIN ortho_test_catalog otc ON otc.code = ott.test_code
      WHERE ott.template_id IN (${placeholders})
      ORDER BY 
        CASE ott.priority_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
        ott.sort_order ASC
    `;

    const diagSql = `
      SELECT otd.template_id, otd.diagnostic_code, otd.urgency, otd.is_primary, otd.priority_level,
             dmc.name, dmc.modality, dmc.target_joint, dmc.clinical_indications, dmc.protocol_phrase,
             dmc.priority_level AS catalog_priority_level,
             dmc.description, dmc.technique_details, dmc.patient_preparation,
             dmc.diagnostic_criteria, dmc.contraindications
      FROM ortho_template_diagnostics otd
      JOIN diagnostic_methods_catalog dmc ON dmc.code = otd.diagnostic_code
      WHERE otd.template_id IN (${placeholders})
      ORDER BY 
        CASE otd.priority_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
        otd.sort_order ASC
    `;

    db.all(testsSql, tIds, (errTests, testRows) => {
      const testsMap = {};
      (testRows || []).forEach(tr => {
        if (!testsMap[tr.template_id]) testsMap[tr.template_id] = [];
        testsMap[tr.template_id].push({
          code: tr.test_code,
          name: tr.name_ru,
          name_lat: tr.name_lat,
          expected: tr.expected_result,
          mandatory: tr.is_mandatory,
          priority_level: tr.priority_level || 'medium',
          test_type: tr.test_type || tr.test_type_tag || 'provocative',
          test_type_tag: tr.test_type_tag || tr.test_type || 'provocative',
          is_supplemented: Boolean(tr.is_supplemented),
          sensitivity_pct: tr.sensitivity_pct,
          specificity_pct: tr.specificity_pct,
          target_structure: tr.target_structure,
          evidence_level: tr.evidence_level
        });
      });

      db.all(diagSql, tIds, (errDiags, diagRows) => {
        const diagsMap = {};
        (diagRows || []).forEach(dr => {
          if (!diagsMap[dr.template_id]) diagsMap[dr.template_id] = [];
          diagsMap[dr.template_id].push({
            code: dr.diagnostic_code,
            name: dr.name,
            modality: dr.modality,
            target_joint: dr.target_joint,
            clinical_indications: dr.clinical_indications,
            protocol_phrase: dr.protocol_phrase,
            urgency: dr.urgency,
            is_primary: dr.is_primary,
            priority_level: dr.priority_level || dr.catalog_priority_level || 'medium',
            description: dr.description,
            technique_details: dr.technique_details,
            patient_preparation: dr.patient_preparation,
            diagnostic_criteria: dr.diagnostic_criteria,
            contraindications: dr.contraindications
          });
        });

        const fullTemplates = templates.map(t => {
          let parsedRom = null;
          try {
            parsedRom = typeof t.rom_norm_preset === 'string' ? JSON.parse(t.rom_norm_preset) : t.rom_norm_preset;
          } catch {}
          let parsedTags = [];
          try {
            parsedTags = typeof t.clinical_tags === 'string' ? JSON.parse(t.clinical_tags) : (t.clinical_tags || []);
          } catch {
            parsedTags = t.clinical_tags ? [t.clinical_tags] : [];
          }

          return {
            id: t.id,
            title: t.title,
            jointCategory: t.joint_name,
            mkbCode: t.default_mkb_code || '',
            category: t.category || '',
            cluster_id: t.cluster_id || '',
            cluster_name: t.cluster_name || '',
            stage_or_severity: t.stage_or_severity || '',
            is_custom: Boolean(t.is_custom),
            author_doctor_name: t.author_doctor_name || '',
            clinical_tags: parsedTags,
            side: t.default_side || 'right',
            complaints: t.complaints_template || '',
            objective: t.objective_template || '',
            anamnesis_vitae: t.anamnesis_vitae_template || '',
            objective_status: t.objective_status_template || '',
            special_studies: t.special_studies_template || '',
            performed_manipulations: t.performed_manipulations_template || '',
            default_sections_mask: t.default_sections_mask || '',
            recommendations: t.recommendations_template || '',
            rom: parsedRom,
            tests: testsMap[t.id] || [],
            diagnostics: diagsMap[t.id] || []
          };
        });

        res.json({ success: true, total: fullTemplates.length, templates: fullTemplates });
      });
    });
  });
});

// 9.4. GET /api/ortho/templates/:id/full - Get single template with joined tests & diagnostics
router.get('/templates/:id/full', (req, res) => {
  const templateId = req.params.id;
  db.get(`SELECT * FROM ortho_templates WHERE id = ?`, [templateId], (err, template) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!template) return res.status(404).json({ success: false, error: 'Шаблон не найден' });

    // Fetch tests
    const testsSql = `
      SELECT ott.id, ott.test_code, ott.expected_result, ott.is_mandatory, ott.sort_order,
             ott.priority_level, ott.test_type_tag, ott.is_supplemented,
             otc.name_ru, otc.name_lat, otc.joint_category, otc.target_structure,
             otc.methodology, otc.positive_criteria, otc.sensitivity_specificity, otc.icon_type,
             otc.test_type, otc.is_supplemented AS catalog_is_supplemented,
             otc.patient_position, otc.doctor_hand_placement, otc.applied_force_direction,
             otc.false_positive_factors, otc.clinical_interpretation,
             otc.sensitivity_pct, otc.specificity_pct, otc.evidence_level
      FROM ortho_template_tests ott
      JOIN ortho_test_catalog otc ON otc.code = ott.test_code
      WHERE ott.template_id = ?
      ORDER BY 
        CASE ott.priority_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
        ott.sort_order ASC, ott.id ASC
    `;
    db.all(testsSql, [templateId], (tErr, tests) => {
      if (tErr) return res.status(500).json({ success: false, error: tErr.message });

      // Fetch diagnostics
      const diagSql = `
        SELECT otd.id, otd.diagnostic_code, otd.urgency, otd.default_side, otd.is_primary, otd.sort_order,
               otd.priority_level,
               dmc.name, dmc.modality, dmc.target_joint, dmc.servdict_id, dmc.clinical_indications,
               dmc.protocol_phrase, dmc.priority_level AS catalog_priority_level,
               dmc.description, dmc.technique_details, dmc.patient_preparation,
               dmc.diagnostic_criteria, dmc.contraindications,
               sd.price AS servdict_price, sd.name AS servdict_name
        FROM ortho_template_diagnostics otd
        JOIN diagnostic_methods_catalog dmc ON dmc.code = otd.diagnostic_code
        LEFT JOIN servdict sd ON sd.id = dmc.servdict_id
        WHERE otd.template_id = ?
        ORDER BY 
          CASE otd.priority_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
          otd.sort_order ASC, otd.id ASC
      `;
      db.all(diagSql, [templateId], (dErr, diagnostics) => {
        if (dErr) return res.status(500).json({ success: false, error: dErr.message });

        const manSql = `
          SELECT otm.id, otm.manipulation_code, otm.dosage_or_regimen, otm.is_mandatory, otm.sort_order,
                 otm.priority_level, otm.service_scope,
                 otm.ebm_priority, otm.navigation_type, otm.anatomical_access, otm.drug_class,
                 otm.is_stop_warning, otm.stop_rationale, otm.clinical_indications AS otm_clinical_indications,
                 mc.name, mc.subcategory, mc.target_joint, mc.description, mc.technique_details,
                 mc.regimen_standard, mc.patient_preparation, mc.post_procedure_care,
                 mc.clinical_indications, mc.contraindications, mc.servdict_id, mc.servdict_code,
                 mc.ebm_priority AS cat_ebm_priority, mc.navigation_type AS cat_navigation_type,
                 mc.anatomical_access AS cat_anatomical_access, mc.drug_class AS cat_drug_class,
                 mc.is_stop_warning AS cat_is_stop_warning, mc.stop_rationale AS cat_stop_rationale,
                 mc.cdss_contraindication_tags,
                 sd.price AS servdict_price, sd.name AS servdict_name
          FROM ortho_template_manipulations otm
          JOIN ortho_manipulations_catalog mc ON mc.code = otm.manipulation_code
          LEFT JOIN servdict sd ON sd.id = mc.servdict_id
          WHERE otm.template_id = ?
          ORDER BY 
            CASE otm.ebm_priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'P3' THEN 3 WHEN 'P0-STOP' THEN 4 ELSE 5 END ASC,
            CASE otm.priority_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
            otm.sort_order ASC, otm.id ASC
        `;

        const physSql = `
          SELECT otp.id, otp.physiotherapy_code, otp.dosage_or_regimen, otp.is_mandatory, otp.sort_order,
                 otp.priority_level, otp.service_scope,
                 otp.ebm_priority, otp.line_order, otp.target_anatomical_landmark, otp.exact_dosimetry,
                 otp.is_stop_warning, otp.stop_rationale,
                 pc.name, pc.subcategory, pc.target_joint, pc.description, pc.technique_details,
                 pc.regimen_standard, pc.patient_preparation, pc.post_procedure_care,
                 pc.clinical_indications, pc.contraindications, pc.servdict_id, pc.servdict_code,
                 pc.modality_tag, pc.evidence_level, pc.apparatus_examples, pc.biophysical_profile, pc.cdss_contraindication_tags,
                 sd.price AS servdict_price, sd.name AS servdict_name
          FROM ortho_template_physiotherapy otp
          JOIN ortho_physiotherapy_catalog pc ON pc.code = otp.physiotherapy_code
          LEFT JOIN servdict sd ON sd.id = pc.servdict_id
          WHERE otp.template_id = ?
          ORDER BY 
            CASE otp.ebm_priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 WHEN 'STOP' THEN 3 ELSE 4 END ASC,
            otp.line_order ASC,
            CASE otp.priority_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
            otp.sort_order ASC, otp.id ASC
        `;

        const orthSql = `
          SELECT oto.id, oto.orthotics_code, oto.dosage_or_regimen, oto.is_mandatory, oto.sort_order,
                 oto.priority_level, oto.service_scope,
                 oto.ebm_priority, oto.weight_bearing_mode, oto.device_type_iso,
                 oto.hinge_settings, oto.wearing_regimen, oto.is_stop_warning,
                 oto.stop_rationale, oto.cdss_contraindication_tags,
                 oc.name, oc.subcategory, oc.target_joint, oc.description, oc.technique_details,
                 oc.regimen_standard, oc.patient_preparation, oc.post_procedure_care,
                 oc.clinical_indications, oc.contraindications, oc.servdict_id, oc.servdict_code,
                 sd.price AS servdict_price, sd.name AS servdict_name
          FROM ortho_template_orthotics oto
          JOIN ortho_orthotics_catalog oc ON oc.code = oto.orthotics_code
          LEFT JOIN servdict sd ON sd.id = oc.servdict_id
          WHERE oto.template_id = ?
          ORDER BY 
            CASE 
              WHEN oto.is_stop_warning = 1 OR oto.ebm_priority = 'P0-STOP' THEN 0
              WHEN oto.ebm_priority = 'P1' THEN 1
              WHEN oto.ebm_priority = 'P2' THEN 2
              WHEN oto.ebm_priority = 'P3' THEN 3
              ELSE 4
            END ASC,
            CASE oto.priority_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
            oto.sort_order ASC, oto.id ASC
        `;

        const lfkSql = `
          SELECT otl.id, otl.template_id, otl.lfk_code, otl.phase_number, otl.phase_name,
                 otl.stage_step, otl.exercise_order, otl.exercise_name_override,
                 otl.dosage_prescription, otl.tempo_and_hold, otl.frequency_per_day,
                 otl.biomechanical_goal, otl.ebm_priority, otl.pain_threshold_zone,
                 otl.kinetic_chain, otl.safe_angle_range, otl.tags,
                 otl.is_stop_warning, otl.stop_rationale, otl.sort_order,
                 lc.name, lc.short_name, lc.exercise_type, lc.target_joint,
                 lc.target_muscle_group, lc.default_stage_step, lc.standard_dosage,
                 lc.tempo_formula, lc.equipment_tags, lc.technique_description,
                 lc.contraindications_notes
          FROM ortho_template_lfk otl
          JOIN ortho_lfk_catalog lc ON lc.code = otl.lfk_code
          WHERE otl.template_id = ?
          ORDER BY 
            CASE 
              WHEN otl.is_stop_warning = 1 OR otl.ebm_priority = 'P0-STOP' THEN 0
              ELSE otl.phase_number
            END ASC,
            otl.exercise_order ASC, otl.sort_order ASC, otl.id ASC
        `;

        db.all(manSql, [templateId], (mErr, manipulations) => {
          if (mErr) return res.status(500).json({ success: false, error: mErr.message });

          db.all(physSql, [templateId], (pErr, physiotherapy) => {
            if (pErr) return res.status(500).json({ success: false, error: pErr.message });

            db.all(orthSql, [templateId], (oErr, orthotics) => {
              if (oErr) return res.status(500).json({ success: false, error: oErr.message });

              db.all(lfkSql, [templateId], (lErr, lfk) => {
                if (lErr) return res.status(500).json({ success: false, error: lErr.message });

                res.json({
                  success: true,
                  template: {
                    ...template,
                    tests: tests || [],
                    diagnostics: diagnostics || [],
                    manipulations: manipulations || [],
                    physiotherapy: physiotherapy || [],
                    orthotics: orthotics || [],
                    lfk: lfk || []
                  }
                });
              });
            });
          });
        });
      });
    });
  });
});

// 9.5. POST /api/ortho/templates - Create new template with relational tests and diagnostics
router.post('/templates', (req, res) => {
  const {
    title, joint_name, default_mkb_code, template_json, category,
    default_side, complaints_template, anamnesis_template, objective_template,
    anamnesis_vitae_template, objective_status_template, special_studies_template,
    performed_manipulations_template, default_sections_mask,
    rom_norm_preset, rom_priority, rom_sftr_preview, rom_end_feel, rom_has_stop_warning,
    manipulations_priority, manipulations_summary, manipulations_has_stop, manipulations_stop_rationale,
    orthotics_priority, orthotics_weight_bearing, orthotics_summary, orthotics_has_stop, orthotics_stop_rationale,
    lfk_priority, lfk_has_stop, lfk_stop_rationale, lfk_pain_monitoring_zone, lfk_target_goal, lfk_phases_summary,
    recommendations_template, cluster_id, cluster_name,
    stage_or_severity, clinical_tags, tests = [], diagnostics = [],
    manipulations = [], physiotherapy = [], orthotics = [], lfk = []
  } = req.body;

  if (!title || !joint_name) {
    return res.status(400).json({ success: false, error: 'Поля title и joint_name обязательны' });
  }

  const rawJson = typeof template_json === 'object' ? JSON.stringify(template_json) : (template_json || '{}');
  const romPresetStr = typeof rom_norm_preset === 'object' ? JSON.stringify(rom_norm_preset) : rom_norm_preset;
  const tagsStr = Array.isArray(clinical_tags) ? JSON.stringify(clinical_tags) : (clinical_tags || null);
  const maskStr = typeof default_sections_mask === 'object' ? JSON.stringify(default_sections_mask) : (default_sections_mask || null);

  const isCustomVal = req.body.is_custom ? 1 : (category === 'Кастомизированный шаблон' ? 1 : 0);
  const authorDoctorNameVal = req.body.author_doctor_name || null;

  db.run(`
    INSERT INTO ortho_templates (
      title, joint_name, default_mkb_code, template_json, category,
      default_side, complaints_template, anamnesis_template, objective_template,
      anamnesis_vitae_template, objective_status_template, special_studies_template,
      performed_manipulations_template, default_sections_mask,
      rom_norm_preset, rom_priority, rom_sftr_preview, rom_end_feel, rom_has_stop_warning,
      manipulations_priority, manipulations_summary, manipulations_has_stop, manipulations_stop_rationale,
      orthotics_priority, orthotics_weight_bearing, orthotics_summary, orthotics_has_stop, orthotics_stop_rationale,
      lfk_priority, lfk_has_stop, lfk_stop_rationale, lfk_pain_monitoring_zone, lfk_target_goal, lfk_phases_summary,
      recommendations_template, is_active, sort_order,
      cluster_id, cluster_name, stage_or_severity, clinical_tags,
      is_custom, author_doctor_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?)
  `, [
    title, joint_name, default_mkb_code || null, rawJson, category || null,
    default_side || 'right', complaints_template || null, anamnesis_template || null,
    objective_template || null,
    anamnesis_vitae_template || null, objective_status_template || null, special_studies_template || null,
    performed_manipulations_template || null, maskStr,
    romPresetStr || null, rom_priority || 'P2', rom_sftr_preview || '', rom_end_feel || '', rom_has_stop_warning ? 1 : 0,
    manipulations_priority || 'P2', manipulations_summary || '', manipulations_has_stop ? 1 : 0, manipulations_stop_rationale || '',
    orthotics_priority || 'P2', orthotics_weight_bearing || 'WBAT', orthotics_summary || '', orthotics_has_stop ? 1 : 0, orthotics_stop_rationale || '',
    lfk_priority || 'P1', lfk_has_stop ? 1 : 0, lfk_stop_rationale || '', lfk_pain_monitoring_zone || 'green', lfk_target_goal || '', lfk_phases_summary || '',
    recommendations_template || null,
    cluster_id || null, cluster_name || null, stage_or_severity || null, tagsStr,
    isCustomVal, authorDoctorNameVal
  ], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const newId = this.lastID;

    // Insert tests
    if (Array.isArray(tests) && tests.length > 0) {
      const tStmt = db.prepare(`
        INSERT INTO ortho_template_tests (
          template_id, test_code, expected_result, is_mandatory, sort_order,
          priority_level, test_type_tag, is_supplemented
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      tests.forEach((t, i) => {
        tStmt.run([
          newId,
          t.test_code || t.code,
          t.expected_result || t.expected || 'positive',
          t.is_mandatory ?? 1,
          i * 10,
          t.priority_level || 'medium',
          t.test_type_tag || t.test_type || null,
          t.is_supplemented ? 1 : 0
        ]);
      });
      tStmt.finalize();
    }

    // Insert diagnostics
    if (Array.isArray(diagnostics) && diagnostics.length > 0) {
      const dStmt = db.prepare(`
        INSERT INTO ortho_template_diagnostics (
          template_id, diagnostic_code, urgency, default_side, is_primary, sort_order, priority_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      diagnostics.forEach((d, i) => {
        dStmt.run([
          newId,
          d.diagnostic_code || d.code,
          d.urgency || 'routine',
          d.default_side || default_side || 'affected',
          d.is_primary ?? 1,
          i * 10,
          d.priority_level || 'medium'
        ]);
      });
      dStmt.finalize();
    }

    // Insert manipulations
    if (Array.isArray(manipulations) && manipulations.length > 0) {
      const mStmt = db.prepare(`
        INSERT INTO ortho_template_manipulations (
          template_id, manipulation_code, dosage_or_regimen, is_mandatory, sort_order, priority_level, service_scope,
          ebm_priority, navigation_type, anatomical_access, drug_class, is_stop_warning, stop_rationale, clinical_indications
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      manipulations.forEach((m, i) => {
        const scope = m.service_scope || 'internal';
        const priority = scope === 'internal' ? 'high' : (m.priority_level || 'medium');
        mStmt.run([
          newId,
          m.manipulation_code || m.code,
          m.dosage_or_regimen || m.regimen || null,
          m.is_mandatory ?? 1,
          i * 10,
          priority,
          scope,
          m.ebm_priority || 'P2',
          m.navigation_type || 'us_guided',
          m.anatomical_access || '',
          m.drug_class || '',
          m.is_stop_warning ? 1 : 0,
          m.stop_rationale || '',
          m.clinical_indications || ''
        ]);
      });
      mStmt.finalize();
    }

    // Insert physiotherapy
    if (Array.isArray(physiotherapy) && physiotherapy.length > 0) {
      const pStmt = db.prepare(`
        INSERT INTO ortho_template_physiotherapy (
          template_id, physiotherapy_code, dosage_or_regimen, is_mandatory, sort_order, priority_level, service_scope,
          ebm_priority, line_order, target_anatomical_landmark, exact_dosimetry, is_stop_warning, stop_rationale
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      physiotherapy.forEach((p, i) => {
        const scope = p.service_scope || 'internal';
        const priority = scope === 'internal' ? 'high' : (p.priority_level || 'medium');
        pStmt.run([
          newId,
          p.physiotherapy_code || p.code,
          p.dosage_or_regimen || p.regimen || null,
          p.is_mandatory ?? 1,
          p.sort_order ?? (i * 10),
          priority,
          scope,
          p.ebm_priority || null,
          p.line_order || (i + 1),
          p.target_anatomical_landmark || null,
          p.exact_dosimetry || null,
          p.is_stop_warning ? 1 : 0,
          p.stop_rationale || null
        ]);
      });
      pStmt.finalize();
    }

    // Insert orthotics
    if (Array.isArray(orthotics) && orthotics.length > 0) {
      const oStmt = db.prepare(`
        INSERT INTO ortho_template_orthotics (
          template_id, orthotics_code, dosage_or_regimen, is_mandatory, sort_order, priority_level, service_scope,
          ebm_priority, weight_bearing_mode, device_type_iso, hinge_settings, wearing_regimen, is_stop_warning, stop_rationale, cdss_contraindication_tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      orthotics.forEach((o, i) => {
        const scope = o.service_scope || 'internal';
        const priority = scope === 'internal' ? 'high' : (o.priority_level || 'medium');
        oStmt.run([
          newId,
          o.orthotics_code || o.code,
          o.dosage_or_regimen || o.regimen || o.wearing_regimen || null,
          o.is_mandatory ?? 1,
          i * 10,
          priority,
          scope,
          o.ebm_priority || 'P2',
          o.weight_bearing_mode || 'WBAT',
          o.device_type_iso || 'FO',
          o.hinge_settings || 'Стандарт',
          o.wearing_regimen || o.dosage_or_regimen || 'По клиническому регламенту',
          o.is_stop_warning ? 1 : 0,
          o.stop_rationale || '',
          JSON.stringify([o.device_type_iso, o.weight_bearing_mode, o.ebm_priority])
        ]);
      });
      oStmt.finalize();
    }

    // Insert lfk
    if (Array.isArray(lfk) && lfk.length > 0) {
      const lStmt = db.prepare(`
        INSERT INTO ortho_template_lfk (
          template_id, lfk_code, phase_number, phase_name, stage_step, exercise_order,
          exercise_name_override, dosage_prescription, tempo_and_hold, frequency_per_day,
          biomechanical_goal, ebm_priority, pain_threshold_zone, kinetic_chain,
          safe_angle_range, tags, is_stop_warning, stop_rationale, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      lfk.forEach((l, i) => {
        lStmt.run([
          newId,
          l.lfk_code || l.code,
          l.phase_number || 1,
          l.phase_name || 'Фаза I',
          l.stage_step || 'Ступень 1',
          l.exercise_order || (i + 1),
          l.exercise_name_override || l.name || null,
          l.dosage_prescription || l.dosage || '3 подхода × 12 повторений',
          l.tempo_and_hold || null,
          l.frequency_per_day || '2–3 раза в день',
          l.biomechanical_goal || null,
          l.ebm_priority || 'P1',
          l.pain_threshold_zone || 'green',
          l.kinetic_chain || 'CKC',
          l.safe_angle_range || null,
          l.tags || null,
          l.is_stop_warning ? 1 : 0,
          l.stop_rationale || null,
          l.sort_order ?? (i * 10)
        ]);
      });
      lStmt.finalize();
    }

    logOrthoAudit({
      eventType: EventTypes.PROTOCOL_SAVED,
      message: `Создан новый шаблон осмотра #${newId}: "${title}" (${joint_name})`
    });

    res.json({ success: true, id: newId, message: 'Шаблон успешно создан' });
  });
});

// 9.5.1. POST /api/ortho/templates/save-from-workstation - Save patient protocol exam as a customized template
router.post('/templates/save-from-workstation', (req, res) => {
  const {
    title,
    joint_name,
    cluster_id,
    cluster_name,
    default_mkb_code,
    category = 'Кастомизированный шаблон',
    author_doctor_name = 'Врач травматолог-ортопед',
    clinical_tags = ['custom', 'авторский'],
    stage_or_severity,
    default_side = 'right',
    complaints_template,
    anamnesis_template,
    anamnesis_vitae_template,
    objective_template,
    objective_status_template,
    special_studies_template,
    performed_manipulations_template,
    recommendations_template,
    default_sections_mask,
    rom_norm_preset,
    tests = [],
    diagnostics = []
  } = req.body;

  if (!title || !joint_name) {
    return res.status(400).json({ success: false, error: 'Название шаблона и сустав обязательны' });
  }

  // Ensure 'custom' and 'авторский' tags are present
  let tagsList = Array.isArray(clinical_tags) ? [...clinical_tags] : (typeof clinical_tags === 'string' ? [clinical_tags] : []);
  if (!tagsList.includes('custom')) tagsList.unshift('custom');
  if (!tagsList.includes('авторский')) tagsList.push('авторский');
  const tagsStr = JSON.stringify(tagsList);

  const maskStr = typeof default_sections_mask === 'object' ? JSON.stringify(default_sections_mask) : (default_sections_mask || null);
  const romPresetStr = typeof rom_norm_preset === 'object' ? JSON.stringify(rom_norm_preset) : (rom_norm_preset || null);
  const rawTemplateJson = JSON.stringify({
    title,
    joint_name,
    category,
    is_custom: 1,
    author_doctor_name,
    saved_from_workstation: true,
    saved_at: new Date().toISOString()
  });

  const insertSql = `
    INSERT INTO ortho_templates (
      title, joint_name, default_mkb_code, template_json, category,
      default_side, complaints_template, anamnesis_template, objective_template,
      anamnesis_vitae_template, objective_status_template, special_studies_template,
      performed_manipulations_template, default_sections_mask,
      rom_norm_preset, recommendations_template, is_active, sort_order,
      cluster_id, cluster_name, stage_or_severity, clinical_tags,
      is_custom, author_doctor_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, 1, ?)
  `;

  const insertParams = [
    title, joint_name, default_mkb_code || null, rawTemplateJson, category,
    default_side, complaints_template || null, anamnesis_template || null, objective_template || null,
    anamnesis_vitae_template || null, objective_status_template || null, special_studies_template || null,
    performed_manipulations_template || null, maskStr,
    romPresetStr, recommendations_template || null,
    cluster_id || null, cluster_name || null, stage_or_severity || null, tagsStr,
    author_doctor_name
  ];

  db.run(insertSql, insertParams, function(err) {
    if (err) {
      console.error('Error saving template from workstation:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    const newId = this.lastID;

    // Save relational tests if provided
    if (Array.isArray(tests) && tests.length > 0) {
      const tStmt = db.prepare(`
        INSERT INTO ortho_template_tests (
          template_id, test_code, expected_result, is_mandatory, sort_order,
          priority_level, test_type_tag, is_supplemented
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      tests.forEach((t, i) => {
        const code = t.test_code || t.code;
        if (code) {
          tStmt.run([
            newId,
            code,
            t.expected_result || t.expected || 'positive',
            t.is_mandatory ?? 1,
            i * 10,
            t.priority_level || 'medium',
            t.test_type_tag || t.test_type || null,
            t.is_supplemented ? 1 : 0
          ]);
        }
      });
      tStmt.finalize();
    }

    // Save relational diagnostics if provided
    if (Array.isArray(diagnostics) && diagnostics.length > 0) {
      const dStmt = db.prepare(`
        INSERT INTO ortho_template_diagnostics (
          template_id, diagnostic_code, urgency, default_side, is_primary, sort_order, priority_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      diagnostics.forEach((d, i) => {
        const code = d.diagnostic_code || d.code;
        if (code) {
          dStmt.run([
            newId,
            code,
            d.urgency || 'routine',
            d.default_side || default_side,
            d.is_primary ? 1 : 0,
            i * 10,
            d.priority_level || 'medium'
          ]);
        }
      });
      dStmt.finalize();
    }

    logOrthoAudit({
      eventType: EventTypes.PROTOCOL_SAVED,
      message: `Создан кастомизированный шаблон #${newId} "${title}" (Кластер: ${cluster_name || cluster_id}, Автор: ${author_doctor_name})`
    });

    res.json({
      success: true,
      id: newId,
      template: {
        id: newId,
        title,
        joint_name,
        cluster_id,
        cluster_name,
        category,
        is_custom: true,
        author_doctor_name,
        clinical_tags: tagsList
      },
      message: 'Кастомизированный шаблон успешно сохранен в Кластер!'
    });
  });
});

// 9.6. PUT /api/ortho/templates/:id - Update template & cascade tests and diagnostics
router.put('/templates/:id', (req, res) => {
  const templateId = req.params.id;
  const {
    title, joint_name, default_mkb_code, template_json, category,
    default_side, complaints_template, anamnesis_template, objective_template,
    anamnesis_vitae_template, objective_status_template, special_studies_template,
    performed_manipulations_template, default_sections_mask,
    rom_norm_preset, rom_priority, rom_sftr_preview, rom_end_feel, rom_has_stop_warning,
    manipulations_priority, manipulations_summary, manipulations_has_stop, manipulations_stop_rationale,
    orthotics_priority, orthotics_weight_bearing, orthotics_summary, orthotics_has_stop, orthotics_stop_rationale,
    lfk_priority, lfk_has_stop, lfk_stop_rationale, lfk_pain_monitoring_zone, lfk_target_goal, lfk_phases_summary,
    recommendations_template, cluster_id, cluster_name,
    stage_or_severity, clinical_tags, tests = [], diagnostics = [],
    manipulations = [], physiotherapy = [], orthotics = [], lfk = []
  } = req.body;

  const rawJson = typeof template_json === 'object' ? JSON.stringify(template_json) : (template_json || '{}');
  const romPresetStr = typeof rom_norm_preset === 'object' ? JSON.stringify(rom_norm_preset) : rom_norm_preset;
  const tagsStr = Array.isArray(clinical_tags) ? JSON.stringify(clinical_tags) : (clinical_tags || null);
  const maskStr = typeof default_sections_mask === 'object' ? JSON.stringify(default_sections_mask) : (default_sections_mask || null);

  db.run(`
    UPDATE ortho_templates SET
      title = ?,
      joint_name = ?,
      default_mkb_code = ?,
      template_json = ?,
      category = ?,
      default_side = ?,
      complaints_template = ?,
      anamnesis_template = ?,
      objective_template = ?,
      anamnesis_vitae_template = COALESCE(?, anamnesis_vitae_template),
      objective_status_template = COALESCE(?, objective_status_template),
      special_studies_template = COALESCE(?, special_studies_template),
      performed_manipulations_template = COALESCE(?, performed_manipulations_template),
      default_sections_mask = COALESCE(?, default_sections_mask),
      rom_norm_preset = ?,
      rom_priority = COALESCE(?, rom_priority),
      rom_sftr_preview = COALESCE(?, rom_sftr_preview),
      rom_end_feel = COALESCE(?, rom_end_feel),
      rom_has_stop_warning = COALESCE(?, rom_has_stop_warning),
      manipulations_priority = COALESCE(?, manipulations_priority),
      manipulations_summary = COALESCE(?, manipulations_summary),
      manipulations_has_stop = COALESCE(?, manipulations_has_stop),
      manipulations_stop_rationale = COALESCE(?, manipulations_stop_rationale),
      orthotics_priority = COALESCE(?, orthotics_priority),
      orthotics_weight_bearing = COALESCE(?, orthotics_weight_bearing),
      orthotics_summary = COALESCE(?, orthotics_summary),
      orthotics_has_stop = COALESCE(?, orthotics_has_stop),
      orthotics_stop_rationale = COALESCE(?, orthotics_stop_rationale),
      lfk_priority = COALESCE(?, lfk_priority),
      lfk_has_stop = COALESCE(?, lfk_has_stop),
      lfk_stop_rationale = COALESCE(?, lfk_stop_rationale),
      lfk_pain_monitoring_zone = COALESCE(?, lfk_pain_monitoring_zone),
      lfk_target_goal = COALESCE(?, lfk_target_goal),
      lfk_phases_summary = COALESCE(?, lfk_phases_summary),
      recommendations_template = ?,
      cluster_id = COALESCE(?, cluster_id),
      cluster_name = COALESCE(?, cluster_name),
      stage_or_severity = COALESCE(?, stage_or_severity),
      clinical_tags = COALESCE(?, clinical_tags)
    WHERE id = ?
  `, [
    title, joint_name, default_mkb_code, rawJson, category,
    default_side, complaints_template, anamnesis_template, objective_template,
    anamnesis_vitae_template, objective_status_template, special_studies_template,
    performed_manipulations_template, maskStr,
    romPresetStr, rom_priority || null, rom_sftr_preview || null, rom_end_feel || null, rom_has_stop_warning !== undefined ? (rom_has_stop_warning ? 1 : 0) : null,
    manipulations_priority || null, manipulations_summary || null, manipulations_has_stop !== undefined ? (manipulations_has_stop ? 1 : 0) : null, manipulations_stop_rationale || null,
    orthotics_priority || null, orthotics_weight_bearing || null, orthotics_summary || null, orthotics_has_stop !== undefined ? (orthotics_has_stop ? 1 : 0) : null, orthotics_stop_rationale || null,
    lfk_priority || null, lfk_has_stop !== undefined ? (lfk_has_stop ? 1 : 0) : null, lfk_stop_rationale || null, lfk_pain_monitoring_zone || null, lfk_target_goal || null, lfk_phases_summary || null,
    recommendations_template,
    cluster_id || null, cluster_name || null, stage_or_severity || null, tagsStr,
    templateId
  ], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    // Sync tests
    db.run(`DELETE FROM ortho_template_tests WHERE template_id = ?`, [templateId], () => {
      if (Array.isArray(tests) && tests.length > 0) {
        const tStmt = db.prepare(`
          INSERT INTO ortho_template_tests (
            template_id, test_code, expected_result, is_mandatory, sort_order,
            priority_level, test_type_tag, is_supplemented
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        tests.forEach((t, i) => {
          tStmt.run([
            templateId,
            t.test_code || t.code,
            t.expected_result || t.expected || 'positive',
            t.is_mandatory ?? 1,
            i * 10,
            t.priority_level || 'medium',
            t.test_type_tag || t.test_type || null,
            t.is_supplemented ? 1 : 0
          ]);
        });
        tStmt.finalize();
      }
    });

    // Sync diagnostics
    db.run(`DELETE FROM ortho_template_diagnostics WHERE template_id = ?`, [templateId], () => {
      if (Array.isArray(diagnostics) && diagnostics.length > 0) {
        const dStmt = db.prepare(`
          INSERT INTO ortho_template_diagnostics (
            template_id, diagnostic_code, urgency, default_side, is_primary, sort_order, priority_level
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        diagnostics.forEach((d, i) => {
          dStmt.run([
            templateId,
            d.diagnostic_code || d.code,
            d.urgency || 'routine',
            d.default_side || default_side || 'affected',
            d.is_primary ?? 1,
            i * 10,
            d.priority_level || 'medium'
          ]);
        });
        dStmt.finalize();
      }
    });

    // Sync manipulations
    db.run(`DELETE FROM ortho_template_manipulations WHERE template_id = ?`, [templateId], () => {
      if (Array.isArray(manipulations) && manipulations.length > 0) {
        const mStmt = db.prepare(`
          INSERT INTO ortho_template_manipulations (
            template_id, manipulation_code, dosage_or_regimen, is_mandatory, sort_order, priority_level, service_scope,
            ebm_priority, navigation_type, anatomical_access, drug_class, is_stop_warning, stop_rationale, clinical_indications
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        manipulations.forEach((m, i) => {
          const scope = m.service_scope || 'internal';
          const priority = scope === 'internal' ? 'high' : (m.priority_level || 'medium');
          mStmt.run([
            templateId,
            m.manipulation_code || m.code,
            m.dosage_or_regimen || m.regimen || null,
            m.is_mandatory ?? 1,
            i * 10,
            priority,
            scope,
            m.ebm_priority || 'P2',
            m.navigation_type || 'us_guided',
            m.anatomical_access || '',
            m.drug_class || '',
            m.is_stop_warning ? 1 : 0,
            m.stop_rationale || '',
            m.clinical_indications || ''
          ]);
        });
        mStmt.finalize();
      }
    });

    // Sync physiotherapy
    db.run(`DELETE FROM ortho_template_physiotherapy WHERE template_id = ?`, [templateId], () => {
      if (Array.isArray(physiotherapy) && physiotherapy.length > 0) {
        const pStmt = db.prepare(`
          INSERT INTO ortho_template_physiotherapy (
            template_id, physiotherapy_code, dosage_or_regimen, is_mandatory, sort_order, priority_level, service_scope,
            ebm_priority, line_order, target_anatomical_landmark, exact_dosimetry, is_stop_warning, stop_rationale
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        physiotherapy.forEach((p, i) => {
          const scope = p.service_scope || 'internal';
          const priority = scope === 'internal' ? 'high' : (p.priority_level || 'medium');
          pStmt.run([
            templateId,
            p.physiotherapy_code || p.code,
            p.dosage_or_regimen || p.regimen || null,
            p.is_mandatory ?? 1,
            p.sort_order ?? (i * 10),
            priority,
            scope,
            p.ebm_priority || null,
            p.line_order || (i + 1),
            p.target_anatomical_landmark || null,
            p.exact_dosimetry || null,
            p.is_stop_warning ? 1 : 0,
            p.stop_rationale || null
          ]);
        });
        pStmt.finalize();
      }
    });

    // Sync orthotics
    db.run(`DELETE FROM ortho_template_orthotics WHERE template_id = ?`, [templateId], () => {
      if (Array.isArray(orthotics) && orthotics.length > 0) {
        const oStmt = db.prepare(`
          INSERT INTO ortho_template_orthotics (
            template_id, orthotics_code, dosage_or_regimen, is_mandatory, sort_order, priority_level, service_scope,
            ebm_priority, weight_bearing_mode, device_type_iso, hinge_settings, wearing_regimen, is_stop_warning, stop_rationale, cdss_contraindication_tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        orthotics.forEach((o, i) => {
          const scope = o.service_scope || 'internal';
          const priority = scope === 'internal' ? 'high' : (o.priority_level || 'medium');
          oStmt.run([
            templateId,
            o.orthotics_code || o.code,
            o.dosage_or_regimen || o.regimen || o.wearing_regimen || null,
            o.is_mandatory ?? 1,
            i * 10,
            priority,
            scope,
            o.ebm_priority || 'P2',
            o.weight_bearing_mode || 'WBAT',
            o.device_type_iso || 'FO',
            o.hinge_settings || 'Стандарт',
            o.wearing_regimen || o.dosage_or_regimen || 'По клиническому регламенту',
            o.is_stop_warning ? 1 : 0,
            o.stop_rationale || '',
            JSON.stringify([o.device_type_iso, o.weight_bearing_mode, o.ebm_priority])
          ]);
        });
        oStmt.finalize();
      }
    });

    // Sync lfk
    db.run(`DELETE FROM ortho_template_lfk WHERE template_id = ?`, [templateId], () => {
      if (Array.isArray(lfk) && lfk.length > 0) {
        const lStmt = db.prepare(`
          INSERT INTO ortho_template_lfk (
            template_id, lfk_code, phase_number, phase_name, stage_step, exercise_order,
            exercise_name_override, dosage_prescription, tempo_and_hold, frequency_per_day,
            biomechanical_goal, ebm_priority, pain_threshold_zone, kinetic_chain,
            safe_angle_range, tags, is_stop_warning, stop_rationale, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        lfk.forEach((l, i) => {
          lStmt.run([
            templateId,
            l.lfk_code || l.code,
            l.phase_number || 1,
            l.phase_name || 'Фаза I',
            l.stage_step || 'Ступень 1',
            l.exercise_order || (i + 1),
            l.exercise_name_override || l.name || null,
            l.dosage_prescription || l.dosage || '3 подхода × 12 повторений',
            l.tempo_and_hold || null,
            l.frequency_per_day || '2–3 раза в день',
            l.biomechanical_goal || null,
            l.ebm_priority || 'P1',
            l.pain_threshold_zone || 'green',
            l.kinetic_chain || 'CKC',
            l.safe_angle_range || null,
            l.tags || null,
            l.is_stop_warning ? 1 : 0,
            l.stop_rationale || null,
            l.sort_order ?? (i * 10)
          ]);
        });
        lStmt.finalize();
      }
    });

    logOrthoAudit({
      eventType: EventTypes.PROTOCOL_SAVED,
      message: `Обновлен шаблон осмотра #${templateId}: "${title}"`
    });

    res.json({ success: true, message: 'Шаблон успешно обновлен' });
  });
});

// 9.7. POST /api/ortho/templates/:id/clone - Duplicate existing template
router.post('/templates/:id/clone', (req, res) => {
  const sourceId = req.params.id;

  db.get(`SELECT * FROM ortho_templates WHERE id = ?`, [sourceId], (err, src) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!src) return res.status(404).json({ success: false, error: 'Исходный шаблон не найден' });

    const newTitle = `${src.title} (Копия)`;
    db.run(`
      INSERT INTO ortho_templates (
        title, joint_name, default_mkb_code, template_json, category,
        default_side, complaints_template, anamnesis_template, objective_template,
        rom_norm_preset, recommendations_template, is_active, sort_order,
        cluster_id, cluster_name, stage_or_severity, clinical_tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `, [
      newTitle, src.joint_name, src.default_mkb_code, src.template_json, src.category,
      src.default_side, src.complaints_template, src.anamnesis_template, src.objective_template,
      src.rom_norm_preset, src.recommendations_template, (src.sort_order || 0) + 1,
      src.cluster_id, src.cluster_name, src.stage_or_severity, src.clinical_tags
    ], function(insErr) {
      if (insErr) return res.status(500).json({ success: false, error: insErr.message });
      const newId = this.lastID;

      // Copy tests
      db.all(`SELECT * FROM ortho_template_tests WHERE template_id = ?`, [sourceId], (tErr, tests) => {
        if (!tErr && tests && tests.length > 0) {
          const tStmt = db.prepare(`
            INSERT INTO ortho_template_tests (
              template_id, test_code, expected_result, is_mandatory, sort_order,
              priority_level, test_type_tag, is_supplemented
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          tests.forEach(t => tStmt.run([
            newId,
            t.test_code,
            t.expected_result,
            t.is_mandatory,
            t.sort_order,
            t.priority_level || 'medium',
            t.test_type_tag || null,
            t.is_supplemented || 0
          ]));
          tStmt.finalize();
        }
      });

      // Copy diagnostics
      db.all(`SELECT * FROM ortho_template_diagnostics WHERE template_id = ?`, [sourceId], (dErr, diags) => {
        if (!dErr && diags && diags.length > 0) {
          const dStmt = db.prepare(`
            INSERT INTO ortho_template_diagnostics (
              template_id, diagnostic_code, urgency, default_side, is_primary, sort_order, priority_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          diags.forEach(d => dStmt.run([
            newId,
            d.diagnostic_code,
            d.urgency,
            d.default_side,
            d.is_primary,
            d.sort_order,
            d.priority_level || 'medium'
          ]));
          dStmt.finalize();
        }
      });

      logOrthoAudit({
        eventType: EventTypes.PROTOCOL_SAVED,
        message: `Клонирован шаблон #${sourceId} -> #${newId} ("${newTitle}")`
      });

      res.json({ success: true, id: newId, message: 'Шаблон успешно скопирован' });
    });
  });
});

// 9.8. DELETE /api/ortho/templates/:id - Archive or delete template
router.delete('/templates/:id', (req, res) => {
  const templateId = req.params.id;
  db.run(`UPDATE ortho_templates SET is_active = 0 WHERE id = ?`, [templateId], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    logOrthoAudit({
      eventType: EventTypes.PROTOCOL_REVOKED,
      message: `Деактивирован/архивирован шаблон #${templateId}`
    });
    res.json({ success: true, message: 'Шаблон перемещен в архив' });
  });
});

// -----------------------------------------------------------------------------
// 10. POST /api/ortho/audit/export - Log document export telemetry
// -----------------------------------------------------------------------------
router.post('/audit/export', (req, res) => {
  const { protocolId, patientId, format } = req.body;
  logOrthoAudit({
    eventType: EventTypes.EXPORT_GENERATED,
    protocolId,
    patientId,
    message: `Сгенерирован экспорт протокола #${protocolId} в формате ${String(format).toUpperCase()}`
  });
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// 11. PATIENT REFERRALS & ORDERS API (Направления для пациентов)
// -----------------------------------------------------------------------------

function fetchReferralById(referralId, callback) {
  const refSql = `
    SELECT r.*,
           p.full_name AS patient_name,
           p.bdate AS patient_birth_date,
           p.sex AS patient_gender,
           p.phone AS patient_phone,
           p.mednum AS patient_card_num
    FROM ortho_referrals r
    LEFT JOIN patients p ON p.id = r.patient_id
    WHERE r.id = ?
  `;
  db.get(refSql, [referralId], (err, refRow) => {
    if (err) return callback(err);
    if (!refRow) return callback(null, null);

    db.all(
      'SELECT * FROM ortho_referral_items WHERE referral_id = ? ORDER BY sort_order ASC, id ASC',
      [referralId],
      (iErr, items) => {
        if (iErr) return callback(iErr);

        db.all(
          'SELECT * FROM ortho_referral_audit_log WHERE referral_id = ? ORDER BY id DESC',
          [referralId],
          (aErr, auditLogs) => {
            if (aErr) return callback(aErr);

            callback(null, {
              ...refRow,
              items: items || [],
              audit_log: auditLogs || []
            });
          }
        );
      }
    );
  });
}

// 11.1. GET /api/ortho/referrals/performers - List clinical performers
router.get('/referrals/performers', (req, res) => {
  const { is_internal } = req.query;
  let sql = 'SELECT * FROM ortho_referral_performers WHERE is_active = 1';
  const params = [];
  if (is_internal !== undefined) {
    sql += ' AND is_internal = ?';
    params.push(Number(is_internal));
  }
  sql += ' ORDER BY is_internal DESC, sort_order ASC, name ASC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, performers: rows || [] });
  });
});

// 11.2. POST /api/ortho/referrals/issue - Issue referral with auto-prep from DB catalogs
router.post('/referrals/issue', async (req, res) => {
  try {
    const {
      patient_id,
      appointment_id,
      protocol_id,
      doctor_name = 'Добрушкин А.М',
      valid_days = 90,
      performer_id,
      icd10_code,
      icd10_name,
      clinical_diagnosis,
      target_joint,
      target_side,
      anamnesis_summary,
      special_notes,
      items = []
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ success: false, error: 'patient_id is required' });
    }
    if (!performer_id) {
      return res.status(400).json({ success: false, error: 'performer_id is required' });
    }

    db.get('SELECT * FROM ortho_referral_performers WHERE id = ?', [performer_id], async (pErr, performer) => {
      if (pErr) return res.status(500).json({ success: false, error: pErr.message });
      if (!performer) return res.status(404).json({ success: false, error: 'Performer not found' });

      // Aggregate preparation notes from DB catalogs
      const itemPreparationPromises = items.map((it) => {
        return new Promise((resolve) => {
          const dom = (it.domain || '').toLowerCase();
          const code = it.service_code || '';
          const title = it.item_title || '';

          if (dom === 'diagnostics' || dom === 'diagnostic') {
            db.get(
              'SELECT patient_preparation FROM diagnostic_methods_catalog WHERE code = ? OR name = ? LIMIT 1',
              [code, title],
              (err, row) => resolve(row?.patient_preparation || '')
            );
          } else if (dom === 'manipulation' || dom === 'surgery') {
            db.get(
              'SELECT patient_preparation FROM ortho_manipulations_catalog WHERE code = ? OR name = ? LIMIT 1',
              [code, title],
              (err, row) => resolve(row?.patient_preparation || '')
            );
          } else if (dom === 'physio' || dom === 'physiotherapy') {
            db.get(
              'SELECT patient_preparation FROM ortho_physiotherapy_catalog WHERE code = ? OR name = ? LIMIT 1',
              [code, title],
              (err, row) => resolve(row?.patient_preparation || '')
            );
          } else if (dom === 'orthotics') {
            db.get(
              'SELECT patient_preparation FROM ortho_orthotics_catalog WHERE code = ? OR name = ? LIMIT 1',
              [code, title],
              (err, row) => resolve(row?.patient_preparation || '')
            );
          } else {
            resolve('');
          }
        });
      });

      const preparationNotes = await Promise.all(itemPreparationPromises);
      const uniquePrep = [];
      preparationNotes.forEach((note) => {
        if (note && note.trim() && !uniquePrep.includes(note.trim())) {
          uniquePrep.push(note.trim());
        }
      });
      const aggregatedPrep = uniquePrep.join('\n\n');

      const year = new Date().getFullYear();
      db.get(
        "SELECT COUNT(*) AS cnt FROM ortho_referrals WHERE referral_number LIKE ?",
        [`НАПР-${year}-%`],
        (cErr, cRow) => {
          if (cErr) return res.status(500).json({ success: false, error: cErr.message });
          const nextSeq = (cRow?.cnt || 0) + 1;
          const referral_number = `НАПР-${year}-${String(nextSeq).padStart(6, '0')}`;

          const now = new Date();
          const issue_date = now.toISOString().replace('T', ' ').substring(0, 19);
          const effectiveValidDays = Number(valid_days) > 0 ? Number(valid_days) : 90;
          const expDate = new Date(now.getTime() + effectiveValidDays * 24 * 60 * 60 * 1000);
          const expires_at = expDate.toISOString().substring(0, 10);

          const hashPayload = `${referral_number}|${patient_id}|${issue_date}|${expires_at}|${performer.name}`;
          const verification_hash = crypto.createHash('sha256').update(hashPayload).digest('hex').substring(0, 32);

          const insertRefSql = `
            INSERT INTO ortho_referrals (
              referral_number, patient_id, appointment_id, protocol_id, doctor_name,
              issue_date, valid_days, expires_at,
              performer_id, performer_name, performer_is_internal, performer_address,
              icd10_code, icd10_name, clinical_diagnosis, target_joint, target_side,
              anamnesis_summary, preparation_instructions, special_notes,
              status, verification_hash, printed_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, 0)
          `;

          db.run(
            insertRefSql,
            [
              referral_number,
              patient_id,
              appointment_id || null,
              protocol_id || null,
              doctor_name || 'Добрушкин А.М',
              issue_date,
              effectiveValidDays,
              expires_at,
              performer.id,
              performer.name,
              performer.is_internal ? 1 : 0,
              performer.organization_address || '',
              icd10_code || 'M19.9',
              icd10_name || '',
              clinical_diagnosis || '',
              target_joint || '',
              target_side || '',
              anamnesis_summary || '',
              aggregatedPrep,
              special_notes || '',
              verification_hash
            ],
            function (insErr) {
              if (insErr) return res.status(500).json({ success: false, error: insErr.message });
              const referralId = this.lastID;

              if (items.length > 0) {
                const itemStmt = db.prepare(`
                  INSERT INTO ortho_referral_items (
                    referral_id, domain, service_code, item_title, item_details, formula_latex, preparation_notes, sort_order
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);
                items.forEach((it, idx) => {
                  itemStmt.run([
                    referralId,
                    it.domain || 'diagnostics',
                    it.service_code || '',
                    it.item_title || it.name || it.title || 'Медицинская услуга',
                    it.item_details || it.dosage_notes || '',
                    it.formula_latex || '',
                    preparationNotes[idx] || '',
                    idx
                  ]);
                });
                itemStmt.finalize();
              }

              db.run(`
                INSERT INTO ortho_referral_audit_log (referral_id, action_type, performed_by_name, details_json)
                VALUES (?, 'CREATED', ?, ?)
              `, [
                referralId,
                doctor_name || 'Добрушкин А.М',
                JSON.stringify({
                  referral_number,
                  performer: performer.name,
                  items_count: items.length,
                  valid_days: effectiveValidDays
                })
              ]);

              fetchReferralById(referralId, (fErr, fullReferral) => {
                if (fErr) return res.status(500).json({ success: false, error: fErr.message });
                res.json({
                  success: true,
                  message: `Направление №${referral_number} успешно выписано`,
                  referral: fullReferral
                });
              });
            }
          );
        }
      );
    });
  } catch (err) {
    console.error('Error issuing referral:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11.25. GET /api/ortho/referrals - General registry of all referrals with filters
router.get('/referrals', (req, res) => {
  const { search = '', status = '', is_internal, limit = 200, offset = 0 } = req.query;
  const whereClauses = [];
  const params = [];

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    whereClauses.push('(r.referral_number LIKE ? OR p.full_name LIKE ? OR r.performer_name LIKE ? OR r.clinical_diagnosis LIKE ? OR r.icd10_code LIKE ?)');
    params.push(q, q, q, q, q);
  }

  if (status && status.trim()) {
    whereClauses.push('r.status = ?');
    params.push(status.trim());
  }

  if (is_internal !== undefined && is_internal !== '') {
    whereClauses.push('r.performer_is_internal = ?');
    params.push(Number(is_internal));
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `
    SELECT r.*,
           COUNT(ri.id) AS items_count,
           p.full_name AS patient_name,
           p.bdate AS patient_birth_date,
           p.phone AS patient_phone
    FROM ortho_referrals r
    LEFT JOIN ortho_referral_items ri ON ri.referral_id = r.id
    LEFT JOIN patients p ON p.id = r.patient_id
    ${whereSql}
    GROUP BY r.id
    ORDER BY r.id DESC
    LIMIT ? OFFSET ?
  `;
  params.push(Number(limit), Number(offset));

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, referrals: rows || [] });
  });
});

// 11.3. GET /api/ortho/referrals/patient/:patientId - List all referrals for patient
router.get('/referrals/patient/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  const sql = `
    SELECT r.*,
           COUNT(ri.id) AS items_count,
           p.full_name AS patient_name,
           p.bdate AS patient_birth_date,
           p.phone AS patient_phone
    FROM ortho_referrals r
    LEFT JOIN ortho_referral_items ri ON ri.referral_id = r.id
    LEFT JOIN patients p ON p.id = r.patient_id
    WHERE r.patient_id = ?
    GROUP BY r.id
    ORDER BY r.id DESC
  `;
  db.all(sql, [patientId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, referrals: rows || [] });
  });
});

// 11.4. GET /api/ortho/referrals/:id - Get single referral with items and audit trail
router.get('/referrals/:id', (req, res) => {
  fetchReferralById(req.params.id, (err, referral) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!referral) return res.status(404).json({ success: false, error: 'Referral not found' });
    res.json({ success: true, referral });
  });
});

// 11.5. POST /api/ortho/referrals/:id/audit-print - Log print or export action
router.post('/referrals/:id/audit-print', (req, res) => {
  const referralId = req.params.id;
  const { format = 'pdf', performed_by = 'Добрушкин А.М' } = req.body;

  db.run(
    'UPDATE ortho_referrals SET printed_count = printed_count + 1, updated_at = datetime("now", "localtime") WHERE id = ?',
    [referralId],
    (upErr) => {
      if (upErr) return res.status(500).json({ success: false, error: upErr.message });

      db.run(
        `INSERT INTO ortho_referral_audit_log (referral_id, action_type, performed_by_name, details_json)
         VALUES (?, ?, ?, ?)`,
        [referralId, `PRINTED_${String(format).toUpperCase()}`, performed_by, JSON.stringify({ format, timestamp: new Date().toISOString() })],
        (logErr) => {
          if (logErr) return res.status(500).json({ success: false, error: logErr.message });
          res.json({ success: true, message: 'Аудит печати зафиксирован' });
        }
      );
    }
  );
});

// 11.6. PATCH /api/ortho/referrals/:id/status - Update referral status
router.patch('/referrals/:id/status', (req, res) => {
  const referralId = req.params.id;
  const { status, reason = '', performed_by = 'Добрушкин А.М' } = req.body;

  if (!status) return res.status(400).json({ success: false, error: 'Status is required' });

  db.run(
    'UPDATE ortho_referrals SET status = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
    [status, referralId],
    (upErr) => {
      if (upErr) return res.status(500).json({ success: false, error: upErr.message });

      db.run(
        `INSERT INTO ortho_referral_audit_log (referral_id, action_type, performed_by_name, details_json)
         VALUES (?, 'STATUS_CHANGED', ?, ?)`,
        [referralId, performed_by, JSON.stringify({ new_status: status, reason, timestamp: new Date().toISOString() })],
        (logErr) => {
          if (logErr) return res.status(500).json({ success: false, error: logErr.message });
          res.json({ success: true, message: `Статус направления обновлен на «${status}»` });
        }
      );
    }
  );
});

module.exports = router;

