const { getDb } = require('./database');

const db = getDb();

// Seed employees
const insertEmployee = db.prepare(`
  INSERT OR IGNORE INTO employees (first_name, last_name, email, role, hourly_rate)
  VALUES (?, ?, ?, ?, ?)
`);
const employees = [
  ['Hans', 'Müller', 'hans@handwerker.de', 'Meister', 45],
  ['Peter', 'Schmidt', 'peter@handwerker.de', 'Geselle', 35],
  ['Karl', 'Weber', 'karl@handwerker.de', 'Geselle', 35],
  ['Lukas', 'Fischer', 'lukas@handwerker.de', 'Lehrling', 15],
];
for (const e of employees) insertEmployee.run(...e);

// Seed projects
const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (name, description, customer_name, customer_address, status, start_date)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const projects = [
  ['Badezimmer Umbau', 'Kompletter Umbau des Badezimmers im OG', 'Familie Braun', 'Hauptstr. 12, 80331 München', 'active', '2026-02-01'],
  ['Dachsanierung', 'Dach neu eindecken und dämmen', 'Herr Schneider', 'Gartenweg 5, 80333 München', 'active', '2026-02-15'],
  ['Küche Renovierung', 'Neue Küche einbauen inkl. Elektrik', 'Frau Wagner', 'Bergstr. 8, 80335 München', 'paused', '2026-01-10'],
];
for (const p of projects) insertProject.run(...p);

// Seed articles
const insertArticle = db.prepare(`
  INSERT OR IGNORE INTO articles (name, article_number, unit, price_per_unit, stock_quantity, min_stock, category)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const articles = [
  ['Fliesen 30x60 weiß', 'FL-3060-W', 'Stück', 2.50, 500, 50, 'Fliesen'],
  ['Fliesenkleber 25kg', 'FK-25', 'Paket', 18.90, 30, 5, 'Kleber'],
  ['Kupferrohr 15mm 3m', 'KR-15-3', 'Meter', 8.50, 100, 20, 'Rohre'],
  ['Silikon transparent', 'SI-TRANS', 'Stück', 6.90, 40, 10, 'Dichtung'],
  ['Rigipsplatte 2600x600', 'RG-2660', 'Stück', 12.50, 80, 15, 'Trockenbau'],
  ['Schrauben 4x40 100er', 'SC-440-100', 'Paket', 4.90, 60, 10, 'Befestigung'],
  ['Dämmwolle 100mm Rolle', 'DW-100', 'Stück', 35.00, 25, 5, 'Dämmung'],
  ['Wasserleitung PE 25mm', 'WL-PE25', 'Meter', 3.20, 200, 30, 'Rohre'],
];
for (const a of articles) insertArticle.run(...a);

// Seed time entries
const insertTime = db.prepare(`
  INSERT INTO time_entries (project_id, employee_id, date, start_time, end_time, hours, description)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const timeEntries = [
  [1, 1, '2026-02-10', '07:00', '15:30', 8.5, 'Alte Fliesen entfernt'],
  [1, 2, '2026-02-10', '07:00', '15:30', 8.5, 'Alte Fliesen entfernt'],
  [1, 1, '2026-02-11', '07:00', '16:00', 9.0, 'Rohre verlegt'],
  [1, 3, '2026-02-11', '08:00', '14:00', 6.0, 'Estrich vorbereitet'],
  [2, 2, '2026-02-20', '06:30', '15:00', 8.5, 'Alte Dachziegel entfernt'],
  [2, 4, '2026-02-20', '07:00', '15:00', 8.0, 'Unterstützung Demontage'],
];
for (const t of timeEntries) insertTime.run(...t);

// Seed project articles
const insertPA = db.prepare(`
  INSERT INTO project_articles (project_id, article_id, quantity, date_used, notes)
  VALUES (?, ?, ?, ?, ?)
`);
const projectArticles = [
  [1, 1, 120, '2026-02-12', 'Bodenfliesen Bad'],
  [1, 2, 5, '2026-02-12', 'Fliesenkleber für Bad'],
  [1, 4, 3, '2026-02-13', 'Silikonfugen'],
  [2, 7, 10, '2026-02-21', 'Dachdämmung'],
];
for (const pa of projectArticles) insertPA.run(...pa);

console.log('Seed data inserted successfully.');
