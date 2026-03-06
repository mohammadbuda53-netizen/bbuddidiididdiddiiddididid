const { Router } = require('express');
const store = require('../store');
const { generateId, nowISO } = require('../utils');

const router = Router();

router.get('/', (req, res) => {
  let entries = store.getAll(store.timeEntries);
  if (req.query.projectId) {
    entries = entries.filter((t) => t.projectId === req.query.projectId);
  }
  if (req.query.employeeId) {
    entries = entries.filter((t) => t.employeeId === req.query.employeeId);
  }
  if (req.query.from) {
    entries = entries.filter((t) => t.date >= req.query.from);
  }
  if (req.query.to) {
    entries = entries.filter((t) => t.date <= req.query.to);
  }
  // Enrich with names
  const enriched = entries.map((t) => {
    const project = store.getById(store.projects, t.projectId);
    const employee = store.getById(store.employees, t.employeeId);
    return {
      ...t,
      projectName: project ? project.name : 'Unbekannt',
      employeeName: employee ? employee.name : 'Unbekannt',
      cost: (t.hours || 0) * (employee ? employee.hourlyRate : 0),
    };
  });
  res.json(enriched);
});

router.post('/', (req, res) => {
  const { projectId, employeeId, date, startTime, endTime, breakMinutes, description } = req.body;
  if (!projectId || !employeeId) return res.status(400).json({ error: 'projectId and employeeId are required' });

  let hours = 0;
  if (startTime && endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    hours = Math.max(0, (eh * 60 + em - sh * 60 - sm - (breakMinutes || 0)) / 60);
    hours = Math.round(hours * 100) / 100;
  }

  const entry = store.create(store.timeEntries, {
    projectId,
    employeeId,
    date: date || new Date().toISOString().slice(0, 10),
    startTime: startTime || '',
    endTime: endTime || null,
    breakMinutes: breakMinutes || 0,
    description: description || '',
    hours,
  });
  res.status(201).json(entry);
});

// Start timer
router.post('/start-timer', (req, res) => {
  const { projectId, employeeId, description } = req.body;
  if (!projectId || !employeeId) return res.status(400).json({ error: 'projectId and employeeId are required' });

  const now = new Date();
  const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const entry = store.create(store.timeEntries, {
    projectId,
    employeeId,
    date: now.toISOString().slice(0, 10),
    startTime,
    endTime: null,
    breakMinutes: 0,
    description: description || '',
    hours: 0,
  });
  res.status(201).json(entry);
});

// Stop timer
router.post('/:id/stop-timer', (req, res) => {
  const entry = store.getById(store.timeEntries, req.params.id);
  if (!entry) return res.status(404).json({ error: 'Time entry not found' });
  if (entry.endTime) return res.status(400).json({ error: 'Timer already stopped' });

  const now = new Date();
  const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [sh, sm] = entry.startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const hours = Math.max(0, Math.round(((eh * 60 + em - sh * 60 - sm - (entry.breakMinutes || 0)) / 60) * 100) / 100);

  const updated = store.update(store.timeEntries, req.params.id, { endTime, hours });
  res.json(updated);
});

router.put('/:id', (req, res) => {
  const data = { ...req.body };
  // Recalculate hours if times changed
  if (data.startTime && data.endTime) {
    const [sh, sm] = data.startTime.split(':').map(Number);
    const [eh, em] = data.endTime.split(':').map(Number);
    data.hours = Math.max(0, Math.round(((eh * 60 + em - sh * 60 - sm - (data.breakMinutes || 0)) / 60) * 100) / 100);
  }
  const updated = store.update(store.timeEntries, req.params.id, data);
  if (!updated) return res.status(404).json({ error: 'Time entry not found' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const deleted = store.remove(store.timeEntries, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Time entry not found' });
  res.json({ ok: true });
});

module.exports = router;
