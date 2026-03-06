const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/:projectId', (req, res) => {
  const materials = store.getAll(store.projectMaterials).filter((m) => m.projectId === req.params.projectId);
  const enriched = materials.map((m) => {
    const item = store.getById(store.inventory, m.itemId);
    return {
      ...m,
      itemName: item ? item.name : 'Unbekannt',
      itemUnit: item ? item.unit : '',
      pricePerUnit: item ? item.pricePerUnit : 0,
      totalCost: m.quantity * (item ? item.pricePerUnit : 0),
    };
  });
  res.json(enriched);
});

router.post('/', (req, res) => {
  const { projectId, itemId, quantity, note } = req.body;
  if (!projectId || !itemId || !quantity) {
    return res.status(400).json({ error: 'projectId, itemId and quantity are required' });
  }

  // Reduce inventory stock
  const item = store.getById(store.inventory, itemId);
  if (!item) return res.status(404).json({ error: 'Inventory item not found' });
  if (item.quantity < quantity) {
    return res.status(400).json({ error: `Nicht genug Bestand. Verfügbar: ${item.quantity} ${item.unit}` });
  }

  store.update(store.inventory, itemId, { quantity: item.quantity - quantity });

  const material = store.create(store.projectMaterials, {
    projectId,
    itemId,
    quantity,
    date: new Date().toISOString().slice(0, 10),
    note: note || '',
  });

  const updatedItem = store.getById(store.inventory, itemId);
  res.status(201).json({
    ...material,
    itemName: updatedItem.name,
    itemUnit: updatedItem.unit,
    pricePerUnit: updatedItem.pricePerUnit,
    totalCost: quantity * updatedItem.pricePerUnit,
  });
});

router.delete('/:id', (req, res) => {
  const material = store.getById(store.projectMaterials, req.params.id);
  if (!material) return res.status(404).json({ error: 'Material assignment not found' });

  // Return stock to inventory
  const item = store.getById(store.inventory, material.itemId);
  if (item) {
    store.update(store.inventory, material.itemId, { quantity: item.quantity + material.quantity });
  }

  store.remove(store.projectMaterials, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
