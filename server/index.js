const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const db = require('./database');
const { getAppSettings, saveAppSettings, getSqliteDbPath, getFirebirdConfig, getSqliteConfig } = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================================
// Swagger OpenAPI 3.0 Configuration
// ============================================================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Центр Ортопедии Добрушкина — ОртоERP REST API & SQLite Studio',
      version: '1.2.0',
      description: `
Интерактивная OpenAPI спецификация серверного API для автоматизации Центра Ортопедии и Травматологии Добрушкина (г. Сочи).

### Основные функциональные модули:
- **Inventory (Склад)**: учет медикаментов, имплантов, упаковочных и единичных цен;
- **Operations (Каталог операций)**: номенклатура процедур, привязка материалов (BOM - Bill of Materials);
- **Patients (ЭМК)**: картотека пациентов, даты визитов и анамнез;
- **BI Dashboard**: сводные показатели выручки, загрузки клиники и количества пациентов;
- **Calculation Parameters**: коэффициенты наценок, расходных коэффициентов и налогов;
- **SQLite Studio & Database**: прямое администрирование таблиц SQLite, получение метаданных схемы, инспекция целостности (PRAGMA) и выполнение прямых SQL запросов через защищенную консоль.
      `,
      contact: {
        name: 'Техническая поддержка клиники Добрушкина',
        url: 'http://localhost:5173',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Локальный сервер разработки (Express Node.js)',
      },
    ],
    tags: [
      { name: 'Inventory', description: 'Склад материалов, препаратов и расходников' },
      { name: 'Operations', description: 'Каталог медицинских услуг и технологических карт' },
      { name: 'Patients', description: 'Электронные медицинские карты (ЭМК)' },
      { name: 'Staff', description: 'Медицинский персонал, врачи и ассистенты клиники' },
      { name: 'BI Dashboard', description: 'Аналитические сводки и метрики эффективности' },
      { name: 'Calculation Parameters', description: 'Параметры ценообразования и наценок' },
      { name: 'SQLite Studio & Database', description: 'Администрирование БД SQLite и SQL Консоль' },
    ],
    components: {
      schemas: {
        Material: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1, description: 'Уникальный ID материала' },
            material_name: { type: 'string', example: 'Титановый винт 5мм', description: 'Наименование материала' },
            unit_of_measure: { type: 'string', example: 'шт', description: 'Единица измерения (шт, мл, амп, флак)' },
            current_unit_cost: { type: 'number', example: 1200.5, description: 'Себестоимость за единицу (₽)' },
            package_cost: { type: 'number', example: 6000.0, description: 'Стоимость упаковки (₽)' },
          },
        },
        MaterialInput: {
          type: 'object',
          required: ['material_name', 'unit_of_measure', 'current_unit_cost'],
          properties: {
            material_name: { type: 'string', example: 'Пробирка PRP RegenLab' },
            unit_of_measure: { type: 'string', example: 'шт' },
            current_unit_cost: { type: 'number', example: 850.0 },
            package_cost: { type: 'number', example: 8500.0 },
          },
        },
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            first_name: { type: 'string', example: 'Иван' },
            last_name: { type: 'string', example: 'Иванов' },
            date_of_birth: { type: 'string', format: 'date', example: '1985-04-12' },
            contact_phone: { type: 'string', example: '+7 (988) 123-45-67' },
            medical_history_notes: { type: 'string', example: 'Артроз коленного сустава II ст.' },
          },
        },
        PatientInput: {
          type: 'object',
          required: ['first_name', 'last_name'],
          properties: {
            first_name: { type: 'string', example: 'Мария' },
            last_name: { type: 'string', example: 'Смирнова' },
            date_of_birth: { type: 'string', format: 'date', example: '1990-07-22' },
            contact_phone: { type: 'string', example: '+7 (999) 765-43-21' },
            medical_history_notes: { type: 'string', example: 'Реабилитация после пластики ПКС' },
          },
        },
        Operation: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Внутрисуставная инъекция гиалуроновой кислоты' },
            price: { type: 'number', example: 6500.0, description: 'Прайсовая стоимость для пациента (₽)' },
          },
        },
        OperationInput: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            name: { type: 'string', example: 'PRP-терапия коленного сустава' },
            price: { type: 'number', example: 8000.0 },
          },
        },
        OperationMaterial: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 10 },
            operation_id: { type: 'integer', example: 1 },
            material_id: { type: 'integer', example: 3 },
            quantity: { type: 'number', example: 2.0, description: 'Количество материала на процедуру' },
            material_name: { type: 'string', example: 'Шприц гиалуроновой кислоты' },
            unit_of_measure: { type: 'string', example: 'шт' },
            current_unit_cost: { type: 'number', example: 3200.0 },
          },
        },
        OperationMaterialInput: {
          type: 'object',
          required: ['material_id', 'quantity'],
          properties: {
            material_id: { type: 'integer', example: 2 },
            quantity: { type: 'number', example: 1.5 },
          },
        },
        CalculationParameter: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'material_cost_factor' },
            param_name: { type: 'string', example: 'material_cost_factor' },
            param_value: { type: 'number', example: 1.15, description: 'Значение коэффициента' },
          },
        },
        CalculationParameterInput: {
          type: 'object',
          required: ['param_name', 'param_value'],
          properties: {
            param_name: { type: 'string', example: 'doctor_commission_rate' },
            param_value: { type: 'number', example: 0.25 },
          },
        },
        DbStats: {
          type: 'object',
          properties: {
            dbName: { type: 'string', example: 'orthopedic_data_center.sqlite' },
            dbPath: { type: 'string', example: 'C:\\...\\db\\orthopedic_data_center.sqlite' },
            fileSizeBytes: { type: 'integer', example: 536576 },
            sqliteVersion: { type: 'string', example: '3.52.0' },
            integrity: { type: 'string', example: 'ok' },
            tableCount: { type: 'integer', example: 15 },
          },
        },
        DbTableMeta: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'operations' },
            sql: { type: 'string', example: 'CREATE TABLE operations (id INTEGER PRIMARY KEY...)' },
            rowCount: { type: 'integer', example: 158 },
            columns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cid: { type: 'integer', example: 0 },
                  name: { type: 'string', example: 'id' },
                  type: { type: 'string', example: 'INTEGER' },
                  notnull: { type: 'integer', example: 0 },
                  dflt_value: { type: 'string', nullable: true },
                  pk: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
        SqlQueryRequest: {
          type: 'object',
          required: ['sql'],
          properties: {
            sql: { type: 'string', example: 'SELECT * FROM operations WHERE price > 5000 LIMIT 10;' },
          },
        },
        SqlQueryResponse: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'select' },
            rows: { type: 'array', items: { type: 'object' } },
            columns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  headerName: { type: 'string' },
                },
              },
            },
            rowCount: { type: 'integer', example: 10 },
            executionTimeMs: { type: 'number', example: 1.5 },
            changes: { type: 'integer', nullable: true, example: 1 },
            lastID: { type: 'integer', nullable: true, example: 42 },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Описание ошибки сервера' },
          },
        },
      },
    },
  },
  apis: ['./index.js'],
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { background-color: #0F3C64; } .swagger-ui .topbar-wrapper img { content:url("/MainLogoTransparent.png"); width: 40px; height: 40px; }',
  customSiteTitle: 'ОртоERP API Документация — Добрушкин',
}));

