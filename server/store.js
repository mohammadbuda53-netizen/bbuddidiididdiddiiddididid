const { generateId, nowISO, todayISO } = require('./utils');

class Store {
  constructor() {
    this.projects = new Map();
    this.employees = new Map();
    this.timeEntries = new Map();
    this.inventory = new Map();
    this.projectMaterials = new Map();
    this.seed();
  }

  seed() {
    const now = nowISO();
    const today = todayISO();

    // Employees
    const employees = [
      { id: 'emp-1', name: 'Thomas Müller', role: 'Meister', hourlyRate: 55, email: 'thomas@handwerk.de', phone: '+49 170 1234567', active: true, createdAt: now },
      { id: 'emp-2', name: 'Stefan Weber', role: 'Geselle', hourlyRate: 42, email: 'stefan@handwerk.de', phone: '+49 170 2345678', active: true, createdAt: now },
      { id: 'emp-3', name: 'Lisa Schmidt', role: 'Geselle', hourlyRate: 42, email: 'lisa@handwerk.de', phone: '+49 170 3456789', active: true, createdAt: now },
      { id: 'emp-4', name: 'Max Bauer', role: 'Azubi', hourlyRate: 18, email: 'max@handwerk.de', phone: '+49 170 4567890', active: true, createdAt: now },
    ];
    employees.forEach((e) => this.employees.set(e.id, e));

    // Projects
    const projects = [
      { id: 'proj-1', name: 'Badsanierung Familie Schneider', client: 'Familie Schneider', address: 'Hauptstr. 12, 80331 München', status: 'in_progress', description: 'Komplettsanierung Badezimmer EG, inkl. Fliesen, Sanitär und Elektro', startDate: '2026-02-15', endDate: null, createdAt: now, updatedAt: now },
      { id: 'proj-2', name: 'Küchenmontage Café Morgenrot', client: 'Café Morgenrot GmbH', address: 'Leopoldstr. 42, 80802 München', status: 'in_progress', description: 'Einbau Gastroküche mit Abluftanlage', startDate: '2026-02-20', endDate: null, createdAt: now, updatedAt: now },
      { id: 'proj-3', name: 'Dachstuhl Erneuerung Meier', client: 'Hans Meier', address: 'Waldweg 7, 82031 Grünwald', status: 'open', description: 'Dachstuhl komplett erneuern, Dämmung nach EnEV', startDate: '2026-03-10', endDate: null, createdAt: now, updatedAt: now },
      { id: 'proj-4', name: 'Bürorenovierung TechStart', client: 'TechStart AG', address: 'Arnulfstr. 60, 80335 München', status: 'completed', description: 'Malerarbeiten, Bodenbelag, Elektroinstallation für 200qm Bürofläche', startDate: '2026-01-05', endDate: '2026-02-10', createdAt: now, updatedAt: now },
    ];
    projects.forEach((p) => this.projects.set(p.id, p));

    // Time Entries
    const timeEntries = [
      { id: 'te-1', projectId: 'proj-1', employeeId: 'emp-1', date: '2026-03-03', startTime: '07:30', endTime: '16:00', breakMinutes: 30, description: 'Fliesenarbeiten Badezimmer', hours: 8, createdAt: now },
      { id: 'te-2', projectId: 'proj-1', employeeId: 'emp-2', date: '2026-03-03', startTime: '07:30', endTime: '16:00', breakMinutes: 30, description: 'Sanitärinstallation', hours: 8, createdAt: now },
      { id: 'te-3', projectId: 'proj-2', employeeId: 'emp-3', date: '2026-03-03', startTime: '08:00', endTime: '15:30', breakMinutes: 30, description: 'Abluftanlage Montage', hours: 7, createdAt: now },
      { id: 'te-4', projectId: 'proj-1', employeeId: 'emp-1', date: '2026-03-04', startTime: '07:30', endTime: '16:30', breakMinutes: 30, description: 'Fliesenarbeiten fortgesetzt', hours: 8.5, createdAt: now },
      { id: 'te-5', projectId: 'proj-2', employeeId: 'emp-2', date: '2026-03-04', startTime: '08:00', endTime: '16:00', breakMinutes: 45, description: 'Küchenzeile Montage', hours: 7.25, createdAt: now },
      { id: 'te-6', projectId: 'proj-1', employeeId: 'emp-4', date: '2026-03-04', startTime: '08:00', endTime: '14:00', breakMinutes: 30, description: 'Zuarbeit Fliesenarbeiten', hours: 5.5, createdAt: now },
      { id: 'te-7', projectId: 'proj-4', employeeId: 'emp-1', date: '2026-02-05', startTime: '07:00', endTime: '16:00', breakMinutes: 60, description: 'Elektroinstallation Büro', hours: 8, createdAt: now },
      { id: 'te-8', projectId: 'proj-4', employeeId: 'emp-3', date: '2026-02-05', startTime: '08:00', endTime: '16:00', breakMinutes: 30, description: 'Malerarbeiten', hours: 7.5, createdAt: now },
    ];
    timeEntries.forEach((t) => this.timeEntries.set(t.id, t));

    // Inventory
    const inventoryItems = [
      { id: 'inv-1', name: 'Kupferrohr 15mm (3m)', category: 'Sanitär', unit: 'Stück', quantity: 45, minQuantity: 10, pricePerUnit: 12.50, supplier: 'Sanitär Großhandel Süd', createdAt: now, updatedAt: now },
      { id: 'inv-2', name: 'Fliesen 30x60 weiß matt', category: 'Fliesen', unit: 'qm', quantity: 28, minQuantity: 15, pricePerUnit: 24.90, supplier: 'Fliesenparadies München', createdAt: now, updatedAt: now },
      { id: 'inv-3', name: 'NYM-J 3x1.5mm² (100m)', category: 'Elektro', unit: 'Rolle', quantity: 8, minQuantity: 3, pricePerUnit: 67.00, supplier: 'Elektro Fachhandel', createdAt: now, updatedAt: now },
      { id: 'inv-4', name: 'Silikon transparent 310ml', category: 'Dichtung', unit: 'Stück', quantity: 3, minQuantity: 10, pricePerUnit: 8.90, supplier: 'Baustoff König', createdAt: now, updatedAt: now },
      { id: 'inv-5', name: 'Rigipsplatten 12.5mm', category: 'Trockenbau', unit: 'Stück', quantity: 35, minQuantity: 20, pricePerUnit: 6.80, supplier: 'Baustoff König', createdAt: now, updatedAt: now },
      { id: 'inv-6', name: 'Fliesenkleber C2 25kg', category: 'Fliesen', unit: 'Sack', quantity: 12, minQuantity: 5, pricePerUnit: 18.50, supplier: 'Fliesenparadies München', createdAt: now, updatedAt: now },
      { id: 'inv-7', name: 'Eckventil 1/2"', category: 'Sanitär', unit: 'Stück', quantity: 22, minQuantity: 8, pricePerUnit: 7.90, supplier: 'Sanitär Großhandel Süd', createdAt: now, updatedAt: now },
      { id: 'inv-8', name: 'Mineralwolle WLG 035 (120mm)', category: 'Dämmung', unit: 'qm', quantity: 5, minQuantity: 20, pricePerUnit: 14.20, supplier: 'Baustoff König', createdAt: now, updatedAt: now },
    ];
    inventoryItems.forEach((i) => this.inventory.set(i.id, i));

    // Project Materials
    const materials = [
      { id: 'pm-1', projectId: 'proj-1', itemId: 'inv-2', quantity: 18, date: '2026-03-03', note: 'Badezimmer Wand + Boden', createdAt: now },
      { id: 'pm-2', projectId: 'proj-1', itemId: 'inv-6', quantity: 4, date: '2026-03-03', note: 'Fliesenkleber für Bad', createdAt: now },
      { id: 'pm-3', projectId: 'proj-1', itemId: 'inv-1', quantity: 6, date: '2026-03-02', note: 'Wasseranschlüsse Bad', createdAt: now },
      { id: 'pm-4', projectId: 'proj-2', itemId: 'inv-3', quantity: 2, date: '2026-03-01', note: 'Elektro Gastroküche', createdAt: now },
    ];
    materials.forEach((m) => this.projectMaterials.set(m.id, m));
  }

