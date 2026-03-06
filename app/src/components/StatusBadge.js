import React from 'react';

const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  in_progress: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  low_stock: 'bg-red-50 text-red-700 ring-red-600/20',
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

const STATUS_LABELS = {
  open: 'Offen',
  in_progress: 'In Arbeit',
  completed: 'Abgeschlossen',
  low_stock: 'Niedrig',
  ok: 'OK',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20';
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {label}
    </span>
  );
}