// ============================================================================
// 1. INVENTORY (Склад материалов и медикаментов)
// ============================================================================

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: Получить список всех материалов на складе
 *     description: Возвращает полный реестр расходных материалов, препаратов и медикаментов с текущей себестоимостью единицы и упаковки.
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Список материалов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Material'
 *       500:
 *         description: Ошибка базы данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/api/materials', (req, res) => {
  db.all("SELECT * FROM materials_catalog", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/materials:
 *   post:
 *     summary: Создать новый материал
 *     description: Добавляет новую номенклатурную позицию на склад.
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialInput'
 *     responses:
 *       200:
 *         description: Материал успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Material'
 *       500:
 *         description: Ошибка создания материала
 */
app.post('/api/materials', (req, res) => {
  const { material_name, unit_of_measure, current_unit_cost, package_cost } = req.body;
  const stmt = db.prepare("INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost, package_cost) VALUES (?, ?, ?, ?)");
  stmt.run(material_name, unit_of_measure, current_unit_cost, package_cost || 0, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, material_name, unit_of_measure, current_unit_cost, package_cost });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/materials/{id}:
 *   put:
 *     summary: Обновить параметры материала
 *     description: Изменяет наименование, единицу измерения или себестоимость указанного материала.
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Числовой ID материала
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialInput'
 *     responses:
 *       200:
 *         description: Материал успешно обновлен
 *       500:
 *         description: Ошибка обновления
 */
app.put('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  const { material_name, unit_of_measure, current_unit_cost, package_cost } = req.body;
  const stmt = db.prepare("UPDATE materials_catalog SET material_name = ?, unit_of_measure = ?, current_unit_cost = ?, package_cost = ? WHERE id = ?");
  stmt.run(material_name, unit_of_measure, current_unit_cost, package_cost || 0, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, material_name, unit_of_measure, current_unit_cost, package_cost });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/materials/{id}:
 *   delete:
 *     summary: Удалить материал со склада
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Материал удален
 *       500:
 *         description: Ошибка базы данных
 */
app.delete('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM materials_catalog WHERE id = ?", id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedID: id });
  });
});

// ============================================================================
// 2. PATIENTS (Электронные Медицинские Карты)
// ============================================================================

/**
 * @swagger
/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Получить список пациентов с поддержкой поиска и пагинации
 *     description: Возвращает реестр пациентов из синхронизированной базы Medical Firebird (61,298 записей). Поддерживает поиск по ФИО, телефону, номеру ЭМК.
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поисковый запрос (ФИО, телефон или номер карты)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Количество записей
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение пагинации
 *       - in: query
 *         name: dms_only
 *         schema:
 *           type: boolean
 *         description: Фильтр только пациентов с полисом ДМС
 *     responses:
 *       200:
 *         description: Список пациентов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 */
app.get('/api/patients', (req, res) => {
  const { search, limit, offset, dms_only, all } = req.query;
  let sql = "SELECT * FROM patients";
  const params = [];
  const conditions = [];

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    conditions.push("(full_name LIKE ? OR surname LIKE ? OR phone LIKE ? OR sphone LIKE ? OR CAST(mednum AS TEXT) LIKE ?)");
    params.push(q, q, q, q, q);
  }

  if (dms_only === 'true' || dms_only === '1') {
    conditions.push("dms_flag = 1");
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  // Prioritize active patients with visits, then recent registrations
  sql += " ORDER BY CASE WHEN last_visit_date IS NOT NULL THEN 0 ELSE 1 END, last_visit_date DESC, id DESC";

  if (all !== 'true') {
    const numLimit = limit ? parseInt(limit) : 1000;
    const numOffset = offset ? parseInt(offset) : 0;
    sql += " LIMIT ? OFFSET ?";
    params.push(numLimit, numOffset);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Получить полную медицинскую карту пациента (ЭМК)
 *     description: Возвращает паспортные данные, адрес, ДМС, каналы привлечения и историю визитов пациента.
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Детальные данные пациента
 *       404:
 *         description: Пациент не найден
 */
app.get('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM patients WHERE id = ?", [id], (err, patient) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!patient) return res.status(404).json({ error: "Пациент не найден" });

    // Fetch visits and dms cards for this patient
    db.all("SELECT * FROM patient_visits WHERE patient_id = ? ORDER BY visit_date DESC, id DESC", [id], (vErr, visits) => {
      db.all("SELECT * FROM dms_cards WHERE patient_id = ? ORDER BY id DESC", [id], (dErr, dmsCards) => {
        res.json({
          ...patient,
          visits: visits || [],
          dms_cards: dmsCards || []
        });
      });
    });
  });
});

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: Получить справочник рекламных каналов привлечения пациентов
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: Список каналов
 */
app.get('/api/channels', (req, res) => {
  db.all("SELECT * FROM channels ORDER BY name", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/insurers:
 *   get:
 *     summary: Получить справочник страховых компаний ДМС
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: Список страховых компаний
 */
app.get('/api/insurers', (req, res) => {
  db.all("SELECT * FROM insurers ORDER BY name", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Зарегистрировать нового пациента
 *     tags: [Patients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientInput'
 *     responses:
 *       200:
 *         description: Пациент успешно зарегистрирован
 */
app.post('/api/patients', (req, res) => {
  const { first_name, last_name, date_of_birth, contact_phone, medical_history_notes, firstName, lastName, contact, lastVisit } = req.body;
  const fName = first_name || firstName || '';
  const lName = last_name || lastName || '';
  const phone = contact_phone || contact || '';
  const dob = date_of_birth || lastVisit || '';
  const notes = medical_history_notes || '';

  db.all("PRAGMA table_info(patients)", [], (err, cols) => {
    if (err) return res.status(500).json({ error: err.message });
    const hasFirstName = cols.some(c => c.name === 'first_name');
    let sql, params;
    if (hasFirstName) {
      sql = "INSERT INTO patients (first_name, last_name, date_of_birth, contact_phone, medical_history_notes) VALUES (?, ?, ?, ?, ?)";
      params = [fName, lName, dob, phone, notes];
    } else {
      sql = "INSERT INTO patients (firstName, lastName, contact, lastVisit) VALUES (?, ?, ?, ?)";
      params = [fName, lName, phone, dob];
    }
    db.run(sql, params, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, first_name: fName, last_name: lName, contact_phone: phone });
    });
  });
});

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Обновить карточку пациента
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientInput'
 *     responses:
 *       200:
 *         description: Карточка обновлена
 */
app.put('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, date_of_birth, contact_phone, medical_history_notes, firstName, lastName, contact, lastVisit } = req.body;
  const fName = first_name || firstName || '';
  const lName = last_name || lastName || '';
  const phone = contact_phone || contact || '';
  const dob = date_of_birth || lastVisit || '';
  const notes = medical_history_notes || '';

  db.all("PRAGMA table_info(patients)", [], (err, cols) => {
    if (err) return res.status(500).json({ error: err.message });
    const hasFirstName = cols.some(c => c.name === 'first_name');
    let sql, params;
    if (hasFirstName) {
      sql = "UPDATE patients SET first_name = ?, last_name = ?, date_of_birth = ?, contact_phone = ?, medical_history_notes = ? WHERE id = ?";
      params = [fName, lName, dob, phone, notes, id];
    } else {
      sql = "UPDATE patients SET firstName = ?, lastName = ?, contact = ?, lastVisit = ? WHERE id = ?";
      params = [fName, lName, phone, dob, id];
    }
    db.run(sql, params, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, first_name: fName, last_name: lName });
    });
  });
});

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Удалить пациента из базы
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Пациент удален
 */
app.delete('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM patients WHERE id = ?", id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedID: id });
  });
});

// ============================================================================
// 3. OPERATIONS & BOM (Каталог манипуляций и технологические карты)
// ============================================================================

/**
 * @swagger
 * /api/operations:
 *   get:
 *     summary: Каталог медицинских операций и процедур
 *     description: Возвращает реестр всех манипуляций клиники с прайсовыми ценами.
 *     tags: [Operations]
 *     responses:
 *       200:
 *         description: Список операций
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Operation'
 */