  // Generic CRUD helpers
  getAll(map) {
    return Array.from(map.values());
  }

  getById(map, id) {
    return map.get(id) || null;
  }

  create(map, data) {
    const id = generateId();
    const now = nowISO();
    const record = { id, ...data, createdAt: now };
    map.set(id, record);
    return record;
  }

  update(map, id, data) {
    const existing = map.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id, updatedAt: nowISO() };
    map.set(id, updated);
    return updated;
  }

  remove(map, id) {
    return map.delete(id);
  }

  // Dashboard aggregation
  getDashboardStats() {
    const projects = this.getAll(this.projects);
    const timeEntries = this.getAll(this.timeEntries);
    const inventoryItems = this.getAll(this.inventory);
    const employees = this.getAll(this.employees);

    const activeProjects = projects.filter((p) => p.status !== 'completed').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;

    // Hours this week (current week Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const mondayStr = monday.toISOString().slice(0, 10);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = sunday.toISOString().slice(0, 10);

    const weekEntries = timeEntries.filter((t) => t.date >= mondayStr && t.date <= sundayStr);
    const totalHoursThisWeek = weekEntries.reduce((sum, t) => sum + (t.hours || 0), 0);

    // Total hours all time
    const totalHoursAllTime = timeEntries.reduce((sum, t) => sum + (t.hours || 0), 0);

    // Low stock items
    const lowStockItems = inventoryItems.filter((i) => i.quantity <= i.minQuantity);

    // Revenue estimate (hours * employee rate)
    const totalRevenue = timeEntries.reduce((sum, t) => {
      const emp = this.employees.get(t.employeeId);
      return sum + (t.hours || 0) * (emp ? emp.hourlyRate : 0);
    }, 0);

    // Hours per project
    const hoursPerProject = {};
    timeEntries.forEach((t) => {
      if (!hoursPerProject[t.projectId]) hoursPerProject[t.projectId] = 0;
      hoursPerProject[t.projectId] += t.hours || 0;
    });

    const projectStats = projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      hours: hoursPerProject[p.id] || 0,
    }));

    // Hours per employee this week
    const employeeWeekHours = {};
    weekEntries.forEach((t) => {
      if (!employeeWeekHours[t.employeeId]) employeeWeekHours[t.employeeId] = 0;
      employeeWeekHours[t.employeeId] += t.hours || 0;
    });

    const employeeStats = employees.filter((e) => e.active).map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      hoursThisWeek: employeeWeekHours[e.id] || 0,
    }));

    return {
      activeProjects,
      completedProjects,
      totalProjects: projects.length,
      totalHoursThisWeek: Math.round(totalHoursThisWeek * 100) / 100,
      totalHoursAllTime: Math.round(totalHoursAllTime * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, minQuantity: i.minQuantity })),
      activeEmployees: employees.filter((e) => e.active).length,
      projectStats,
      employeeStats,
    };
  }
}

const store = new Store();
module.exports = store;
