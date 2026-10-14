const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { ALL_100_TEMPLATES } = require('./data/all100Templates');

function seedAll100OrthoTemplates(dbInstance, callback) {
  const db = dbInstance || new sqlite3.Database(path.resolve(__dirname, '../DB/orthopedic_data_center.sqlite'));
  console.log(`[SeedOrtho100] Initializing clean seed of all ${ALL_100_TEMPLATES.length} master clinical templates...`);

  db.serialize(() => {
    // Clear old template relational bindings and templates table
    db.run('DELETE FROM ortho_template_tests');
    db.run('DELETE FROM ortho_template_diagnostics');
    db.run('DELETE FROM ortho_templates');
    db.run('DELETE FROM sqlite_sequence WHERE name IN ("ortho_templates", "ortho_template_tests", "ortho_template_diagnostics")');

    const tplStmt = db.prepare(`
      INSERT INTO ortho_templates (
        id, title, joint_name, default_mkb_code, template_json, category,
        default_side, complaints_template, anamnesis_template, objective_template,
        rom_norm_preset, recommendations_template, is_active, sort_order,
        cluster_id, cluster_name, stage_or_severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `);

    const insTest = db.prepare(`
      INSERT INTO ortho_template_tests (
        template_id, test_code, expected_result, is_mandatory, sort_order
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const insDiag = db.prepare(`
      INSERT INTO ortho_template_diagnostics (
        template_id, diagnostic_code, urgency, default_side, is_primary, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    ALL_100_TEMPLATES.forEach((t, idx) => {
      const templateId = idx + 1;
      const rawJson = JSON.stringify({
        complaints: t.complaints_template,
        anamnesis: t.anamnesis_template,
        objective: t.objective_template,
        recommendations: t.recommendations_template,
        rom: t.rom_norm_preset,
        default_mkb_code: t.default_mkb_code
      });
      const romStr = JSON.stringify(t.rom_norm_preset);

      tplStmt.run([
        templateId, t.title, t.joint_name, t.default_mkb_code, rawJson, t.category,
        t.default_side, t.complaints_template, t.anamnesis_template, t.objective_template,
        romStr, t.recommendations_template, idx * 10, t.cluster_id, t.cluster_name,
        t.stage_or_severity
      ]);

      if (t.tests && t.tests.length > 0) {
        t.tests.forEach((test, tIdx) => {
          insTest.run([
            templateId,
            test.test_code,
            test.expected_result || 'positive',
            test.is_mandatory ?? 1,
            test.sort_order || (tIdx + 1) * 10
          ]);
        });
      }

      if (t.diagnostics && t.diagnostics.length > 0) {
        t.diagnostics.forEach((diag, dIdx) => {
          insDiag.run([
            templateId,
            diag.diagnostic_code,
            diag.urgency || 'routine',
            diag.default_side || t.default_side || 'affected',
            diag.is_primary ?? 1,
            diag.sort_order || (dIdx + 1) * 10
          ]);
        });
      }
    });

    tplStmt.finalize();
    insTest.finalize();
    insDiag.finalize();

    db.get('SELECT count(*) as total FROM ortho_templates WHERE is_active = 1', (e, r) => {
      console.log(`[SeedOrtho100] Successfully seeded ${r ? r.total : 0} templates across 10 clusters.`);
      if (callback) callback();
      if (!dbInstance) db.close();
    });
  });
}

if (require.main === module) {
  seedAll100OrthoTemplates();
}

module.exports = { seedAll100OrthoTemplates };