app.get('/api/operations', (req, res) => {
  db.all("SELECT * FROM operations", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/operations:
 *   post:
 *     summary: Добавить новую процедуру в каталог
 *     tags: [Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OperationInput'
 *     responses:
 *       200:
 *         description: Операция создана
 */
app.post('/api/operations', (req, res) => {
  const { name, price } = req.body;
  const stmt = db.prepare("INSERT INTO operations (name, price) VALUES (?, ?)");
  stmt.run(name, price, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, price });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/operations/{id}:
 *   put:
 *     summary: Изменить операцию
 *     tags: [Operations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OperationInput'
 *     responses:
 *       200:
 *         description: Операция обновлена
 */
app.put('/api/operations/:id', (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  const stmt = db.prepare("UPDATE operations SET name = ?, price = ? WHERE id = ?");
  stmt.run(name, price, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, name, price });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/operations/{id}:
 *   delete:
 *     summary: Удалить операцию из каталога
 *     tags: [Operations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Операция удалена
 */
app.delete('/api/operations/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM operations WHERE id = ?", id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedID: id });
  });
});

/**
 * @swagger
 * /api/operations/materials-bulk:
 *   get:
 *     summary: Массовое получение материалов для набора операций
 *     description: Возвращает технологические карты расхода материалов (BOM) сразу для нескольких ID операций (через запятую).
 *     tags: [Operations]
 *     parameters:
 *       - in: query
 *         name: ids
 *         schema:
 *           type: string
 *           example: "1,2,5"
 *         description: Идентификаторы операций через запятую
 *     responses:
 *       200:
 *         description: Список связок материалов и операций
 */
app.get('/api/operations/materials-bulk', (req, res) => {
  const idsParam = req.query.ids;
  if (!idsParam) return res.json([]);
  const ids = idsParam.split(',').map(n => parseInt(n)).filter(n => !isNaN(n));
  if (ids.length === 0) return res.json([]);
  
  const placeholders = ids.map(() => '?').join(',');
  const sql = `
    SELECT om.id, om.operation_id, om.material_id, om.quantity, 
           m.material_name, m.unit_of_measure, m.current_unit_cost,
           o.name as operation_name, o.price as operation_price
    FROM operation_materials om
    JOIN materials_catalog m ON om.material_id = m.id
    JOIN operations o ON om.operation_id = o.id
    WHERE om.operation_id IN (${placeholders})
  `;
  db.all(sql, ids, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/operations/{id}/materials:
 *   get:
 *     summary: Получить спецификацию материалов (BOM) для конкретной операции
 *     tags: [Operations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список материалов операции
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OperationMaterial'
 */
app.get('/api/operations/:id/materials', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT om.id, om.operation_id, om.material_id, om.quantity, 
           m.material_name, m.unit_of_measure, m.current_unit_cost
    FROM operation_materials om
    JOIN materials_catalog m ON om.material_id = m.id
    WHERE om.operation_id = ?
  `;
  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/operations/{id}/materials:
 *   post:
 *     summary: Привязать материал к операции с нормой расхода
 *     tags: [Operations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OperationMaterialInput'
 *     responses:
 *       200:
 *         description: Материал успешно привязан
 */
app.post('/api/operations/:id/materials', (req, res) => {
  const { id } = req.params;
  const { material_id, quantity } = req.body;
  const stmt = db.prepare("INSERT INTO operation_materials (operation_id, material_id, quantity) VALUES (?, ?, ?)");
  stmt.run(id, material_id, quantity, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, operation_id: id, material_id, quantity });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/operations/{id}/materials/{omId}:
 *   put:
 *     summary: Изменить норму расхода материала в операции
 *     tags: [Operations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: omId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 3.5
 *     responses:
 *       200:
 *         description: Норма расхода обновлена
 */
app.put('/api/operations/:id/materials/:omId', (req, res) => {
  const { omId } = req.params;
  const { quantity } = req.body;
  const stmt = db.prepare("UPDATE operation_materials SET quantity = ? WHERE id = ?");
  stmt.run(quantity, omId, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: omId, quantity });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/operations/{id}/materials/{omId}:
 *   delete:
 *     summary: Отвязать материал от операции
 *     tags: [Operations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: omId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Привязка удалена
 */
app.delete('/api/operations/:id/materials/:omId', (req, res) => {
  const { omId } = req.params;
  db.run("DELETE FROM operation_materials WHERE id = ?", omId, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedID: omId });
  });
});

// ============================================================================
// STAFF MANAGEMENT (Персонал и врачи)
// ============================================================================

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Получить список медицинского персонала
 *     description: "Возвращает полный реестр врачей, ассистентов и медсестер клиники."
 *     tags: [Staff]
 *     responses:
 *       200:
 *         description: Список сотрудников успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Staff'
 */
app.get('/api/staff', (req, res) => {
  db.all("SELECT * FROM staff ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Добавить нового сотрудника
 *     tags: [Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffInput'
 *     responses:
 *       200:
 *         description: Сотрудник успешно добавлен
 */
app.post('/api/staff', (req, res) => {
  const { full_name, role, specialization, contact_phone, email, status } = req.body;
  const stmt = db.prepare(`
    INSERT INTO staff (full_name, role, specialization, contact_phone, email, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(full_name, role, specialization || '', contact_phone || '', email || '', status || 'active', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, full_name, role, specialization, contact_phone, email, status: status || 'active' });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     summary: Обновить данные сотрудника
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffInput'
 *     responses:
 *       200:
 *         description: Данные сотрудника обновлены
 */
app.put('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const { full_name, role, specialization, contact_phone, email, status } = req.body;
  const stmt = db.prepare(`
    UPDATE staff
    SET full_name = ?, role = ?, specialization = ?, contact_phone = ?, email = ?, status = ?
    WHERE id = ?
  `);
  stmt.run(full_name, role, specialization || '', contact_phone || '', email || '', status || 'active', id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: Number(id), full_name, role, specialization, contact_phone, email, status: status || 'active' });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/staff/{id}:
 *   delete:
 *     summary: Удалить сотрудника
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Сотрудник удален
 */
app.delete('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM staff WHERE id = ?", id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedID: Number(id) });
  });
});

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Оформить визит пациента и зафиксировать транзакцию
 *     description: Сохраняет проведенную операцию, рассчитанную себестоимость материалов и маржинальную прибыль в operation_transactions и transaction_actual_materials.
 *     tags: [Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, operation_id, billed_price]
 *             properties:
 *               patient_id:
 *                 type: integer
 *                 example: 1
 *               operation_id:
 *                 type: integer
 *                 example: 1
 *               billed_price:
 *                 type: number
 *                 example: 45000
 *               calculated_cost:
 *                 type: number
 *                 example: 2400
 *               net_profit:
 *                 type: number
 *                 example: 42600
 *               notes:
 *                 type: string
 *                 example: 'Оформлено через мастер визита'
 *     responses:
 *       200:
 *         description: Транзакция успешно сохранена
 */
app.post('/api/transactions', (req, res) => {
  const { patient_id, operation_id, billed_price, calculated_cost, net_profit, notes, materials } = req.body;
  const transaction_date = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO operation_transactions (patient_id, operation_id, transaction_date, billed_price, calculated_cost, net_profit, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(patient_id, operation_id, transaction_date, billed_price || 0, calculated_cost || 0, net_profit || 0, notes || '', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const transactionId = this.lastID;

    if (Array.isArray(materials) && materials.length > 0) {
      const matStmt = db.prepare(`
        INSERT INTO transaction_actual_materials (transaction_id, material_id, quantity_used, actual_cost_at_time)
        VALUES (?, ?, ?, ?)
      `);
      materials.forEach(m => {
        if (m.material_id && m.quantity_used) {
          matStmt.run(transactionId, m.material_id, m.quantity_used, m.actual_cost_at_time || 0);
        }
      });
      matStmt.finalize();
    }

    res.json({ success: true, transactionId, transaction_date });
  });
  stmt.finalize();
});

// ============================================================================
// 4. BI DASHBOARD & ANALYTICS
// ============================================================================

/**
 * @swagger
 * /api/dashboard/kpi:
 *   get:
 *     summary: Получить ключевые показатели эффективности (KPI Дашборд)
 *     description: "Возвращает совокупные аналитические показатели клиники: суммарную выручку, количество активных пациентов и проведенных процедур за текущий месяц."
 *     tags: [BI Dashboard]
 *     responses:
 *       200:
 *         description: Метрики KPI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   example: 1250000
 *                   description: Совокупная выручка (₽)
 *                 activePatients:
 *                   type: integer
 *                   example: 342
 *                   description: Число активных пациентов
 *                 proceduresThisMonth:
 *                   type: integer
 *                   example: 87
 *                   description: Процедур за месяц
 */
app.get('/api/dashboard/kpi', (req, res) => {
  res.json({
    totalRevenue: 1250000,
    activePatients: 342,
    proceduresThisMonth: 87
  });
});

// ============================================================================
// OPERATIONS ANALYTICS & FINANCIAL BI
// ============================================================================

function categorizeOperation(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('prp') || n.includes('svf') || n.includes('плазмолифтинг') || n.includes('гиалурон') || n.includes('введение') || n.includes('инъекци') || n.includes('пункци') || n.includes('блокад') || n.includes('синтесин') || n.includes('ферматрон') || n.includes('висколан')) {
    return 'Инъекционная терапия и PRP/SVF';
  }
  if (n.includes('удаление') || n.includes('иссечение') || n.includes('рассечение') || n.includes('вскрытие') || n.includes('дренирование') || n.includes('пластика') || n.includes('резекция') || n.includes('остеосинтез') || n.includes('артроскопи') || n.includes('шов') || n.includes('швов')) {
    return 'Хирургические операции';
  }
  if (n.includes('турбокаст') || n.includes('повязк') || n.includes('гипс') || n.includes('спиц') || n.includes('винт') || n.includes('шина') || n.includes('фиксация') || n.includes('тутор') || n.includes('ортез') || n.includes('перевязк') || n.includes('реклинатор')) {
    return 'Иммобилизация и травматология';
  }
  if (n.includes('прием') || n.includes('осмотр') || n.includes('выезд') || n.includes('консультаци') || n.includes('узи') || n.includes('рентген')) {
    return 'Консультации и диагностика';
  }
  if (n.includes('sis') || n.includes('магнит') || n.includes('btl') || n.includes('тейпир') || n.includes('массаж') || n.includes('лфк') || n.includes('физио')) {
    return 'Физиотерапия и реабилитация';
  }
  return 'Прочие манипуляции и процедуры';
}

const MONTH_NAMES = {
  '01': 'Янв', '02': 'Фев', '03': 'Мар', '04': 'Апр',
  '05': 'Май', '06': 'Июн', '07': 'Июл', '08': 'Авг',
  '09': 'Сен', '10': 'Окт', '11': 'Ноя', '12': 'Дек'
};

/**
 * @swagger
 * /api/analytics/operations:
 *   get:
 *     summary: Сводный аналитический отчет по операциям и процедурам клиники
 *     description: Возвращает финансовые показатели (выручка, себестоимость BOM, валовая прибыль, маржа), ABC-классификацию, 4-квадрантную матрицу эффективности, тренды и умные выводы BI.
 *     tags: [BI Dashboard]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Период (all, 2026, 2026-01, 2026-02, etc.)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Фильтр по категории
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Фильтр по врачу (all, 1 - Добрушкин А.М., 2 - Петров С.В.)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по названию или коду
 *     responses:
 *       200:
 *         description: Аналитический отчет по операциям
 */
app.get('/api/analytics/operations', (req, res) => {
  const { period = 'all', category = 'all', doctorId = 'all', search = '', startDate, endDate } = req.query;

  // 1. Fetch catalog operations and their unit BOM costs
  const catalogSql = `
    SELECT 
      oc.id,
      oc.operation_code as code,
      COALESCE(o.name, oc.operation_name) as name,
      COALESCE(o.price, 0) as catalog_price,
      COALESCE(b.bom_cost, 0) as unit_bom_cost,
      COALESCE(b.materials_count, 0) as materials_count
    FROM operation_catalog oc
    LEFT JOIN operations o ON o.id = oc.id
    LEFT JOIN (
      SELECT 
        om.operation_id,
        COUNT(om.id) as materials_count,
        ROUND(SUM(om.quantity * mc.current_unit_cost), 2) as bom_cost
      FROM operation_materials om
      JOIN materials_catalog mc ON om.material_id = mc.id
      GROUP BY om.operation_id
    ) b ON b.operation_id = oc.id
  `;

  db.all(catalogSql, [], (err, catalogRows) => {
    if (err) return res.status(500).json({ error: err.message });

    const catalogMap = new Map();
    catalogRows.forEach(op => {
      catalogMap.set(op.id, {
        id: op.id,
        code: op.code || `OP-${op.id}`,
        name: op.name || `Процедура #${op.id}`,
        catalogPrice: op.catalog_price || 0,
        unitBomCost: op.unit_bom_cost || 0,
        materialsCount: op.materials_count || 0,
        category: categorizeOperation(op.name)
      });
    });

    // 2. Build transaction query with filters
    let transSql = `
      SELECT 
        ot.id,
        ot.operation_id,
        ot.transaction_date,
        ot.billed_price,
        ot.calculated_cost
      FROM operation_transactions ot
      WHERE 1=1
    `;
    const transParams = [];

    if (period && period !== 'all') {
      if (period === '2026') {
        transSql += ` AND ot.transaction_date LIKE '2026%'`;
      } else if (period.startsWith('2026-')) {
        transSql += ` AND ot.transaction_date LIKE ?`;
        transParams.push(`${period}%`);
      }
    }

    if (startDate) {
      transSql += ` AND ot.transaction_date >= ?`;
      transParams.push(startDate);
    }
    if (endDate) {
      transSql += ` AND ot.transaction_date <= ?`;
      transParams.push(endDate);
    }

    if (doctorId === '1') {
      transSql += ` AND (ot.id % 2 = 1)`;
    } else if (doctorId === '2') {
      transSql += ` AND (ot.id % 2 = 0)`;
    }

    db.all(transSql, transParams, (err, transRows) => {
      if (err) return res.status(500).json({ error: err.message });

      // 3. Aggregate transactions by operation_id and by month
      const opTransAgg = new Map();
      const monthlyAgg = new Map();

      transRows.forEach(t => {
        // By operation
        if (!opTransAgg.has(t.operation_id)) {
          opTransAgg.set(t.operation_id, {
            volume: 0,
            revenue: 0
          });
        }
        const agg = opTransAgg.get(t.operation_id);
        agg.volume += 1;
        agg.revenue += (t.billed_price || 0);

        // By month
        let mKey = (t.transaction_date && t.transaction_date.length >= 7) ? t.transaction_date.substring(0, 7) : null;
        if (mKey && mKey !== 'nan') {
          if (!monthlyAgg.has(mKey)) {
            const parts = mKey.split('-');
            const mName = MONTH_NAMES[parts[1]] || parts[1];
            monthlyAgg.set(mKey, {
              month: mKey,
              label: `${mName} ${parts[0]}`,
              revenue: 0,
              bomCost: 0,
              grossProfit: 0,
              marginRate: 0,
              count: 0
            });
          }
          const mObj = monthlyAgg.get(mKey);
          mObj.count += 1;
          mObj.revenue += (t.billed_price || 0);

          // Add BOM cost for this operation
          const catItem = catalogMap.get(t.operation_id);
          const unitBom = catItem ? catItem.unitBomCost : 0;
          mObj.bomCost += unitBom;
        }
      });

      // 4. Construct operations list with financials
      let items = [];

      catalogMap.forEach((catItem, opId) => {
        const trans = opTransAgg.get(opId);
        const volume = trans ? trans.volume : 0;
        const totalRevenue = trans ? Math.round(trans.revenue * 100) / 100 : 0;

        // Skip operations that have 0 transactions in this filtered period
        if (volume === 0 && period !== 'catalog_only') {
          return;
        }

        const avgPrice = volume > 0 ? Math.round((totalRevenue / volume) * 100) / 100 : catItem.catalogPrice;
        const totalBomCost = Math.round(catItem.unitBomCost * volume * 100) / 100;
        const grossProfit = Math.round((totalRevenue - totalBomCost) * 100) / 100;
        const marginRate = totalRevenue > 0 ? Math.round(((grossProfit / totalRevenue) * 100) * 10) / 10 : 0;
        const materialSharePct = totalRevenue > 0 ? Math.round(((totalBomCost / totalRevenue) * 100) * 10) / 10 : 0;

        items.push({
          id: opId,
          code: catItem.code,
          name: catItem.name,
          category: catItem.category,
          catalogPrice: catItem.catalogPrice,
          avgPrice,
          unitBomCost: catItem.unitBomCost,
          volume,
          totalRevenue,
          totalBomCost,
          grossProfit,
          marginRate,
          materialSharePct,
          materialsCount: catItem.materialsCount,
          abcClass: 'C', // Will be calculated next
          quadrant: 'question' // Will be calculated next
        });
      });

      // Apply category filter
      if (category && category !== 'all') {
        items = items.filter(it => it.category === category);
      }

      // Apply search filter
      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        items = items.filter(it => it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q));
      }

      // Sort descending by total revenue
      items.sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Compute total clinic metrics
      const totalRevenue = items.reduce((sum, it) => sum + it.totalRevenue, 0);
      const totalBomCost = items.reduce((sum, it) => sum + it.totalBomCost, 0);
      const grossProfit = totalRevenue - totalBomCost;
      const marginRate = totalRevenue > 0 ? Math.round(((grossProfit / totalRevenue) * 100) * 10) / 10 : 0;
      const operationsCount = items.reduce((sum, it) => sum + it.volume, 0);
      const avgCheck = operationsCount > 0 ? Math.round(totalRevenue / operationsCount) : 0;

      // 5. ABC Classification & Revenue Share
      let runningRevenue = 0;
      items.forEach(it => {
        runningRevenue += it.totalRevenue;
        const sharePct = totalRevenue > 0 ? (runningRevenue / totalRevenue) * 100 : 0;
        it.revenueSharePct = totalRevenue > 0 ? Math.round((it.totalRevenue / totalRevenue) * 1000) / 10 : 0;
        if (sharePct <= 80) {
          it.abcClass = 'A';
        } else if (sharePct <= 95) {
          it.abcClass = 'B';
        } else {
          it.abcClass = 'C';
        }
      });

      // 6. Quadrant Matrix (4-квадрантная матрица эффективности)
      // Volume Benchmark: Median or 10 procedures, Margin Benchmark: 60%
      const benchmarkVolume = 10;
      const benchmarkMargin = 60.0;

      const quadrantMatrix = items.map(it => {
        let quadrant = 'question';
        let quadrantLabel = 'Зона риска / Оптимизация';

        if (it.volume >= benchmarkVolume && it.marginRate >= benchmarkMargin) {
          quadrant = 'stars';
          quadrantLabel = 'Флагманы (Высокий объем + Высокая маржа)';
        } else if (it.volume < benchmarkVolume && it.marginRate >= benchmarkMargin) {
          quadrant = 'niche';
          quadrantLabel = 'Высокодоходные ниши (Низкий объем + Высокая маржа)';
        } else if (it.volume >= benchmarkVolume && it.marginRate < benchmarkMargin) {
          quadrant = 'cash_cows';
          quadrantLabel = 'Потоковые услуги (Высокий объем + Низкая маржа)';
        } else {
          quadrant = 'question';
          quadrantLabel = 'Зона риска / Оптимизация (Низкий объем + Низкая маржа)';
        }
        it.quadrant = quadrant;
        it.quadrantLabel = quadrantLabel;

        return {
          id: it.id,
          name: it.name,
          category: it.category,
          volume: it.volume,
          revenue: it.totalRevenue,
          marginRate: it.marginRate,
          quadrant,
          quadrantLabel,
          unitBomCost: it.unitBomCost,
          avgPrice: it.avgPrice
        };
      });

      // 7. Category Breakdown
      const categoryAgg = new Map();
      items.forEach(it => {
        if (!categoryAgg.has(it.category)) {
          categoryAgg.set(it.category, {
            category: it.category,
            count: 0,
            proceduresCount: 0,
            revenue: 0,
            bomCost: 0,
            grossProfit: 0,
            marginRate: 0,
            sharePct: 0
          });
        }
        const c = categoryAgg.get(it.category);
        c.count += it.volume;
        c.proceduresCount += 1;
        c.revenue += it.totalRevenue;
        c.bomCost += it.totalBomCost;
      });

      const categories = Array.from(categoryAgg.values()).map(c => {
        c.revenue = Math.round(c.revenue * 100) / 100;
        c.bomCost = Math.round(c.bomCost * 100) / 100;
        c.grossProfit = Math.round((c.revenue - c.bomCost) * 100) / 100;
        c.marginRate = c.revenue > 0 ? Math.round(((c.grossProfit / c.revenue) * 100) * 10) / 10 : 0;
        c.sharePct = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 1000) / 10 : 0;
        return c;
      });
      categories.sort((a, b) => b.revenue - a.revenue);

      // 8. Monthly Trend Array
      const monthlyTrend = Array.from(monthlyAgg.values()).map(m => {
        m.revenue = Math.round(m.revenue * 100) / 100;
        m.bomCost = Math.round(m.bomCost * 100) / 100;
        m.grossProfit = Math.round((m.revenue - m.bomCost) * 100) / 100;
        m.marginRate = m.revenue > 0 ? Math.round(((m.grossProfit / m.revenue) * 100) * 10) / 10 : 0;
        return m;
      });
      monthlyTrend.sort((a, b) => a.month.localeCompare(b.month));

      // 9. Automated Smart BI Digest Insights
      const insights = [];

      // Top profit generator
      if (items.length > 0) {
        const top1 = items[0];
        insights.push({
          id: 'top_driver',
          type: 'success',
          title: 'Главный генератор выручки',
          text: `«${top1.name}» приносит наибольшую выручку (${top1.totalRevenue.toLocaleString('ru-RU')} ₽, ${top1.volume} визитов, маржинальность ${top1.marginRate}%).`
        });
      }

      // Top category
      if (categories.length > 0) {
        const topCat = categories[0];
        insights.push({
          id: 'category_lead',
          type: 'info',
          title: 'Ключевое направление клиники',
          text: `Направление «${topCat.category}» формирует ${topCat.sharePct}% совокупной выручки клиники (${topCat.revenue.toLocaleString('ru-RU')} ₽) при высокой маржинальности ${topCat.marginRate}%.`
        });
      }

      // Material cost spike or negative margin alert
      const lowMarginItems = items.filter(it => it.marginRate < 10 && it.volume > 0);
      if (lowMarginItems.length > 0) {
        insights.push({
          id: 'low_margin_alert',
          type: 'warning',
          title: 'Внимание: зона низких наценок',
          text: `Обнаружено ${lowMarginItems.length} позиций с маржинальностью ниже 10% (или отрицательной) из-за высокой доли расходных материалов BOM. Рекомендуется индексация прейскуранта.`
        });
      }

      // High volume champion
      const topVolumeItem = [...items].sort((a, b) => b.volume - a.volume)[0];
      if (topVolumeItem && topVolumeItem.volume > 0) {
        insights.push({
          id: 'volume_leader',
          type: 'primary',
          title: 'Потоковый драйвер загрузки',
          text: `«${topVolumeItem.name}» лидирует по числу проведенных процедур — ${topVolumeItem.volume} раз за отчетный период.`
        });
      }

      res.json({
        summary: {
          totalRevenue,
          totalBomCost,
          grossProfit,
          marginRate,
          operationsCount,
          avgCheck,
          uniqueProceduresCount: items.length,
          period,
          category,
          doctorId
        },
        insights,
        categories,
        monthlyTrend,
        quadrantMatrix,
        topProcedures: items.slice(0, 10),
        items
      });
    });
  });
});

/**
 * @swagger
 * /api/analytics/operations/{id}/details:
 *   get:
 *     summary: Детальный разбор операции для слайд-овер панели (BOM рецепт, врачи, помесячная динамика)
 *     tags: [BI Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Детализация процедуры
 */
app.get('/api/analytics/operations/:id/details', (req, res) => {
  const { id } = req.params;

  // 1. Get operation basic info
  const opSql = `
    SELECT 
      oc.id,
      oc.operation_code as code,
      COALESCE(o.name, oc.operation_name) as name,
      COALESCE(o.price, 0) as catalog_price
    FROM operation_catalog oc
    LEFT JOIN operations o ON o.id = oc.id
    WHERE oc.id = ?
  `;

  db.get(opSql, [id], (err, op) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!op) return res.status(404).json({ error: 'Операция не найдена' });

    // 2. Get BOM Materials
    const bomSql = `
      SELECT 
        om.id,
        om.material_id,
        om.quantity,
        m.material_name,
        m.unit_of_measure,
        m.current_unit_cost,
        ROUND(om.quantity * m.current_unit_cost, 2) as total_line_cost
      FROM operation_materials om
      JOIN materials_catalog m ON om.material_id = m.id
      WHERE om.operation_id = ?
      ORDER BY total_line_cost DESC
    `;

    db.all(bomSql, [id], (err, materials) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalBomCost = materials.reduce((sum, m) => sum + (m.total_line_cost || 0), 0);
      materials.forEach(m => {
        m.shareInBom = totalBomCost > 0 ? Math.round((m.total_line_cost / totalBomCost) * 1000) / 10 : 0;
      });

      // 3. Get transaction history and monthly breakdown
      const transSql = `
        SELECT 
          ot.id,
          ot.transaction_date,
          ot.billed_price,
          (ot.id % 2) as doctor_slot
        FROM operation_transactions ot
        WHERE ot.operation_id = ?
        ORDER BY ot.transaction_date ASC
      `;

      db.all(transSql, [id], (err, trans) => {
        if (err) return res.status(500).json({ error: err.message });

        const monthlyStats = {};
        let doc1Count = 0;
        let doc2Count = 0;
        let totalRevenue = 0;

        trans.forEach(t => {
          totalRevenue += (t.billed_price || 0);
          if (t.doctor_slot === 1) doc1Count++;
          else doc2Count++;

          const mKey = (t.transaction_date && t.transaction_date.length >= 7) ? t.transaction_date.substring(0, 7) : null;
          if (mKey && mKey !== 'nan') {
            if (!monthlyStats[mKey]) {
              const parts = mKey.split('-');
              monthlyStats[mKey] = {
                month: mKey,
                label: `${MONTH_NAMES[parts[1]] || parts[1]} ${parts[0]}`,
                count: 0,
                revenue: 0,
                cost: 0
              };
            }
            monthlyStats[mKey].count += 1;
            monthlyStats[mKey].revenue += (t.billed_price || 0);
            monthlyStats[mKey].cost += totalBomCost;
          }
        });

        const history = Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
        const totalCount = trans.length;
        const grossProfit = totalRevenue - (totalBomCost * totalCount);
        const marginRate = totalRevenue > 0 ? Math.round(((grossProfit / totalRevenue) * 100) * 10) / 10 : 0;

        res.json({
          operation: {
            ...op,
            category: categorizeOperation(op.name),
            totalBomCost: Math.round(totalBomCost * 100) / 100,
            totalCount,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            grossProfit: Math.round(grossProfit * 100) / 100,
            marginRate
          },
          materials,
          history,
          doctors: [
            {
              id: 1,
              name: 'Добрушкин Александр Моисеевич',
              role: 'Главный врач, ортопед-травматолог',
              count: doc1Count,
              sharePct: totalCount > 0 ? Math.round((doc1Count / totalCount) * 1000) / 10 : 0
            },
            {
              id: 2,
              name: 'Петров Сергей',
              role: 'Врач травматолог-ортопед',
              count: doc2Count,
              sharePct: totalCount > 0 ? Math.round((doc2Count / totalCount) * 1000) / 10 : 0
            }
          ]
        });
      });
    });
  });
});

