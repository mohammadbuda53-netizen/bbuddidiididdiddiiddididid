const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/', (req, res) => {
  let projects = store.getAll(store.projects);
  if (req.query.status) {
    projects = projects.filter((p) => p.status === req.query.status);
  }
  res.json(projects);
});

router.get('/:id', (req, res) => {
  const project = store.getById(store.projects, req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const timeEntries = store.getAll(store.timeEntries).filter((t) => t.projectId === project.id);
  const materials = store.getAll(store.projectMaterials).filter((m) => m.projectId === project.id);
  const enrichedMaterials = materials.map((m) => {
    const item = store.getById(store.inventory, m.itemId);
    return { ...m, itemName: item ? item.name : 'Unbekannt', itemUnit: item ? item.unit : '', pricePerUnit: item ? item.pricePerUnit : 0 };
  });

  const totalHours = timeEntries.reduce((sum, t) => sum + (t.hours || 0), 0);
  const totalMaterialCost = enrichedMaterials.reduce((sum, m) => sum + m.quantity * m.pricePerUnit, 0);
  const totalLaborCost = timeEntries.reduce((sum, t) => {
    const emp = store.getById(store.employees, t.employeeId);
    return sum + (t.hours || 0) * (emp ? emp.hourlyRate : 0);
  }, 0);

  res.json({
    ...project,
    timeEntries,
    materials: enrichedMaterials,
    totalHours: Math.round(totalHours * 100) / 100,
    totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
    totalLaborCost: Math.round(totalLaborCost * 100) / 100,
    totalCost: Math.round((totalMaterialCost + totalLaborCost) * 100) / 100,
  });
});

router.post('/', (req, res) => {
  const { name, client, address, status, description, startDate, endDate } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const project = store.create(store.projects, {
    name,
    client: client || '',
    address: address || '',
    status: status || 'open',
    description: description || '',
    startDate: startDate || new Date().toISOString().slice(0, 10),
    endDate: endDate || null,
    updatedAt: new Date().toISOString(),
  });
  res.status(201).json(project);
});

router.put('/:id', (req, res) => {
  const updated = store.update(store.projects, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Project not found' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = store.remove(store.projects, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Project not found' });
  res.json({ ok: true });
});

module.exports = router;
