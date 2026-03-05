const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/projects
router.get('/', (req, res) => {
  const db = getDb();
  const status = req.query.status;
  let rows;
  if (status) {
    rows = db.prepare('SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC').all(status);
  } else {
    rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  }
  res.json(rows);
});

// POST /api/projects
router.post('/', (req, res) => {
  const db = getDb();
  const { name, description, customer_name, customer_address, status, start_date, end_date } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare(`
    INSERT INTO projects (name, description, customer_name, customer_address, status, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, description || null, customer_name || null, customer_address || null, status || 'active', start_date || null, end_date || null);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(project);
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const totalHours = db.prepare('SELECT COALESCE(SUM(hours), 0) as total FROM time_entries WHERE project_id = ?').get(req.params.id);
  const materialCost = db.prepare(`
    SELECT COALESCE(SUM(pa.quantity * a.price_per_unit), 0) as total
    FROM project_articles pa
    JOIN articles a ON a.id = pa.article_id
    WHERE pa.project_id = ?
  `).get(req.params.id);

  res.json({
    ...project,
    total_hours: totalHours.total,
    material_cost: materialCost.total
  });
});

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const { name, description, customer_name, customer_address, status, start_date, end_date } = req.body;
  db.prepare(`
    UPDATE projects SET name = ?, description = ?, customer_name = ?, customer_address = ?,
    status = ?, start_date = ?, end_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || existing.name,
    description !== undefined ? description : existing.description,
    customer_name !== undefined ? customer_name : existing.customer_name,
    customer_address !== undefined ? customer_address : existing.customer_address,
    status || existing.status,
    start_date !== undefined ? start_date : existing.start_date,
    end_date !== undefined ? end_date : existing.end_date,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