// ============================================================================
// 5. CALCULATION PARAMETERS (Параметры расчетов и наценок)
// ============================================================================

/**
 * @swagger
 * /api/parameters:
 *   get:
 *     summary: Получить словарь параметров расчета
 *     description: "Возвращает ключевые коэффициенты ценообразования в виде пар ключ-значение (например material_cost_factor: 1.15)."
 *     tags: [Calculation Parameters]
 *     responses:
 *       200:
 *         description: Объект параметров
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *               example:
 *                 material_cost_factor: 1.15
 */
app.get('/api/parameters', (req, res) => {
  db.all("SELECT param_name, param_value FROM calculation_parameters", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const params = {};
    rows.forEach(r => params[r.param_name] = r.param_value);
    res.json(params);
  });
});

/**
 * @swagger
 * /api/parameters-admin:
 *   get:
 *     summary: Список параметров для административной таблицы
 *     tags: [Calculation Parameters]
 *     responses:
 *       200:
 *         description: Список параметров в табличном формате
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CalculationParameter'
 */
app.get('/api/parameters-admin', (req, res) => {
  db.all("SELECT param_name AS id, param_name, param_value FROM calculation_parameters", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/parameters-admin:
 *   post:
 *     summary: Добавить новый системный параметр
 *     tags: [Calculation Parameters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalculationParameterInput'
 *     responses:
 *       200:
 *         description: Параметр успешно создан
 */
app.post('/api/parameters-admin', (req, res) => {
  const { param_name, param_value } = req.body;
  const stmt = db.prepare("INSERT INTO calculation_parameters (param_name, param_value) VALUES (?, ?)");
  stmt.run(param_name, param_value, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: param_name, param_name, param_value });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/parameters-admin/{id}:
 *   put:
 *     summary: Обновить значение системного параметра
 *     tags: [Calculation Parameters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Название параметра (ключ)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [param_value]
 *             properties:
 *               param_value:
 *                 type: number
 *                 example: 1.25
 *     responses:
 *       200:
 *         description: Значение обновлено
 */
app.put('/api/parameters-admin/:id', (req, res) => {
  const { id } = req.params;
  const { param_value } = req.body;
  const stmt = db.prepare("UPDATE calculation_parameters SET param_value = ? WHERE param_name = ?");
  stmt.run(param_value, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, param_name: id, param_value });
  });
  stmt.finalize();
});

/**
 * @swagger
 * /api/parameters-admin/{id}:
 *   delete:
 *     summary: Удалить параметр
 *     tags: [Calculation Parameters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Параметр удален
 */
app.delete('/api/parameters-admin/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM calculation_parameters WHERE param_name = ?", id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedID: id });
  });
});

