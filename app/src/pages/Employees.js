import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const EMPTY_FORM = { name: '', role: 'Geselle', hourlyRate: 0, email: '', phone: '' };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

  const load = () => {
    setLoading(true);
    api.getEmployees().then(setEmployees).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setForm({ name: emp.name, role: emp.role, hourlyRate: emp.hourlyRate, email: emp.email, phone: emp.phone });
    setEditId(emp.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, hourlyRate: Number(form.hourlyRate) };
    if (editId) {
      await api.updateEmployee(editId, data);
    } else {
      await api.createEmployee(data);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Mitarbeiter wirklich löschen?')) return;
    await api.deleteEmployee(id);
    load();
  };

  const toggleActive = async (emp) => {
    await api.updateEmployee(emp.id, { active: !emp.active });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mitarbeiter</h1>
          <p className="text-gray-500 mt-1">{employees.filter((e) => e.active).length} aktiv · {employees.length} gesamt</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          + Neuer Mitarbeiter
        </button>
      </div>

      {/* Employee Cards */}
      {loading ? (
        <div className="text-gray-400 text-center py-12">Laden...</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-lg">Noch keine Mitarbeiter vorhanden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className={`bg-white rounded-2xl border p-5 transition-all ${emp.active ? 'border-gray-100 hover:shadow-md' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${emp.active ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gray-400'}`}>
                    {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{emp.name}</h3>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{emp.role}</span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${emp.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {emp.active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Stundensatz</span>
                  <span className="font-medium text-gray-900">{emp.hourlyRate} €/h</span>
                </div>
                {emp.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">E-Mail</span>
                    <span className="text-gray-600 truncate ml-4">{emp.email}</span>
                  </div>
                )}
                {emp.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Telefon</span>
                    <span className="text-gray-600">{emp.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-50">
                <button onClick={() => openEdit(emp)} className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1">Bearbeiten</button>
                <button onClick={() => toggleActive(emp)} className="text-xs text-gray-400 hover:text-amber-600 px-2 py-1">
                  {emp.active ? 'Deaktivieren' : 'Aktivieren'}
                </button>
                <button onClick={() => handleDelete(emp.id)} className="text-xs text-gray-400 hover:text-red-600 px-2 py-1">Löschen</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option>Meister</option>
                <option>Geselle</option>
                <option>Azubi</option>
                <option>Helfer</option>
                <option>Büro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stundensatz (€)</label>
              <input type="number" min="0" step="0.5" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Abbrechen</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {editId ? 'Speichern' : 'Anlegen'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
