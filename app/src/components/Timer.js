import React, { useState, useEffect } from 'react';

export default function Timer({ startTime, running }) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!running || !startTime) return;

    const update = () => {
      const [h, m] = startTime.split(':').map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const now = new Date();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      setElapsed(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime, running]);

  if (!running) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
      <span className="text-2xl font-mono font-bold text-red-700">{elapsed}</span>
    </div>
  );
}