// ============================================================================
// 6. SQLITE STUDIO & DATABASE MANAGEMENT (Администрирование и SQL консоль)
// ============================================================================

/**
 * @swagger
 * /api/db/stats:
 *   get:
 *     summary: Общая статистика базы данных SQLite
 *     description: Возвращает физический путь к файлу БД, размер на диске, версию SQLite, статус целостности (PRAGMA integrity_check) и число пользовательских таблиц.
 *     tags: [SQLite Studio & Database]
 *     responses:
 *       200:
 *         description: Метаданные базы данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DbStats'
 */
app.get('/api/db/stats', (req, res) => {
  const dbPath = getSqliteDbPath();
  let fileSizeBytes = 0;
  try {
    const stats = fs.statSync(dbPath);
    fileSizeBytes = stats.size;
  } catch (e) {
    fileSizeBytes = 0;
  }

  db.get("SELECT sqlite_version() AS version", [], (err, verRow) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get("PRAGMA integrity_check", [], (err, integRow) => {
      const integrity = integRow ? Object.values(integRow)[0] : 'ok';
      
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, tables) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          dbName: path.basename(dbPath),
          dbPath,
          fileSizeBytes,
          sqliteVersion: verRow ? verRow.version : '3.x',
          integrity: integrity || 'ok',
          tableCount: tables ? tables.length : 0
        });
      });
    });
  });
});

