const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Projects
  getProjects: (status) => request(`/projects${status ? `?status=${status}` : ''}`),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Employees
  getEmployees: () => request('/employees'),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),

  // Time Entries
  getTimeEntries: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/time-entries${qs ? `?${qs}` : ''}`);
  },
  createTimeEntry: (data) => request('/time-entries', { method: 'POST', body: JSON.stringify(data) }),
  startTimer: (data) => request('/time-entries/start-timer', { method: 'POST', body: JSON.stringify(data) }),
  stopTimer: (id) => request(`/time-entries/${id}/stop-timer`, { method: 'POST' }),
  updateTimeEntry: (id, data) => request(`/time-entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimeEntry: (id) => request(`/time-entries/${id}`, { method: 'DELETE' }),

  // Inventory
  getInventory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/inventory${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => request('/inventory/categories'),
  createInventoryItem: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateInventoryItem: (id, data) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventoryItem: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),

  // Project Materials
  getProjectMaterials: (projectId) => request(`/project-materials/${projectId}`),
  addProjectMaterial: (data) => request('/project-materials', { method: 'POST', body: JSON.stringify(data) }),
  removeProjectMaterial: (id) => request(`/project-materials/${id}`, { method: 'DELETE' }),
};
