const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/project-articles?project_id=
router.get('/', (req, res) => {
  const db = getDb();
  const projectId = req.query.project_id;
  let sql = `
    SELECT pa.*, a.name as article_name, a.article_number, a.unit, a.price_per_unit,
    (pa.quantity * a.price_per_unit) as total_cost
    FROM project_articles pa
    JOIN articles a ON a.id = pa.article_id
  `;
  const params = [];
  if (projectId) { sql += ' WHERE pa.project_id = ?'; params.push(projectId); }
  sql += ' ORDER BY pa.date_used DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// POST /api/project-articles
router.post('/', (req, res) => {
  const db = getDb();
  const { project_id, article_id, quantity, date_used, notes } = req.body;
  if (!project_id || !article_id || !quantity || !date_used) {
    return res.status(400).json({ error: 'project_id, article_id, quantity and date_used are required' });
  }

  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(article_id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  if (article.stock_quantity < quantity) {
    return res.status(400).json({ error: `Insufficient stock. Available: ${article.stock_quantity} ${article.unit}` });
  }

  const result = db.prepare(`
    INSERT INTO project_articles (project_id, article_id, quantity, date_used, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(project_id, article_id, quantity, date_used, notes || null);

  // Reduce stock
  db.prepare('UPDATE articles SET stock_quantity = stock_quantity - ? WHERE id = ?').run(quantity, article_id);

  const entry = db.prepare(`
    SELECT pa.*, a.name as article_name, a.article_number, a.unit, a.price_per_unit,
    (pa.quantity * a.price_per_unit) as total_cost
    FROM project_articles pa
    JOIN articles a ON a.id = pa.article_id
    WHERE pa.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(entry);
});

// DELETE /api/project-articles/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare(`
    SELECT pa.*, a.stock_quantity as current_stock
    FROM project_articles pa
    JOIN articles a ON a.id = pa.article_id
    WHERE pa.id = ?
  `).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project article not found' });

  // Restore stock
  db.prepare('UPDATE articles SET stock_quantity = stock_quantity + ? WHERE id = ?')
    .run(existing.quantity, existing.article_id);

  db.prepare('DELETE FROM project_articles WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
