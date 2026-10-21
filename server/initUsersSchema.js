const { generateSalt, hashUserPassword } = require('./auth');

const INITIAL_PERMISSIONS = [
  {
    code: 'sysadmin',
    name: 'Системный администратор',
    description: 'Полный системный доступ: управление БД, SQLite Studio, Swagger, конфигурация серверов и журналы аудита',
    badgeColor: '#7C3AED',
    isSystem: 1
  },
  {
    code: 'administrator',
    name: 'Администратор клиники',
    description: 'Оформление визитов, управление расписанием врачей, прейскурантом servdict, скидками и персоналом',
    badgeColor: '#0F3C64',
    isSystem: 1
  },
  {
    code: 'doctor',
    name: 'Врач травматолог-ортопед',
    description: 'АРМ врача-ортопеда, 2D-гомункулус, углометрия Neutral-0 ROM, ортопедические тесты и протоколы',
    badgeColor: '#0284C7',
    isSystem: 1
  },
  {
    code: 'nurse',
    name: 'Медицинская сестра',
    description: 'Процедурный кабинет, выполнение манипуляций, перевязки, инъекции и списание расходных материалов',
    badgeColor: '#166534',
    isSystem: 1
  },
  {
    code: 'accountant',
    name: 'Бухгалтер / Экономист',
    description: 'Управление кассовыми сменами 54-ФЗ, ведомости выплат зарплат, Z-отчеты и финансовая аналитика',
    badgeColor: '#D97706',
    isSystem: 1
  },
  {
    code: 'default',
    name: 'Базовый доступ (По умолчанию)',
    description: 'Базовый профиль: просмотр дашборда клиники, регламентов, справочника шаблонов и руководства',
    badgeColor: '#64748B',
    isSystem: 1
  }
];

/**
 * Initializes users, permissions, user_permissions tables, constraints, indices, and seed accounts
 * @param {import('sqlite3').Database} db 
 */
