import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import Timer from '../components/Timer';

export default function TimeTracking() {
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const [form, setForm] = useState({ projectId: '', employeeId: '', date: '', startTime: '', endTime: '', breakMinutes: 0, description: '' });
  const [filterProject, setFilterProject] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [e, p, emp] = await Promise.all([api.getTimeEntries(), api.getProjects(), api.getEmployees()]);
      setEntries(e);
      setProjects(p);
      setEmployees(emp);
      const running = e.find((t) => !t.endTime);
      setActiveTimer(running || null);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (filterProject) result = result.filter((t) => t.projectId === filterProject);
    if (filterDate) result = result.filter((t) => t.date === filterDate);
    return result.sort((a, b) => b.date.localeCompare(a.date) || (b.startTime || '').localeCompare(a.startTime || ''));
  }, [entries, filterProject, filterDate]);

  const totalHours = useMemo(() => {
    return Math.round(filteredEntries.reduce((sum, t) => sum + (t.hours || 0), 0) * 100) / 100;
  }, [filteredEntries]);

  const startTimer = async () => {
    if (!form.projectId || !form.employeeId) {
      alert('Bitte Projekt und Mitarbeiter auswählen');
      return;
    }
    await api.startTimer({ projectId: form.projectId, employeeId: form.employeeId, description: form.description });
    load();
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    await api.stopTimer(activeTimer.id);
    setActiveTimer(null);
    load();
  };

  const openManualEntry = () => {
    setForm({
      projectId: projects[0]?.id || '',
      employeeId: employees[0]?.id || '',
      date: new Date().toISOString().slice(0, 10),
      startTime: '08:00',
      endTime: '16:00',
      breakMinutes: 30,
      description: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.createTimeEntry({ ...form, breakMinutes: Number(form.breakMinutes) });
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Zeiteintrag löschen?')) return;
    await api.deleteTimeEntry(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zeiterfassung</h1>
          <p className="text-gray-500 mt-1">{filteredEntries.length} Einträge · {totalHours} Stunden</p>
        </div>
        <button onClick={openManualEntry} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          + Manueller Eintrag
        </button>
      </div>

      {/* Timer Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Timer</h3>
        {activeTimer ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Timer startTime={activeTimer.startTime} running={true} />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{activeTimer.projectName}</p>
              <p className="text-sm text-gray-500">{activeTimer.employeeName} · {activeTimer.description || 'Keine Beschreibung'}</p>
            </div>
            <button onClick={stopTimer} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Stop
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="">Projekt wählen...</option>
              {projects.filter((p) => p.status !== 'completed').map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="">Mitarbeiter wählen...</option>
              {employees.filter((e) => e.active).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <input type="text" placeholder="Tätigkeit..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <button onClick={startTimer} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
              Start
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Alle Projekte</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
        {(filterProject || filterDate) && (
          <button onClick={() => { setFilterProject(''); setFilterDate(''); }} className="text-sm text-gray-400 hover:text-gray-600">Filter zurücksetzen</button>
        )}
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-12">Laden...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-gray-400 text-center py-12">Keine Einträge gefunden</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Datum</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Projekt</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Mitarbeiter</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Zeit</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Pause</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Tätigkeit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Stunden</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Kosten</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((t) => (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{t.date}</td>
                    <td className="py-3 px-4 text-gray-600">{t.projectName}</td>
                    <td className="py-3 px-4 text-gray-600">{t.employeeName}</td>
                    <td className="py-3 px-4 text-gray-600">{t.startTime} – {t.endTime || <span className="text-red-500 font-medium">läuft</span>}</td>
                    <td className="py-3 px-4 text-gray-400">{t.breakMinutes} min</td>
                    <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">{t.description}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{t.hours} h</td>
                    <td className="py-3 px-4 text-right text-gray-600">{t.cost?.toLocaleString('de-DE')} €</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600 text-xs">Löschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Zeiteintrag erfassen">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projekt *</label>
              <select required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mitarbeiter *</label>
              <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pause (min)</label>
              <input type="number" min="0" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tätigkeit</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600">Abbrechen</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Speichern</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
