class HandwerkerService {
  constructor() {
    this.projects = new Map();
    this.warehouse = new Map();
  }

  createProject({ projectId, name, client, address = null, tags = [] }) {
    if (!projectId || !name || !client) {
      throw new Error('projectId, name and client are required');
    }
    if (this.projects.has(projectId)) {
      throw new Error(`Project already exists: ${projectId}`);
    }
    const now = new Date().toISOString();
    const project = {
      projectId,
      name,
      client,
      address,
      status: 'open',
      tags: Array.isArray(tags) ? tags : [String(tags)],
      createdAt: now,
      archivedAt: null,
      timeEntries: [],
      notes: [],
      allocations: [],
      activity: []
    };
    this.projects.set(projectId, project);
    this._addActivity(project, 'project_created', { name, client });
    return project;
  }

  listProjects() {
    return Array.from(this.projects.values()).map((project) => this._projectSnapshot(project));
  }

  getProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Unknown project ${projectId}`);
    return project;
  }

  addTimeEntry({ projectId, entryId, worker, start = null, end = null, minutes, description = '' }) {
    const project = this.getProject(projectId);
    if (!entryId || !worker) {
      throw new Error('entryId and worker are required');
    }
    const computedMinutes = this._computeMinutes({ start, end, minutes });
    const entry = {
      entryId,
      projectId,
      worker,
      start: start ? new Date(start).toISOString() : null,
      end: end ? new Date(end).toISOString() : null,
      minutes: computedMinutes,
      description,
      createdAt: new Date().toISOString()
    };
    project.timeEntries.push(entry);
    this._addActivity(project, 'time_entry', { entryId, worker, minutes: computedMinutes });
    return entry;
  }

  addProjectNote({ projectId, noteId, author, text }) {
    const project = this.getProject(projectId);
    if (!noteId || !author || !text) {
      throw new Error('noteId, author and text are required');
    }
    const note = {
      noteId,
      projectId,
      author,
      text,
      createdAt: new Date().toISOString()
    };
    project.notes.push(note);
    this._addActivity(project, 'note', { noteId, author });
    return note;
  }

  createWarehouseItem({ itemId, sku, name, unit = 'pcs', quantity, location = null }) {
    if (!itemId || !sku || !name) {
      throw new Error('itemId, sku and name are required');
    }
    const qty = Number(quantity ?? 0);
    if (!Number.isFinite(qty) || qty < 0) {
      throw new Error('quantity must be a positive number');
    }
    const now = new Date().toISOString();
    const item = {
      itemId,
      sku,
      name,
      unit,
      availableQty: qty,
      location,
      createdAt: now
    };
    this.warehouse.set(itemId, item);
    return item;
  }

  listWarehouseItems() {
    return Array.from(this.warehouse.values());
  }

  allocateInventory({ projectId, allocationId, itemId, quantity, location = null }) {
    const project = this.getProject(projectId);
    const item = this.warehouse.get(itemId);
    if (!item) throw new Error(`Unknown warehouse item ${itemId}`);
    if (!allocationId) throw new Error('allocationId is required');
    const qty = Number(quantity ?? 0);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('quantity must be greater than 0');
    }
    if (item.availableQty < qty) {
      throw new Error('insufficient_stock');
    }
    item.availableQty -= qty;
    const allocation = {
      allocationId,
      projectId,
      itemId,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      quantity: qty,
      location: location ?? item.location,
      allocatedAt: new Date().toISOString()
    };
    project.allocations.push(allocation);
    this._addActivity(project, 'inventory_allocated', { allocationId, itemId, quantity: qty });
    return allocation;
  }

  archiveProject(projectId) {
    const project = this.getProject(projectId);
    if (project.status === 'archived') return project;
    project.status = 'archived';
    project.archivedAt = new Date().toISOString();
    this._addActivity(project, 'project_archived', { archivedAt: project.archivedAt });
    return project;
  }

  projectSummary(projectId) {
    const project = this.getProject(projectId);
    const totalMinutes = project.timeEntries.reduce((sum, entry) => sum + entry.minutes, 0);
    const hours = Math.round((totalMinutes / 60) * 100) / 100;
    const allocations = project.allocations.reduce((sum, allocation) => sum + allocation.quantity, 0);
    const lastActivity = project.activity[project.activity.length - 1] || null;
    return {
      projectId: project.projectId,
      name: project.name,
      client: project.client,
      status: project.status,
      totalMinutes,
      totalHours: hours,
      allocationCount: project.allocations.length,
      allocatedUnits: allocations,
      lastActivity
    };
  }

  projectActivity(projectId) {
    const project = this.getProject(projectId);
    return [...project.activity].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  _projectSnapshot(project) {
    return {
      projectId: project.projectId,
      name: project.name,
      client: project.client,
      status: project.status,
      createdAt: project.createdAt,
      tags: project.tags,
      totalMinutes: project.timeEntries.reduce((sum, entry) => sum + entry.minutes, 0),
      allocationCount: project.allocations.length,
      lastActivity: project.activity[project.activity.length - 1] || null
    };
  }

  _computeMinutes({ start, end, minutes }) {
    if (Number.isFinite(minutes) && minutes >= 0) return minutes;
    if (!start || !end) {
      throw new Error('minutes or start/end are required');
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error('invalid_start_or_end');
    }
    const diffMs = endDate - startDate;
    if (diffMs < 0) throw new Error('end_before_start');
    return Math.round(diffMs / 60000);
  }

  _addActivity(project, type, payload) {
    project.activity.push({
      eventId: `evt_${project.activity.length + 1}`,
      projectId: project.projectId,
      type,
      payload,
      createdAt: new Date().toISOString()
    });
  }
}

module.exports = { HandwerkerService };
