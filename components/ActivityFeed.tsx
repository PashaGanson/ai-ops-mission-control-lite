'use client';

import { useEffect, useState } from 'react';
import { AGENT_COLORS, AGENT_NAMES, normalizeAgentId } from '@/lib/agents';

interface ActivityEntry {
  ts?: string;
  timestamp?: string;
  agent: string;
  action?: string;
  event?: string;
  type?: string;
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    // Load initial events
    fetch('/api/activity')
      .then((r) => r.json())
      .then((data: ActivityEntry[]) => setEntries(data.slice(-20).reverse()))
      .catch(() => {});

    // Connect to SSE stream for real-time updates
    const es = new EventSource('/api/activity/stream');
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    es.onmessage = (e) => {
      try {
        const event: ActivityEntry = JSON.parse(e.data);
        setEntries((prev) => [event, ...prev].slice(0, 50));
      } catch {
        /* ignore heartbeat comments */
      }
    };

    es.onerror = () => {
      // On SSE error, fall back to polling
      es.close();
      fallbackInterval = setInterval(() => {
        fetch('/api/activity')
          .then((r) => r.json())
          .then((data: ActivityEntry[]) => setEntries(data.slice(-20).reverse()))
          .catch(() => {});
      }, 5000);
    };

    return () => {
      es.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  return (
    <div
      className="flex flex-col rounded-xl p-4 sticky top-6 overflow-hidden"
      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', maxHeight: 'calc(100vh - 48px)', maskImage: 'linear-gradient(to bottom, black calc(100% - 48px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 48px), transparent 100%)' }}
    >
      {/* Header with pulsing dot */}
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-sm font-semibold text-white">Активность</span>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {entries.length === 0 && (
          <p className="text-gray-600 text-xs text-center py-4">Нет событий</p>
        )}
        {entries.map((entry, i) => {
          const agentId = normalizeAgentId(entry.agent);
          const color = AGENT_COLORS[agentId] || '#6b7280';
          const name = AGENT_NAMES[agentId] || entry.agent;
          const text = entry.action || entry.event || '';
          const timeStr = entry.ts || entry.timestamp || '';
          return (
            <div key={`${timeStr}-${i}`} className="flex items-start gap-2">
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium" style={{ color }}>{name}</span>
                <p className="text-xs text-gray-400 line-clamp-2">{text}</p>
                <span className="text-[10px] text-gray-600">{timeStr ? formatTime(timeStr) : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
