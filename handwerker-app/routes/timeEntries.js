const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/time-entries
router.get('/', (req, res) => {
  const db = getDb();
  const { project_id, employee_id, date } = req.query;
  let sql = `
    SELECT te.*, p.name as project_name, e.first_name || ' ' || e.last_name as employee_name
    FROM time_entries te
    JOIN projects p ON p.id = te.project_id
    JOIN employees e ON e.id = te.employee_id
    WHERE 1=1
  `;
  const params = [];
  if (project_id) { sql += ' AND te.project_id = ?'; params.push(project_id); }
  if (employee_id) { sql += ' AND te.employee_id = ?'; params.push(employee_id); }
  if (date) { sql += ' AND te.date = ?'; params.push(date); }
  sql += ' ORDER BY te.date DESC, te.start_time DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// POST /api/time-entries
router.post('/', (req, res) => {
  const db = getDb();
  const { project_id, employee_id, date, start_time, end_time, hours, description } = req.body;
  if (!project_id || !employee_id || !date || !start_time) {
    return res.status(400).json({ error: 'project_id, employee_id, date and start_time are required' });
  }

  let computedHours = hours || null;
  if (!computedHours && end_time) {
    computedHours = calcHours(start_time, end_time);
  }

  const result = db.prepare(`
    INSERT INTO time_entries (project_id, employee_id, date, start_time, end_time, hours, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(project_id, employee_id, date, start_time, end_time || null, computedHours, description || null);

  const entry = db.prepare(`
    SELECT te.*, p.name as project_name, e.first_name || ' ' || e.last_name as employee_name
    FROM time_entries te
    JOIN projects p ON p.id = te.project_id
    JOIN employees e ON e.id = te.employee_id
    WHERE te.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(entry);
});

// POST /api/time-entries/:id/stop
router.post('/:id/stop', (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Time entry not found' });
  if (entry.end_time) return res.status(400).json({ error: 'Timer already stopped' });

  const now = new Date();
  const endTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const computedHours = calcHours(entry.start_time, endTime);

  db.prepare('UPDATE time_entries SET end_time = ?, hours = ? WHERE id = ?')
    .run(endTime, computedHours, req.params.id);

  const updated = db.prepare(`
    SELECT te.*, p.name as project_name, e.first_name || ' ' || e.last_name as employee_name
    FROM time_entries te
    JOIN projects p ON p.id = te.project_id
    JOIN employees e ON e.id = te.employee_id
    WHERE te.id = ?
  `).get(req.params.id);
  res.json(updated);
});

// PUT /api/time-entries/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Time entry not found' });

  const { project_id, employee_id, date, start_time, end_time, hours, description } = req.body;
  const newStart = start_time || existing.start_time;
  const newEnd = end_time !== undefined ? end_time : existing.end_time;
  let computedHours = hours;
  if (computedHours === undefined && newEnd) {
    computedHours = calcHours(newStart, newEnd);
  }

  db.prepare(`
    UPDATE time_entries SET project_id = ?, employee_id = ?, date = ?, start_time = ?,
    end_time = ?, hours = ?, description = ? WHERE id = ?
  `).run(
    project_id || existing.project_id,
    employee_id || existing.employee_id,
    date || existing.date,
    newStart, newEnd, computedHours,
    description !== undefined ? description : existing.description,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT te.*, p.name as project_name, e.first_name || ' ' || e.last_name as employee_name
    FROM time_entries te
    JOIN projects p ON p.id = te.project_id
    JOIN employees e ON e.id = te.employee_id
    WHERE te.id = ?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE /api/time-entries/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Time entry not found' });
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

function calcHours(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return Math.round(diff / 60 * 100) / 100;
}

module.exports = router;
