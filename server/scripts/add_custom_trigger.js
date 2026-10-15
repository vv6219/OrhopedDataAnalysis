const db = require('../database');

db.serialize(() => {
  db.run(`
    CREATE TRIGGER IF NOT EXISTS trg_ortho_templates_custom 
    AFTER INSERT ON ortho_templates
    WHEN NEW.category = 'Кастомизированный шаблон' 
      OR NEW.clinical_tags LIKE '%custom%' 
      OR NEW.clinical_tags LIKE '%автор%'
    BEGIN
      UPDATE ortho_templates 
      SET is_custom = 1,
          author_doctor_name = COALESCE(
            NEW.author_doctor_name, 
            json_extract(NEW.template_json, '$.author_doctor_name'),
            'Врач травматолог-ортопед'
          )
      WHERE id = NEW.id;
    END;
  `, (err) => {
    if (err) {
      console.error('Trigger creation error:', err);
    } else {
      console.log('Trigger trg_ortho_templates_custom created successfully!');
    }
    process.exit(0);
  });
});
