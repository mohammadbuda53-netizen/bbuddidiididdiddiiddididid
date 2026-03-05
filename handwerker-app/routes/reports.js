const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/reports/project-hours
router.get('/project-hours', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.id, p.name, p.status,
      COALESCE(SUM(te.hours), 0) as total_hours,
      COUNT(te.id) as entry_count
    FROM projects p
    LEFT JOIN time_entries te ON te.project_id = p.id
    GROUP BY p.id
    ORDER BY total_hours DESC
  `).all();
  res.json(rows);
});

// GET /api/reports/project-costs
router.get('/project-costs', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.id, p.name, p.status,
      COALESCE(hours_data.total_hours, 0) as total_hours,
      COALESCE(hours_data.labor_cost, 0) as labor_cost,
      COALESCE(material_data.material_cost, 0) as material_cost,
      COALESCE(hours_data.labor_cost, 0) + COALESCE(material_data.material_cost, 0) as total_cost
    FROM projects p
    LEFT JOIN (
      SELECT te.project_id,
        SUM(te.hours) as total_hours,
        SUM(te.hours * e.hourly_rate) as labor_cost
      FROM time_entries te
      JOIN employees e ON e.id = te.employee_id
      GROUP BY te.project_id
    ) hours_data ON hours_data.project_id = p.id
    LEFT JOIN (
      SELECT pa.project_id,
        SUM(pa.quantity * a.price_per_unit) as material_cost
      FROM project_articles pa
      JOIN articles a ON a.id = pa.article_id
      GROUP BY pa.project_id
    ) material_data ON material_data.project_id = p.id
    ORDER BY total_cost DESC
  `).all();
  res.json(rows);
});

// GET /api/reports/employee-hours
router.get('/employee-hours', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT e.id, e.first_name || ' ' || e.last_name as name, e.role, e.hourly_rate,
      COALESCE(SUM(te.hours), 0) as total_hours,
      COALESCE(SUM(te.hours), 0) * e.hourly_rate as total_earnings,
      COUNT(te.id) as entry_count
    FROM employees e
    LEFT JOIN time_entries te ON te.employee_id = e.id
    WHERE e.active = 1
    GROUP BY e.id
    ORDER BY total_hours DESC
  `).all();
  res.json(rows);
});

module.exports = router;
