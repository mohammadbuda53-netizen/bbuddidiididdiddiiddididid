const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/employees
router.get('/', (req, res) => {
  const db = getDb();
  const activeOnly = req.query.active;
  let rows;
  if (activeOnly === '1') {
    rows = db.prepare('SELECT * FROM employees WHERE active = 1 ORDER BY last_name').all();
  } else {
    rows = db.prepare('SELECT * FROM employees ORDER BY last_name').all();
  }
  res.json(rows);
});

// POST /api/employees
router.post('/', (req, res) => {
  const db = getDb();
  const { first_name, last_name, email, role, hourly_rate } = req.body;
  if (!first_name || !last_name) return res.status(400).json({ error: 'first_name and last_name are required' });
  const result = db.prepare(`
    INSERT INTO employees (first_name, last_name, email, role, hourly_rate)
    VALUES (?, ?, ?, ?, ?)
  `).run(first_name, last_name, email || null, role || 'Geselle', hourly_rate || 0);
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(employee);
});

// PUT /api/employees/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Employee not found' });

  const { first_name, last_name, email, role, hourly_rate, active } = req.body;
  db.prepare(`
    UPDATE employees SET first_name = ?, last_name = ?, email = ?, role = ?, hourly_rate = ?, active = ?
    WHERE id = ?
  `).run(
    first_name || existing.first_name,
    last_name || existing.last_name,
    email !== undefined ? email : existing.email,
    role || existing.role,
    hourly_rate !== undefined ? hourly_rate : existing.hourly_rate,
    active !== undefined ? active : existing.active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/employees/:id (soft delete)
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Employee not found' });
  db.prepare('UPDATE employees SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