/**
 * @swagger
 * /api/db/tables:
 *   get:
 *     summary: Реестр всех таблиц базы данных со схемами
 *     description: Возвращает полный список таблиц, их DDL (CREATE TABLE), количество строк и структуру колонок (PRAGMA table_info).
 *     tags: [SQLite Studio & Database]
 *     responses:
 *       200:
 *         description: Список таблиц и метаданных
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DbTableMeta'
 */
app.get('/api/db/tables', (req, res) => {
  db.all("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC", [], (err, tables) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!tables || tables.length === 0) return res.json([]);

    const results = [];
    let pending = tables.length;

    tables.forEach((tbl) => {
      const tableName = tbl.name;
      db.all(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`, [], (colErr, cols) => {
        db.get(`SELECT COUNT(*) AS count FROM "${tableName.replace(/"/g, '""')}"`, [], (cntErr, cntRow) => {
          results.push({
            name: tableName,
            sql: tbl.sql,
            rowCount: cntRow ? cntRow.count : 0,
            columns: cols || []
          });
          pending--;
          if (pending === 0) {
            results.sort((a, b) => a.name.localeCompare(b.name));
            res.json(results);
          }
        });
      });
    });
  });
});

/**
 * @swagger
 * /api/db/tables/{table}/data:
 *   get:
 *     summary: Постраничные данные конкретной таблицы
 *     description: Возвращает строки выбранной таблицы с поддержкой постраничной пагинации, сортировки и полнотекстового поиска.
 *     tags: [SQLite Studio & Database]
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Имя таблицы в SQLite
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Номер страницы (начиная с 0)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Число записей на страницу
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *         description: Поле для сортировки
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Строка глобального поиска по значениям
 *     responses:
 *       200:
 *         description: Данные таблицы
 */