function initUsersSchema(db) {
  db.serialize(() => {
    // 1. Create permissions table
    db.run(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE COLLATE NOCASE,
        name TEXT NOT NULL,
        description TEXT,
        badge_color TEXT DEFAULT '#0F3C64',
        is_system INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `, (err) => {
      if (err) {
        console.error('[UsersSchema] Error creating permissions table:', err.message);
        return;
      }
      db.run(`CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code)`);

      // Seed initial permissions if missing
      INITIAL_PERMISSIONS.forEach((p) => {
        db.run(`
          INSERT OR IGNORE INTO permissions (code, name, description, badge_color, is_system)
          VALUES (?, ?, ?, ?, ?)
        `, [p.code, p.name, p.description, p.badgeColor, p.isSystem]);
      });
    });

    // 2. Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        staff_id INTEGER,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active INTEGER NOT NULL DEFAULT 1,
        expires_at TEXT DEFAULT NULL,
        auto_lock_minutes INTEGER DEFAULT 15,
        main_screen TEXT DEFAULT '/',
        last_login_at TEXT DEFAULT NULL,
        last_logout_at TEXT DEFAULT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
      )
    `, (err) => {
      if (err) {
        console.error('[UsersSchema] Error creating users table:', err.message);
        return;
      }

      db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_staff ON users(staff_id)`);

      // Migration: Check if main_screen column exists in existing users table
      db.all(`PRAGMA table_info(users)`, (pragmaErr, columns) => {
        if (!pragmaErr && Array.isArray(columns)) {
          const hasMainScreen = columns.some((c) => c.name === 'main_screen');
          if (!hasMainScreen) {
            db.run(`ALTER TABLE users ADD COLUMN main_screen TEXT DEFAULT '/'`, (alterErr) => {
              if (alterErr) {
                console.error('[UsersSchema] Error adding main_screen column:', alterErr.message);
              } else {
                console.log('[UsersSchema] Added main_screen column to users table');
              }
            });
          }
        }
      });

      // 3. Create user_permissions junction table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          user_id INTEGER NOT NULL,
          permission_id INTEGER NOT NULL,
          assigned_at TEXT DEFAULT (datetime('now', 'localtime')),
          PRIMARY KEY (user_id, permission_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        )
      `, (upErr) => {
        if (upErr) {
          console.error('[UsersSchema] Error creating user_permissions table:', upErr.message);
          return;
        }

        db.run(`CREATE INDEX IF NOT EXISTS idx_up_user ON user_permissions(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_up_perm ON user_permissions(permission_id)`);

        // Seed initial users if table is empty
        db.get('SELECT COUNT(*) AS count FROM users', (countErr, row) => {
          if (countErr) {
            console.error('[UsersSchema] Error checking users count:', countErr.message);
            return;
          }

          if (row && row.count === 0) {
            console.log('[UsersSchema] Seeding initial users with default encrypted passwords...');

            const defaultPassword = 'ortho#2026';

            const seedUsers = [
              {
                username: 'admin',
                fullName: 'Главный Администратор',
                role: 'admin',
                staffId: 1, // Влада (Admin/Manager)
                isActive: 1,
                expiresAt: null,
                autoLockMinutes: 15,
                mainScreen: '/',
                permCodes: ['sysadmin', 'administrator', 'default']
              },
              {
                username: 'dobrushkin',
                fullName: 'Добрушкин Александр Моисеевич',
                role: 'doctor',
                staffId: 2, // Главный врач, ортопед-травматолог
                isActive: 1,
                expiresAt: null,
                autoLockMinutes: 15,
                mainScreen: '/ortho-workstation',
                permCodes: ['doctor', 'administrator', 'default']
              },
              {
                username: 'petrov',
                fullName: 'Петров Сергей',
                role: 'doctor',
                staffId: 4, // Врач травматолог-ортопед
                isActive: 1,
                expiresAt: null,
                autoLockMinutes: 15,
                mainScreen: '/ortho-workstation',
                permCodes: ['doctor', 'default']
              },
              {
                username: 'kuznetsova',
                fullName: 'Кузнецова Анна',
                role: 'nurse',
                staffId: 5, // Старшая медицинская сестра
                isActive: 1,
                expiresAt: null,
                autoLockMinutes: 20,
                mainScreen: '/scheduling',
                permCodes: ['nurse', 'default']
              },
              {
                username: 'sokolova',
                fullName: 'Соколова Ольга',
                role: 'cashier',
                staffId: 6, // Администратор клиники
                isActive: 1,
                expiresAt: null,
                autoLockMinutes: 15,
                mainScreen: '/checkout',
                permCodes: ['accountant', 'administrator', 'default']
              }
            ];

            const insertStmt = db.prepare(`
              INSERT INTO users (
                username, password_hash, password_salt, staff_id, full_name,
                role, is_active, expires_at, auto_lock_minutes, main_screen
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            seedUsers.forEach((u) => {
              const salt = generateSalt();
              const hash = hashUserPassword(defaultPassword, salt);
              insertStmt.run(
                u.username,
                hash,
                salt,
                u.staffId,
                u.fullName,
                u.role,
                u.isActive,
                u.expiresAt,
                u.autoLockMinutes,
                u.mainScreen || '/',
                function (insErr) {
                  if (!insErr && this.lastID) {
                    const newUserId = this.lastID;
                    u.permCodes.forEach((pCode) => {
                      db.run(`
                        INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
                        SELECT ?, id FROM permissions WHERE code = ?
                      `, [newUserId, pCode]);
                    });
                  }
                }
              );
            });

            insertStmt.finalize();
          } else {
            // If users already exist, ensure everyone has 'default', and admin has 'sysadmin'
            db.all('SELECT id, username, role FROM users', (err, existingUsers) => {
              if (!err && existingUsers) {
                existingUsers.forEach((u) => {
                  // Ensure 'default' for every user
                  db.run(`
                    INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
                    SELECT ?, id FROM permissions WHERE code = 'default'
                  `, [u.id]);

                  // Ensure 'sysadmin' for admin
                  if (u.username === 'admin' || u.role === 'admin') {
                    db.run(`
                      INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
                      SELECT ?, id FROM permissions WHERE code = 'sysadmin'
                    `, [u.id]);
                    db.run(`
                      INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
                      SELECT ?, id FROM permissions WHERE code = 'administrator'
                    `, [u.id]);
                  }

                  // Assign matching permissions based on role if no other permissions assigned yet
                  if (u.role === 'doctor') {
                    db.run(`
                      INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
                      SELECT ?, id FROM permissions WHERE code = 'doctor'
                    `, [u.id]);
                  } else if (u.role === 'nurse') {
                    db.run(`
                      INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
                      SELECT ?, id FROM permissions WHERE code = 'nurse'
                    `, [u.id]);
                  } else if (u.role === 'cashier') {
                    db.run(`
                      INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
                      SELECT ?, id FROM permissions WHERE code = 'accountant'
                    `, [u.id]);
                  }
                });
              }
            });
          }
        });
      });
    });
  });
}

module.exports = initUsersSchema;
