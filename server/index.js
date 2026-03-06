const express = require('express');
const cors = require('cors');
const path = require('path');

const projectsRouter = require('./routes/projects');
const employeesRouter = require('./routes/employees');
const timeEntriesRouter = require('./routes/timeEntries');
const inventoryRouter = require('./routes/inventory');
const projectMaterialsRouter = require('./routes/projectMaterials');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/time-entries', timeEntriesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/project-materials', projectMaterialsRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'handwerker-api' });
});

// Serve static frontend in production
const buildPath = path.join(__dirname, '..', 'app', 'build');
app.use(express.static(buildPath));
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Handwerker API running on http://localhost:${port}`);
});

module.exports = app;
