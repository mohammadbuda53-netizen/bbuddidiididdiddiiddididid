const express = require('express');
const cors = require('cors');
const path = require('path');

const projectsRouter = require('./routes/projects');
const employeesRouter = require('./routes/employees');
const timeEntriesRouter = require('./routes/timeEntries');
const articlesRouter = require('./routes/articles');
const projectArticlesRouter = require('./routes/projectArticles');
const reportsRouter = require('./routes/reports');

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/time-entries', timeEntriesRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/project-articles', projectArticlesRouter);
app.use('/api/reports', reportsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'handwerker-app' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Handwerker-App läuft auf http://localhost:${port}`);
  });
}

module.exports = app;
