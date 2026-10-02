const db = require('./database');

db.serialize(() => {
  db.run("ALTER TABLE staff ADD COLUMN contact_phone TEXT", () => {});
  db.run("ALTER TABLE staff ADD COLUMN email TEXT", () => {});
  db.run("ALTER TABLE staff ADD COLUMN status TEXT DEFAULT 'active'", () => {});

  db.get("SELECT COUNT(*) AS count FROM staff", (err, row) => {
    if (row && row.count <= 1) {
      const stmt = db.prepare("INSERT INTO staff (full_name, role, specialization, contact_phone, email, status) VALUES (?, ?, ?, ?, ?, ?)");
      stmt.run('Добрушкин Владимир', 'Главный врач, ортопед-травматолог', 'Травматология и ортопедия, хирургия суставов', '+7 (988) 123-45-01', 'dr.dobrouchkin@orthocenter.ru', 'active');
      stmt.run('Смирнова Екатерина', 'Ассистирующая медсестра', 'Процедурный кабинет, ассистирование при инъекциях', '+7 (988) 123-45-02', 'e.smirnova@orthocenter.ru', 'active');
      stmt.run('Петров Сергей', 'Врач травматолог-ортопед', 'Реабилитация, блокады и кинезиотейпирование', '+7 (988) 123-45-03', 's.petrov@orthocenter.ru', 'active');
      stmt.run('Кузнецова Анна', 'Старшая медицинская сестра', 'Сестринское дело в травматологии', '+7 (988) 123-45-04', 'a.kuznetsova@orthocenter.ru', 'active');
      stmt.run('Соколова Ольга', 'Администратор клиники', 'Регистратура, запись пациентов и документация', '+7 (988) 123-45-05', 'reception@orthocenter.ru', 'active');
      stmt.finalize(() => {
        console.log("Staff table successfully updated and seeded!");
        process.exit(0);
      });
    } else {
      console.log("Staff table already populated.");
      process.exit(0);
    }
  });
});
