import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api';
import StatsCard from '../components/StatsCard';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const projectChartData = useMemo(() => {
    if (!data) return [];
    return data.projectStats.filter((p) => p.hours > 0).map((p) => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
      Stunden: p.hours,
    }));
  }, [data]);

  const statusChartData = useMemo(() => {
    if (!data) return [];
    const counts = { open: 0, in_progress: 0, completed: 0 };
    data.projectStats.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return [
      { name: 'Offen', value: counts.open },
      { name: 'In Arbeit', value: counts.in_progress },
      { name: 'Abgeschlossen', value: counts.completed },
    ].filter((d) => d.value > 0);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Laden...</div>
      </div>
    );
  }

  if (!data) return <div className="text-red-500">Fehler beim Laden der Daten</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Übersicht über alle Projekte und Ressourcen</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Aktive Projekte" value={data.activeProjects} sub={`${data.totalProjects} gesamt`} color="blue" />
        <StatsCard label="Stunden diese Woche" value={data.totalHoursThisWeek} sub={`${data.totalHoursAllTime} gesamt`} color="green" />
        <StatsCard label="Umsatz (Arbeit)" value={`${data.totalRevenue.toLocaleString('de-DE')} €`} color="purple" />
        <StatsCard
          label="Lager-Warnungen"
          value={data.lowStockCount}
          sub={data.lowStockCount > 0 ? 'Artikel nachbestellen' : 'Alles OK'}
          color={data.lowStockCount > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hours per Project */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Stunden pro Projekt</h3>
          {projectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value} h`, 'Stunden']}
                />
                <Bar dataKey="Stunden" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Noch keine Zeiteinträge vorhanden</p>
          )}
        </div>

        {/* Project Status Pie */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Projektstatus</h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Keine Projekte</p>
          )}
        </div>
      </div>

      {/* Low Stock Warnings */}
      {data.lowStockItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h3 className="text-base font-semibold text-red-700 mb-3">⚠ Lager-Warnungen</h3>
          <div className="space-y-2">
            {data.lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                <span className="text-sm text-red-600 font-medium">
                  Bestand: {item.quantity} (Min: {item.minQuantity})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Hours */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Mitarbeiter – Stunden diese Woche</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 font-medium text-gray-500">Name</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">Rolle</th>
                <th className="text-right py-2 px-3 font-medium text-gray-500">Stunden</th>
              </tr>
            </thead>
            <tbody>
              {data.employeeStats.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="py-2.5 px-3 text-gray-500">{emp.role}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-900">{emp.hoursThisWeek} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
