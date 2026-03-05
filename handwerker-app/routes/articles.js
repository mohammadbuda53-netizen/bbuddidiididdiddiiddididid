const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/articles
router.get('/', (req, res) => {
  const db = getDb();
  const lowStock = req.query.low_stock;
  let rows;
  if (lowStock === '1') {
    rows = db.prepare('SELECT * FROM articles WHERE stock_quantity <= min_stock ORDER BY name').all();
  } else {
    rows = db.prepare('SELECT * FROM articles ORDER BY name').all();
  }
  res.json(rows);
});

// POST /api/articles
router.post('/', (req, res) => {
  const db = getDb();
  const { name, article_number, unit, price_per_unit, stock_quantity, min_stock, category } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare(`
    INSERT INTO articles (name, article_number, unit, price_per_unit, stock_quantity, min_stock, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, article_number || null, unit || 'Stück', price_per_unit || 0, stock_quantity || 0, min_stock || 0, category || null);
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(article);
});

// PUT /api/articles/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found' });

  const { name, article_number, unit, price_per_unit, stock_quantity, min_stock, category } = req.body;
  db.prepare(`
    UPDATE articles SET name = ?, article_number = ?, unit = ?, price_per_unit = ?,
    stock_quantity = ?, min_stock = ?, category = ? WHERE id = ?
  `).run(
    name || existing.name,
    article_number !== undefined ? article_number : existing.article_number,
    unit || existing.unit,
    price_per_unit !== undefined ? price_per_unit : existing.price_per_unit,
    stock_quantity !== undefined ? stock_quantity : existing.stock_quantity,
    min_stock !== undefined ? min_stock : existing.min_stock,
    category !== undefined ? category : existing.category,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/articles/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found' });
  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