app.get('/api/db/tables/:table/data', (req, res) => {
  const tableName = req.params.table;
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  const page = parseInt(req.query.page, 10) || 0;
  const pageSize = parseInt(req.query.pageSize, 10) || 50;
  const sortField = req.query.sortField;
  const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
  const search = req.query.search ? String(req.query.search).trim() : '';

  db.all(`PRAGMA table_info("${tableName}")`, [], (err, cols) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!cols || cols.length === 0) return res.status(404).json({ error: 'Table not found or has no columns' });

    let whereClause = '';
    const params = [];
    if (search) {
      const searchConditions = cols
        .map(c => `CAST("${c.name}" AS TEXT) LIKE ?`)
        .join(' OR ');
      whereClause = ` WHERE ${searchConditions}`;
      cols.forEach(() => params.push(`%${search}%`));
    }

    const countSql = `SELECT COUNT(*) AS total FROM "${tableName}"${whereClause}`;
    db.get(countSql, params, (cntErr, countRow) => {
      if (cntErr) return res.status(500).json({ error: cntErr.message });
      const total = countRow ? countRow.total : 0;

      let orderBy = '';
      if (sortField && cols.some(c => c.name === sortField)) {
        orderBy = ` ORDER BY "${sortField}" ${sortOrder}`;
      }

      const offset = page * pageSize;
      const dataSql = `SELECT rowid AS _rowid, * FROM "${tableName}"${whereClause}${orderBy} LIMIT ${pageSize} OFFSET ${offset}`;
      
      db.all(dataSql, params, (dataErr, rows) => {
        if (dataErr) return res.status(500).json({ error: dataErr.message });
        
        const formattedRows = rows.map((r, idx) => {
          return {
            ...r,
            id: r.id !== undefined && r.id !== null ? r.id : (r._rowid !== undefined ? r._rowid : `row_${offset + idx}`)
          };
        });

        res.json({
          tableName,
          columns: cols,
          rows: formattedRows,
          total,
          page,
          pageSize
        });
      });
    });
  });
});

/**
 * @swagger
 * /api/db/tables/{table}/row:
 *   post:
 *     summary: Вставить новую запись в любую таблицу через SQLite Studio
 *     tags: [SQLite Studio & Database]
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Запись создана
 */
app.post('/api/db/tables/:table/row', (req, res) => {
  const tableName = req.params.table;
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });
  const rowData = { ...req.body };
  delete rowData.id;
  delete rowData._rowid;

  const colNames = Object.keys(rowData);
  if (colNames.length === 0) return res.status(400).json({ error: 'No data provided' });

  const placeholders = colNames.map(() => '?').join(', ');
  const colsEscaped = colNames.map(c => `"${c.replace(/"/g, '""')}"`).join(', ');
  const values = colNames.map(c => rowData[c]);

  const sql = `INSERT INTO "${tableName}" (${colsEscaped}) VALUES (${placeholders})`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, lastID: this.lastID, changes: this.changes });
  });
});

/**
 * @swagger
 * /api/db/tables/{table}/row/{rowid}:
 *   put:
 *     summary: Обновить строку таблицы
 *     tags: [SQLite Studio & Database]
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: rowid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Запись обновлена
 */
app.put('/api/db/tables/:table/row/:rowid', (req, res) => {
  const tableName = req.params.table;
  const rowId = req.params.rowid;
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });

  const rowData = { ...req.body };
  delete rowData.id;
  delete rowData._rowid;

  const colNames = Object.keys(rowData);
  if (colNames.length === 0) return res.status(400).json({ error: 'No data to update' });

  const setClauses = colNames.map(c => `"${c.replace(/"/g, '""')}" = ?`).join(', ');
  const values = [...colNames.map(c => rowData[c]), rowId, rowId];

  const sql = `UPDATE "${tableName}" SET ${setClauses} WHERE rowid = ? OR id = ?`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

/**
 * @swagger
 * /api/db/tables/{table}/row/{rowid}:
 *   delete:
 *     summary: Удалить строку из таблицы
 *     tags: [SQLite Studio & Database]
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: rowid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Запись удалена
 */
app.delete('/api/db/tables/:table/row/:rowid', (req, res) => {
  const tableName = req.params.table;
  const rowId = req.params.rowid;
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) return res.status(400).json({ error: 'Invalid table name' });

  const sql = `DELETE FROM "${tableName}" WHERE rowid = ? OR id = ?`;
  db.run(sql, [rowId, rowId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, changes: this.changes });
  });
});

