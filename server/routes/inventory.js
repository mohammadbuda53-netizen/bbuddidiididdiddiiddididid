const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/', (req, res) => {
  let items = store.getAll(store.inventory);
  if (req.query.category) {
    items = items.filter((i) => i.category === req.query.category);
  }
  if (req.query.lowStock === 'true') {
    items = items.filter((i) => i.quantity <= i.minQuantity);
  }
  res.json(items);
});

router.get('/categories', (req, res) => {
  const items = store.getAll(store.inventory);
  const categories = [...new Set(items.map((i) => i.category))].sort();
  res.json(categories);
});

router.get('/:id', (req, res) => {
  const item = store.getById(store.inventory, req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

router.post('/', (req, res) => {
  const { name, category, unit, quantity, minQuantity, pricePerUnit, supplier } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const item = store.create(store.inventory, {
    name,
    category: category || 'Sonstiges',
    unit: unit || 'Stück',
    quantity: quantity || 0,
    minQuantity: minQuantity || 0,
    pricePerUnit: pricePerUnit || 0,
    supplier: supplier || '',
    updatedAt: new Date().toISOString(),
  });
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  const updated = store.update(store.inventory, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Item not found' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = store.remove(store.inventory, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Item not found' });
  res.json({ ok: true });
});

module.exports = router;
