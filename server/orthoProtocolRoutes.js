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
// 0. GET /api/ortho/templates - Unified clinical templates (ortho_templates + protdict)
// -----------------------------------------------------------------------------
router.get('/templates', (req, res) => {
  const search = req.query.search ? String(req.query.search).trim() : '';
  const joint = req.query.joint ? String(req.query.joint).trim() : '';

  db.all(`SELECT id, title, joint_name, default_mkb_code, template_json, 'biomechanics' AS source FROM ortho_templates ORDER BY id ASC`, [], (oErr, orthoTemplates) => {
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

      const mappedOrtho = (orthoTemplates || []).map((ot) => ({
        id: `ortho-${ot.id}`,
        rawId: ot.id,
        title: ot.title,
        joint_name: ot.joint_name,
        default_mkb_code: ot.default_mkb_code,
        template_json: ot.template_json,
        category: 'Биомеханика Neutral-0 ROM',
        source: 'biomechanics'
      }));

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
              doctor_name: 'Добрушкин В.И.'
            };
            doneAppt();
          });
        } else {
          appointment = {
            id: initialProtocol ? initialProtocol.id : null,
            patient_id: patientId,
            appointment_date: initialProtocol ? initialProtocol.vdate : new Date().toISOString().slice(0, 10),
            doctor_name: 'Добрушкин В.И.'
          };
          doneAppt();
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
                  db.all(`SELECT id, title, joint_name, default_mkb_code, template_json, 'biomechanics' AS source FROM ortho_templates ORDER BY id ASC`, [], (tErr, orthoTemplates) => {
                    db.all(`SELECT id, name AS title, title AS full_title, content, kind, post, 'protdict' AS source FROM protdict WHERE hide_f = 0 ORDER BY name ASC`, [], (pdErr, protdictRows) => {
                      const allTemplates = [
                        ...(orthoTemplates || []).map((ot) => ({
                          id: `ortho-${ot.id}`,
                          rawId: ot.id,
                          title: ot.title,
                          joint_name: ot.joint_name,
                          default_mkb_code: ot.default_mkb_code,
                          template_json: ot.template_json,
                          category: 'Биомеханика Neutral-0 ROM',
                          source: 'biomechanics'
                        })),
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

                      // If initialProtocol was preloaded (e.g. from protocolId), use it; otherwise search by appointment
                      const resolveCurrentProtocol = (doneProto) => {
                        if (initialProtocol) return doneProto(initialProtocol);
                        if (appointmentId) {
                          db.get(`
                            SELECT p.*, d.mkb_code, d.mkb_name
                            FROM protocols p
                            LEFT JOIN diagnoses d ON d.pr_id = p.id
                            WHERE p.appointment_id = ?
                            ORDER BY p.id DESC LIMIT 1
                          `, [appointmentId], (curErr, curP) => {
                            doneProto(curP || null);
                          });
                        } else {
                          doneProto(null);
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
          moddate = ?
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
        protocolId
      ], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        postSaveHandler(protocolId);
      });
    } else {
      db.run(`
        INSERT INTO protocols (
          docn, pt_id, vdate, kind, mode, title, content, post, rdate, fname, hide_f, moddate, moduser, shot_f,
          protocol_json, schema_version, appointment_id, status, vas_score, primary_joint, side, is_signed, signed_at, signed_by_docn, signature_hash
        ) VALUES (
          ?, ?, ?, 1, 1, ?, ?, 'Врач травматолог-ортопед', ?, 'protocol.rtf', 0, ?, 'ortho_workstation', 0,
          ?, '2.0', ?, ?, ?, ?, ?, ?, ?, ?, ?
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
        signatureHash
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
// 9. GET /api/ortho/templates - Fast fill clinical templates
// -----------------------------------------------------------------------------
router.get('/templates', (req, res) => {
  const { joint } = req.query;
  let sql = `SELECT * FROM ortho_templates`;
  const params = [];
  if (joint) {
    sql += ` WHERE joint_name = ?`;
    params.push(joint);
  }
  sql += ` ORDER BY id ASC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, templates: rows || [] });
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

module.exports = router;