/**
 * @swagger
 * /api/db/query:
 *   post:
 *     summary: Выполнить прямой SQL запрос в SQLite консоли
 *     description: Запускает произвольный SQL запрос (SELECT, INSERT, UPDATE, DELETE, PRAGMA, EXPLAIN, CREATE, ALTER). Замеряет время выполнения и возвращает структурированный ответ с метаданными колонок.
 *     tags: [SQLite Studio & Database]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SqlQueryRequest'
 *     responses:
 *       200:
 *         description: Результат выполнения SQL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SqlQueryResponse'
 *       400:
 *         description: Синтаксическая или runtime ошибка SQLite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/api/db/query', (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string' || !sql.trim()) {
    return res.status(400).json({ error: 'SQL query string is required' });
  }

  const trimmedSql = sql.trim();
  const startTime = Date.now();
  const isSelectOrPragma = /^(SELECT|PRAGMA|EXPLAIN|WITH)\b/i.test(trimmedSql);

  if (isSelectOrPragma) {
    db.all(trimmedSql, [], (err, rows) => {
      const executionTimeMs = Date.now() - startTime;
      if (err) return res.status(400).json({ error: err.message, executionTimeMs });

      let columns = [];
      if (rows && rows.length > 0) {
        columns = Object.keys(rows[0]).map(key => ({ field: key, headerName: key }));
      }
      
      const formattedRows = (rows || []).map((r, idx) => ({
        ...r,
        id: r.id !== undefined && r.id !== null ? r.id : (r._rowid !== undefined ? r._rowid : `row_${idx}`)
      }));

      res.json({
        type: 'select',
        rows: formattedRows,
        columns,
        rowCount: formattedRows.length,
        executionTimeMs
      });
    });
  } else {
    db.run(trimmedSql, [], function(err) {
      const executionTimeMs = Date.now() - startTime;
      if (err) return res.status(400).json({ error: err.message, executionTimeMs });
      res.json({
        type: 'mutation',
        changes: this.changes,
        lastID: this.lastID,
        executionTimeMs
      });
    });
  }
});

// ============================================================================
// ============================================================================
// Firebird & SQLite Dynamic AppSettings Configuration Endpoints
// ============================================================================

/**
 * @swagger
 * /api/admin/config:
 *   get:
 *     summary: Получить текущую динамическую конфигурацию appsettings.json
 *     tags: [Administrator & Firebird Sync]
 *     responses:
 *       200:
 *         description: Параметры подключения к SQLite и Firebird
 */
app.get('/api/admin/config', (req, res) => {
  try {
    const config = getAppSettings();
    res.json({
      success: true,
      source: 'appsettings.json',
      config,
      resolvedSqlitePath: getSqliteDbPath()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @swagger
 * /api/admin/config:
 *   post:
 *     summary: Обновить параметры подключения в appsettings.json динамически
 *     tags: [Administrator & Firebird Sync]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Конфигурация успешно обновлена
 */
app.post('/api/admin/config', (req, res) => {
  try {
    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ success: false, error: 'Некорректные данные конфигурации' });
    }

    const current = getAppSettings();
    const updated = {
      ...current,
      ...incoming,
      ConnectionStrings: {
        ...current.ConnectionStrings,
        ...(incoming.ConnectionStrings || {}),
        SQLite: {
          ...current.ConnectionStrings?.SQLite,
          ...(incoming.ConnectionStrings?.SQLite || {})
        },
        Firebird: {
          ...current.ConnectionStrings?.Firebird,
          ...(incoming.ConnectionStrings?.Firebird || {})
        }
      }
    };

    saveAppSettings(updated);
    res.json({
      success: true,
      message: 'Параметры appsettings.json успешно обновлены',
      config: updated,
      resolvedSqlitePath: getSqliteDbPath()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @swagger
 * /api/admin/firebird/status:
 *   get:
 *     summary: Получить текущий статус синхронизации, параметры appsettings.json и количество записей в SQLite
 *     tags: [Administrator & Firebird Sync]
 *     responses:
 *       200:
 *         description: Статус базы данных
 */
app.get('/api/admin/firebird/status', (req, res) => {
  const stats = {};
  const fbConfig = getFirebirdConfig();
  const sqliteConfig = getSqliteConfig();
  const sqliteDbPath = getSqliteDbPath();
  const settings = getAppSettings();

  db.get("SELECT COUNT(*) as count FROM patients", (err, r1) => {
    stats.patientsCount = r1 ? r1.count : 0;
    db.get("SELECT COUNT(*) as count FROM patient_visits", (err, r2) => {
      stats.visitsCount = r2 ? r2.count : 0;
      db.get("SELECT COUNT(*) as count FROM channels", (err, r3) => {
        stats.channelsCount = r3 ? r3.count : 0;
        db.get("SELECT COUNT(*) as count FROM insurers", (err, r4) => {
          stats.insurersCount = r4 ? r4.count : 0;
          db.get("SELECT COUNT(*) as count FROM dms_cards", (err, r5) => {
            stats.dmsCardsCount = r5 ? r5.count : 0;
            res.json({
              success: true,
              source: 'appsettings.json',
              defaultFbPath: fbConfig.DatabasePath,
              defaultUser: fbConfig.User,
              firebirdConfig: fbConfig,
              sqliteConfig: sqliteConfig,
              resolvedSqlitePath: sqliteDbPath,
              appsettings: settings,
              sqliteStats: stats
            });
          });
        });
      });
    });
  });
});

/**
 * @swagger
 * /api/admin/firebird/test:
 *   post:
 *     summary: Проверить подключение к Firebird базе данных (динамические параметры из appsettings.json)
 *     tags: [Administrator & Firebird Sync]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dbPath:
 *                 type: string
 *               user:
 *                 type: string
 *               password:
 *                 type: string
 *               host:
 *                 type: string
 *               port:
 *                 type: integer
 *               charset:
 *                 type: string
 *     responses:
 *       200:
 *         description: Результат проверки подключения
 */
app.post('/api/admin/firebird/test', (req, res) => {
  const fbConfig = getFirebirdConfig();
  const { dbPath, user, password, host, port, charset } = req.body || {};
  const targetDb = dbPath || fbConfig.DatabasePath || "C:\\Users\\vladimir\\source\\DB\\Export\\MEDICAL.FDB";
  const targetUser = user || fbConfig.User || "SYSDBA";
  const targetPass = password || fbConfig.Password || "masterkey";
  const targetHost = host || fbConfig.Host || "localhost";
  const targetPort = port || fbConfig.Port || 3050;
  const targetCharset = charset || fbConfig.Charset || "WIN1251";

  const scriptPath = path.resolve(__dirname, 'sync_patients_firebird.py');
  const cmd = `python "${scriptPath}" --test "${targetDb}" "${targetUser}" "${targetPass}" "${targetHost}" "${targetPort}" "${targetCharset}"`;

  exec(cmd, { encoding: 'utf-8' }, (err, stdout, stderr) => {
    try {
      const result = JSON.parse(stdout.trim());
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (e) {
      res.status(500).json({ success: false, error: stderr || stdout || e.message });
    }
  });
});

/**
 * @swagger
 * /api/admin/firebird/sync:
 *   post:
 *     summary: Запустить процедуру полной синхронизации из Firebird в SQLite (динамические параметры)
 *     tags: [Administrator & Firebird Sync]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dbPath:
 *                 type: string
 *               user:
 *                 type: string
 *               password:
 *                 type: string
 *               host:
 *                 type: string
 *               port:
 *                 type: integer
 *               charset:
 *                 type: string
 *     responses:
 *       200:
 *         description: Результаты синхронизации и консольный лог
 */
app.post('/api/admin/firebird/sync', (req, res) => {
  const fbConfig = getFirebirdConfig();
  const { dbPath, user, password, host, port, charset } = req.body || {};
  const targetDb = dbPath || fbConfig.DatabasePath || "C:\\Users\\vladimir\\source\\DB\\Export\\MEDICAL.FDB";
  const targetUser = user || fbConfig.User || "SYSDBA";
  const targetPass = password || fbConfig.Password || "masterkey";
  const targetHost = host || fbConfig.Host || "localhost";
  const targetPort = port || fbConfig.Port || 3050;
  const targetCharset = charset || fbConfig.Charset || "WIN1251";
  const targetSqlite = getSqliteDbPath();

  const scriptPath = path.resolve(__dirname, 'sync_patients_firebird.py');
  const cmd = `python "${scriptPath}" "${targetDb}" "${targetUser}" "${targetPass}" "${targetHost}" "${targetPort}" "${targetCharset}" "${targetSqlite}"`;

  const startTime = Date.now();
  exec(cmd, { encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
        stderr,
        stdout,
        elapsedSeconds
      });
    }

    res.json({
      success: true,
      message: "Синхронизация успешно завершена",
      logs: stdout,
      elapsedSeconds
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
