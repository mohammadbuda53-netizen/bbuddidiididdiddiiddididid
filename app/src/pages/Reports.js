import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Papa from 'papaparse';
import { api } from '../api';

export default function Reports() {
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');

  useEffect(() => {
    Promise.all([api.getTimeEntries(), api.getProjects(), api.getEmployees()])
      .then(([e, p, emp]) => { setEntries(e); setProjects(p); setEmployees(emp); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = entries;
    if (dateFrom) result = result.filter((t) => t.date >= dateFrom);
    if (dateTo) result = result.filter((t) => t.date <= dateTo);
    if (filterProject) result = result.filter((t) => t.projectId === filterProject);
    if (filterEmployee) result = result.filter((t) => t.employeeId === filterEmployee);
    return result;
  }, [entries, dateFrom, dateTo, filterProject, filterEmployee]);

  const summary = useMemo(() => {
    const totalHours = filtered.reduce((s, t) => s + (t.hours || 0), 0);
    const totalCost = filtered.reduce((s, t) => s + (t.cost || 0), 0);
    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      entries: filtered.length,
    };
  }, [filtered]);

  const chartByProject = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      if (!map[t.projectName]) map[t.projectName] = { name: t.projectName, Stunden: 0, Kosten: 0 };
      map[t.projectName].Stunden += t.hours || 0;
      map[t.projectName].Kosten += t.cost || 0;
    });
    return Object.values(map).map((d) => ({
      ...d,
      Stunden: Math.round(d.Stunden * 100) / 100,
      Kosten: Math.round(d.Kosten * 100) / 100,
      name: d.name.length > 25 ? d.name.slice(0, 25) + '…' : d.name,
    }));
  }, [filtered]);

  const chartByEmployee = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      if (!map[t.employeeName]) map[t.employeeName] = { name: t.employeeName, Stunden: 0, Kosten: 0 };
      map[t.employeeName].Stunden += t.hours || 0;
      map[t.employeeName].Kosten += t.cost || 0;
    });
    return Object.values(map).map((d) => ({
      ...d,
      Stunden: Math.round(d.Stunden * 100) / 100,
      Kosten: Math.round(d.Kosten * 100) / 100,
    }));
  }, [filtered]);

  const exportCSV = () => {
    const data = filtered.map((t) => ({
      Datum: t.date,
      Projekt: t.projectName,
      Mitarbeiter: t.employeeName,
      Von: t.startTime,
      Bis: t.endTime || 'läuft',
      'Pause (min)': t.breakMinutes,
      Tätigkeit: t.description,
      Stunden: t.hours,
      'Kosten (€)': t.cost,
    }));
    const csv = Papa.unparse(data, { delimiter: ';' });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Zeitbericht_${dateFrom || 'alle'}_${dateTo || 'alle'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-gray-400 text-center py-12">Laden...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Berichte</h1>
          <p className="text-gray-500 mt-1">Auswertungen und Export</p>
        </div>
        <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          CSV Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Von</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bis</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Projekt</label>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Alle</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mitarbeiter</label>
            <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Alle</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          {(dateFrom || dateTo || filterProject || filterEmployee) && (
            <div className="flex items-end">
              <button onClick={() => { setDateFrom(''); setDateTo(''); setFilterProject(''); setFilterEmployee(''); }}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">Zurücksetzen</button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Einträge</p>
          <p className="text-3xl font-bold text-gray-900">{summary.entries}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Gesamtstunden</p>
          <p className="text-3xl font-bold text-blue-600">{summary.totalHours} h</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Gesamtkosten</p>
          <p className="text-3xl font-bold text-emerald-600">{summary.totalCost.toLocaleString('de-DE')} €</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Stunden pro Projekt</h3>
          {chartByProject.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartByProject} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="Stunden" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Keine Daten</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Stunden pro Mitarbeiter</h3>
          {chartByEmployee.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartByEmployee} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="Stunden" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Kosten" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Keine Daten</p>
          )}
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Detailansicht</h3>
        </div>
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Datum</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Projekt</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Mitarbeiter</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Tätigkeit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Stunden</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Kosten</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{t.date}</td>
                    <td className="py-3 px-4 text-gray-600">{t.projectName}</td>
                    <td className="py-3 px-4 text-gray-600">{t.employeeName}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate">{t.description}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{t.hours} h</td>
                    <td className="py-3 px-4 text-right text-gray-600">{t.cost?.toLocaleString('de-DE')} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-12">Keine Einträge für den gewählten Zeitraum</p>
        )}
      </div>
    </div>
  );
}
