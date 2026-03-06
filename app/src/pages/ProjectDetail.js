import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [materialModal, setMaterialModal] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [matForm, setMatForm] = useState({ itemId: '', quantity: 1, note: '' });

  const load = () => {
    setLoading(true);
    api.getProject(id).then(setProject).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const openMaterialModal = async () => {
    const items = await api.getInventory();
    setInventoryItems(items);
    setMatForm({ itemId: items[0]?.id || '', quantity: 1, note: '' });
    setMaterialModal(true);
  };

  const addMaterial = async (e) => {
    e.preventDefault();
    await api.addProjectMaterial({ projectId: id, ...matForm, quantity: Number(matForm.quantity) });
    setMaterialModal(false);
    load();
  };

  const removeMaterial = async (matId) => {
    if (!window.confirm('Material-Zuweisung entfernen?')) return;
    await api.removeProjectMaterial(matId);
    load();
  };

  if (loading) return <div className="text-gray-400 text-center py-12">Laden...</div>;
  if (!project) return <div className="text-red-500">Projekt nicht gefunden</div>;

  const tabs = [
    { key: 'overview', label: 'Übersicht' },
    { key: 'time', label: `Zeiten (${project.timeEntries?.length || 0})` },
    { key: 'material', label: `Material (${project.materials?.length || 0})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/projects')} className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
            ← Zurück zu Projekte
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-1">{project.client}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Projektdetails</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Adresse</span><span className="text-gray-900">{project.address || '–'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Startdatum</span><span className="text-gray-900">{project.startDate || '–'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Enddatum</span><span className="text-gray-900">{project.endDate || '–'}</span></div>
              {project.description && <div className="pt-2 border-t border-gray-50"><p className="text-gray-600">{project.description}</p></div>}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Kosten-Übersicht</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Arbeitsstunden</span><span className="font-medium text-gray-900">{project.totalHours} h</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Arbeitskosten</span><span className="font-medium text-gray-900">{project.totalLaborCost?.toLocaleString('de-DE')} €</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Materialkosten</span><span className="font-medium text-gray-900">{project.totalMaterialCost?.toLocaleString('de-DE')} €</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-semibold text-gray-900">Gesamtkosten</span><span className="font-bold text-blue-600 text-lg">{project.totalCost?.toLocaleString('de-DE')} €</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Time Tab */}
      {tab === 'time' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {project.timeEntries?.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Datum</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Mitarbeiter</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Zeit</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Tätigkeit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Stunden</th>
                </tr>
              </thead>
              <tbody>
                {project.timeEntries.map((t) => (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{t.date}</td>
                    <td className="py-3 px-4 text-gray-600">{t.employeeId}</td>
                    <td className="py-3 px-4 text-gray-600">{t.startTime} – {t.endTime || 'läuft'}</td>
                    <td className="py-3 px-4 text-gray-600">{t.description}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{t.hours} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-center py-12">Noch keine Zeiteinträge</p>
          )}
        </div>
      )}

      {/* Material Tab */}
      {tab === 'material' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openMaterialModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              + Material zuweisen
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {project.materials?.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Artikel</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Menge</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Datum</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Notiz</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Kosten</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {project.materials.map((m) => (
                    <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{m.itemName}</td>
                      <td className="py-3 px-4 text-gray-600">{m.quantity} {m.itemUnit}</td>
                      <td className="py-3 px-4 text-gray-600">{m.date}</td>
                      <td className="py-3 px-4 text-gray-500">{m.note || '–'}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{(m.quantity * m.pricePerUnit).toLocaleString('de-DE')} €</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => removeMaterial(m.id)} className="text-red-400 hover:text-red-600 text-xs">Entfernen</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-center py-12">Noch kein Material zugewiesen</p>
            )}
          </div>

          <Modal open={materialModal} onClose={() => setMaterialModal(false)} title="Material zuweisen">
            <form onSubmit={addMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artikel</label>
                <select value={matForm.itemId} onChange={(e) => setMatForm({ ...matForm, itemId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} (Bestand: {item.quantity} {item.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menge</label>
                <input type="number" min="1" required value={matForm.quantity} onChange={(e) => setMatForm({ ...matForm, quantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notiz</label>
                <input type="text" value={matForm.note} onChange={(e) => setMatForm({ ...matForm, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setMaterialModal(false)} className="px-4 py-2 text-sm text-gray-600">Abbrechen</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Zuweisen</button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}
