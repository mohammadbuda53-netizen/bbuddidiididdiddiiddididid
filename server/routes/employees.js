const { Router } = require('express');
const store = require('../store');

const router = Router();

router.get('/', (req, res) => {
  let employees = store.getAll(store.employees);
  if (req.query.active === 'true') {
    employees = employees.filter((e) => e.active);
  }
  res.json(employees);
});

router.get('/:id', (req, res) => {
  const employee = store.getById(store.employees, req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  res.json(employee);
});

router.post('/', (req, res) => {
  const { name, role, hourlyRate, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const employee = store.create(store.employees, {
    name,
    role: role || 'Geselle',
    hourlyRate: hourlyRate || 0,
    email: email || '',
    phone: phone || '',
    active: true,
  });
  res.status(201).json(employee);
});

router.put('/:id', (req, res) => {
  const updated = store.update(store.employees, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Employee not found' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = store.remove(store.employees, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Employee not found' });
  res.json({ ok: true });
});

module.exports = router;
