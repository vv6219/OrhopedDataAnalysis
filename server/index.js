const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Swagger Open API definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ОртоERP Backend API',
      version: '1.0.0',
      description: 'API для Центра Ортопедии и Травматологии Добрушкина (ЭМК, Склад, Операции)',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server',
      },
    ],
  },
  apis: ['./index.js'], // Look for Swagger annotations in this file
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Material:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID материала
 *         material_name:
 *           type: string
 *           description: Название
 *         unit_of_measure:
 *           type: string
 *           description: Единица измерения (шт, мл)
 *         current_unit_cost:
 *           type: number
 *           description: Стоимость единицы (₽)
 */

/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: Получить список всех материалов на складе
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
 */
app.get('/api/materials', (req, res) => {
  db.all("SELECT * FROM materials_catalog", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/materials', (req, res) => {
  const { material_name, unit_of_measure, current_unit_cost, package_cost } = req.body;
  const stmt = db.prepare("INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost, package_cost) VALUES (?, ?, ?, ?)");
  stmt.run(material_name, unit_of_measure, current_unit_cost, package_cost || 0, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, material_name, unit_of_measure, current_unit_cost, package_cost });
  });
  stmt.finalize();
});

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

app.delete('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM materials_catalog WHERE id = ?", id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedID: id });
  });
});

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Получить список всех пациентов (ЭМК)
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: Список пациентов успешно получен
 */
app.get('/api/patients', (req, res) => {
  db.all("SELECT * FROM patients", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/operations:
 *   get:
 *     summary: Получить каталог процедур и операций
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: Каталог процедур успешно получен
 */
app.get('/api/operations', (req, res) => {
  db.all("SELECT * FROM operations", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/operations', (req, res) => {
  const { name, price } = req.body;
  const stmt = db.prepare("INSERT INTO operations (name, price) VALUES (?, ?)");
  stmt.run(name, price, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, price });
  });
  stmt.finalize();
});

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

app.delete('/api/operations/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM operations WHERE id = ?", id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedID: id });
  });
});

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

app.delete('/api/operations/:id/materials/:omId', (req, res) => {
  const { omId } = req.params;
  db.run("DELETE FROM operation_materials WHERE id = ?", omId, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deletedID: omId });
  });
});

/**
 * @swagger
 * /api/dashboard/kpi:
 *   get:
 *     summary: Получить ключевые показатели эффективности для дашборда (Выручка, Пациенты и т.д.)
 *     tags: [BI Dashboard]
 *     responses:
 *       200:
 *         description: KPI успешно получены
 */
app.get('/api/dashboard/kpi', (req, res) => {
  // In a real app, this would aggregate from transactions table. For now, mock data
  res.json({
    totalRevenue: 1250000,
    activePatients: 342,
    proceduresThisMonth: 87
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
