import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const EMPTY_FORM = { name: '', category: '', unit: 'Stück', quantity: 0, minQuantity: 0, pricePerUnit: 0, supplier: '' };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.getInventory().then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    return [...new Set(items.map((i) => i.category))].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (filterCategory) result = result.filter((i) => i.category === filterCategory);
    if (filterLowStock) result = result.filter((i) => i.quantity <= i.minQuantity);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(s) || i.supplier.toLowerCase().includes(s));
    }
    return result;
  }, [items, filterCategory, filterLowStock, search]);

  const totalValue = useMemo(() => {
    return Math.round(filteredItems.reduce((sum, i) => sum + i.quantity * i.pricePerUnit, 0) * 100) / 100;
  }, [filteredItems]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setForm({ name: item.name, category: item.category, unit: item.unit, quantity: item.quantity, minQuantity: item.minQuantity, pricePerUnit: item.pricePerUnit, supplier: item.supplier });
    setEditId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, quantity: Number(form.quantity), minQuantity: Number(form.minQuantity), pricePerUnit: Number(form.pricePerUnit) };
    if (editId) {
      await api.updateInventoryItem(editId, data);
    } else {
      await api.createInventoryItem(data);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Artikel wirklich löschen?')) return;
    await api.deleteInventoryItem(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lagerverwaltung</h1>
          <p className="text-gray-500 mt-1">{filteredItems.length} Artikel · Lagerwert: {totalValue.toLocaleString('de-DE')} €</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          + Neuer Artikel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none w-48" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Alle Kategorien</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterLowStock ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Niedriger Bestand {filterLowStock ? '✓' : ''}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-gray-400 text-center py-12">Laden...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-gray-400 text-center py-12">Keine Artikel gefunden</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Artikel</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Kategorie</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Bestand</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Min.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Preis/Einheit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Wert</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Lieferant</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{item.category}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-4 text-right text-gray-400">{item.minQuantity}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.quantity <= item.minQuantity ? 'low_stock' : 'ok'} />
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{item.pricePerUnit.toLocaleString('de-DE')} €</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{(item.quantity * item.pricePerUnit).toLocaleString('de-DE')} €</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[150px] truncate">{item.supplier}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-blue-600 text-xs mr-2">Bearbeiten</button>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 text-xs">Löschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Artikel bearbeiten' : 'Neuer Artikel'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Artikelname *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                list="categories"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              <datalist id="categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Einheit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option>Stück</option>
                <option>Meter</option>
                <option>qm</option>
                <option>kg</option>
                <option>Liter</option>
                <option>Rolle</option>
                <option>Sack</option>
                <option>Paket</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bestand</label>
              <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mindestbestand</label>
              <input type="number" min="0" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preis/Einheit (€)</label>
              <input type="number" min="0" step="0.01" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieferant</label>
            <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
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
