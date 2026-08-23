/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import KanbanColumn from '@/components/KanbanColumn';
import ActivityFeed from '@/components/ActivityFeed';
import { Task } from '@/components/TaskCard';
import { AGENT_NAMES, TASK_ASSIGNEE_OPTIONS, getAgentAvatarId, normalizeAgentId } from '@/lib/agents';

interface Project {
  id: string;
  name: string;
}

const COLUMNS = [
  { key: 'backlog', label: 'Backlog', emoji: '📥', color: '#6b7280' },
  { key: 'in_progress', label: 'In progress', emoji: '⚡', color: '#eab308' },
  { key: 'review', label: 'Review', emoji: '👁', color: '#f97316' },
  { key: 'done', label: 'Done', emoji: '✅', color: '#22c55e' },
];

const SEED_TASKS = [
  { title: 'Container 1: Bootstrap', status: 'done', assignee: 'tolik', description: 'Next.js каркас с темой и навигацией', project_id: '1' },
  { title: 'Container 2: API Layer', status: 'done', assignee: 'tolik', description: 'All API endpoints', project_id: '1' },
  { title: 'Demo task: Build Kanban board', status: 'in_progress', assignee: 'reporting-agent', description: 'Task board page with status columns', project_id: 'proj-ai-reporting' },
  { title: 'Container 4: Календарь', status: 'backlog', assignee: 'tolik', description: 'Визуализация кронов', project_id: '1' },
  { title: 'Container 5: Projectы', status: 'backlog', assignee: 'tolik', description: 'Карточки проектов', project_id: '1' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showModal, setShowModal] = useState(false);
  const [referenceTime, setReferenceTime] = useState<number | null>(null);

  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [pingTask, setPingTask] = useState<Task | null>(null);
  const [pingMessage, setPingMessage] = useState('');
  const [pingSending, setPingSending] = useState(false);
  const seededRef = useRef(false);
  const [mobileTab, setMobileTab] = useState(0);
  const [taskDragX, setTaskDragX] = useState(0);
  const [taskIsDragging, setTaskIsDragging] = useState(false);
  const taskSwipeRef = useRef<HTMLDivElement>(null);
  const taskStartXRef = useRef(0);
  const taskStartYRef = useRef(0);
  const taskStartTimeRef = useRef(0);
  const taskDirRef = useRef<'horiz' | 'vert' | null>(null);

  // Drag-based swipe listeners for passive: false
  useEffect(() => {
    const el = taskSwipeRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      taskStartXRef.current = e.touches[0].clientX;
      taskStartYRef.current = e.touches[0].clientY;
      taskStartTimeRef.current = Date.now();
      taskDirRef.current = null;
      setTaskIsDragging(false);
      // Edge swipe zone — let LayoutShell handle it
      if (taskStartXRef.current < 30) {
        taskDirRef.current = 'vert';
        return;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (taskDirRef.current === 'vert') return;
      const dx = e.touches[0].clientX - taskStartXRef.current;
      const dy = e.touches[0].clientY - taskStartYRef.current;
      if (taskDirRef.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        taskDirRef.current = Math.abs(dx) > Math.abs(dy) ? 'horiz' : 'vert';
      }
      if (taskDirRef.current === 'horiz') {
        e.preventDefault();
        setTaskIsDragging(true);
        setTaskDragX(dx);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (taskDirRef.current !== 'horiz') {
        taskDirRef.current = null;
        return;
      }
      const dx = e.changedTouches[0].clientX - taskStartXRef.current;
      const velocity = dx / (Date.now() - taskStartTimeRef.current);
      setTaskIsDragging(false);
      setTaskDragX(0);
      taskDirRef.current = null;
      if (Math.abs(dx) > 80 || (Math.abs(dx) > 30 && Math.abs(velocity) > 0.3)) {
        if (dx < 0) {
          setMobileTab(prev => Math.min(prev + 1, COLUMNS.length - 1));
        } else {
          setMobileTab(prev => Math.max(prev - 1, 0));
        }
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState('backlog');
  const [formAssignee, setFormAssignee] = useState('');
  const [formProject, setFormProject] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data: Task[] = await res.json();
        return data;
      }
    } catch { /* ignore */ }
    return [];
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data);
      }
    } catch { /* ignore */ }
  }, []);

  const seedTasks = useCallback(async () => {
    for (const t of SEED_TASKS) {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      });
    }
    await fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: 'system', action: 'Initialization: demo tasks created', type: 'system' }),
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchProjects();
      const data = await fetchTasks();
      if (data.length === 0 && !seededRef.current) {
        seededRef.current = true;
        await seedTasks();
        const seeded = await fetchTasks();
        setTasks(seeded);
      } else {
        setTasks(data);
      }
      setReferenceTime(Date.now());
    };
    init();

    // Auto-refresh задач каждые 10 сек
    const interval = setInterval(async () => {
      const refreshed = await fetchTasks();
      setTasks(refreshed);
      setReferenceTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchTasks, fetchProjects, seedTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated: Task = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));

        const statusLabel = COLUMNS.find(c => c.key === newStatus)?.label || newStatus;
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: task.assignee || 'system',
            action: `${task.title} → ${statusLabel}`,
            type: 'task_move',
          }),
        });
      }
    } catch { /* ignore */ }
  };

  const handleCreateTask = async () => {
    if (!formTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          status: formStatus,
          assignee: formAssignee || null,
          project_id: formProject || null,
        }),
      });
      if (res.ok) {
        const newTask: Task = await res.json();
        setTasks(prev => [...prev, newTask]);
        setShowModal(false);
        setFormTitle('');
        setFormDesc('');
        setFormStatus('backlog');
        setFormAssignee('');
        setFormProject('');

        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: formAssignee || 'system',
            action: `Created task: ${formTitle}`,
            type: 'task_create',
          }),
        });
      }
    } catch { /* ignore */ }
  };

  const handlePing = async () => {
    if (!pingTask) return;
    setPingSending(true);
    try {
      const res = await fetch('/api/tasks/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: pingTask.id, message: pingMessage }),
      });
      if (res.ok) {
        setPingTask(null);
        setPingMessage('');
      }
    } catch { /* ignore */ }
    setPingSending(false);
  };

  const openAddModal = (status: string) => {
    setFormStatus(status);
    setShowModal(true);
  };

  // Filtered + sorted tasks
  const filtered = tasks.filter(t => {
    if (filterAgent && t.assignee !== filterAgent) return false;
    if (filterProject && t.project_id !== filterProject) return false;
    return true;
  }).sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? tb - ta : ta - tb;
  });

  // Stats
  const weekAgo = referenceTime === null ? null : referenceTime - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = weekAgo === null ? 0 : filtered.filter(t => new Date(t.created_at).getTime() > weekAgo).length;
  const inProgress = filtered.filter(t => t.status === 'in_progress').length;
  const total = filtered.length;
  const done = filtered.filter(t => t.status === 'done').length;
  const donePercent = total > 0 ? Math.round((done / total) * 100) : 0;

  const stats = [
    { label: 'this week', value: thisWeek },
    { label: 'in progress', value: inProgress },
    { label: 'total', value: total },
    { label: 'done', value: `${donePercent}%` },
  ];

  return (
    <div className="flex gap-4 h-full overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* Main content — 80% */}
      <div className="flex-1 min-w-0 overflow-y-auto md:overflow-hidden" style={{ flex: '4 1 0' }}>
        {/* Top bar: button + filters */}
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:flex-wrap">
          <div className="flex items-center gap-2">
            <button
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              onClick={() => openAddModal('backlog')}
            >
              + New task
            </button>

            <button
              className="text-xs text-red-400/50 hover:text-red-400 px-3 py-2 rounded-lg transition-colors border border-red-400/20 hover:border-red-400/40 whitespace-nowrap"
              onClick={async () => {
                const doneCount = tasks.filter(t => t.status === 'done').length
                if (!doneCount) return
                if (!confirm(`Очистить ${doneCount} завершённых задач?`)) return
                const doneTasks = tasks.filter(t => t.status === 'done')
                for (const t of doneTasks) {
                  await fetch(`/api/tasks/${t.id}`, { method: 'DELETE' })
                }
                setTasks(prev => prev.filter(t => t.status !== 'done'))
              }}
            >
              🗑 Clear done
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              className={`text-xs px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                !filterAgent ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              onClick={() => setFilterAgent(null)}
            >
              All
            </button>
            {TASK_ASSIGNEE_OPTIONS.map(agent => (
              <button
                key={agent.id}
                className={`text-xs px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                  filterAgent === agent.id ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                onClick={() => setFilterAgent(filterAgent === agent.id ? null : agent.id)}
              >
                {agent.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Project dropdown */}
            <select
              value={filterProject || ''}
              onChange={e => setFilterProject(e.target.value || null)}
              className="text-xs bg-white/5 text-gray-300 border border-white/10 rounded-lg px-3 py-1.5 outline-none flex-1 md:flex-none"
            >
              <option value="">All проекты</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button
              className="text-xs bg-white/5 text-gray-300 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors whitespace-nowrap"
              onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
            >
              {sortOrder === 'newest' ? '🕐 Newest' : '🕐 Oldest'}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-lg px-4 py-3 text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mobile: single-column kanban with swipe */}
        <div
          ref={taskSwipeRef}
          data-swipe-zone="content"
          className="md:hidden pb-4 overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex overflow-x-auto gap-1 mb-4 pb-1">
            {COLUMNS.map((col, idx) => {
              const count = filtered.filter(t => t.status === col.key).length;
              return (
                <button
                  key={col.key}
                  className={`text-xs px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                    mobileTab === idx
                      ? 'text-white font-semibold'
                      : 'bg-white/5 text-gray-400'
                  }`}
                  style={mobileTab === idx ? { backgroundColor: col.color + '30', color: col.color } : undefined}
                  onClick={() => setMobileTab(idx)}
                >
                  {col.emoji} {col.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Cards for active column */}
          <div className="space-y-2" style={{
            transform: `translateX(${taskDragX}px)`,
            transition: taskIsDragging ? 'none' : 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}>
            {(() => {
              const col = COLUMNS[mobileTab];
              const colTasks = filtered.filter(t => t.status === col.key);
              if (colTasks.length === 0) return (
                <div className="text-center text-sm text-gray-500 py-8">No tasks</div>
              );
              return colTasks.map(task => {
                const project = projects.find(p => p.id === task.project_id);
                return (
                  <div
                    key={task.id}
                    className="rounded-lg p-3 cursor-pointer active:bg-white/10"
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onClick={() => setDetailTask(task)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-white font-medium leading-tight flex-1">{task.title}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                        style={{ backgroundColor: col.color + '20', color: col.color }}
                      >
                        {col.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {task.assignee && (
                        <span className="text-xs text-gray-400">{AGENT_NAMES[normalizeAgentId(task.assignee)] || task.assignee}</span>
                      )}
                      {project && (
                        <span className="text-xs text-gray-500">{project.name}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        {task.status !== 'done' && (
                          <button
                            className="text-xs text-gray-400 hover:text-white bg-white/5 rounded min-h-[36px] px-3 py-1 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const idx = COLUMNS.findIndex(c => c.key === task.status);
                              if (idx < COLUMNS.length - 1) handleStatusChange(task.id, COLUMNS[idx + 1].key);
                            }}
                          >
                            → {COLUMNS[COLUMNS.findIndex(c => c.key === task.status) + 1]?.label}
                          </button>
                        )}
                      </div>
                      {task.assignee && (
                        <button
                          className="text-xs text-gray-500 hover:text-yellow-400 transition-colors min-h-[36px] px-3 py-1"
                          onClick={(e) => { e.stopPropagation(); setPingTask(task); }}
                        >
                          📣
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Desktop: Kanban board */}
        <div className="hidden md:flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              config={col}
              tasks={filtered.filter(t => t.status === col.key)}
              projects={projects}
              onStatusChange={handleStatusChange}
              onTaskClick={setDetailTask}
              onAddTask={openAddModal}
              onPingClick={setPingTask}
            />
          ))}
        </div>
      </div>

      {/* Activity feed — 20% */}
      <div className="hidden lg:flex flex-col" style={{ flex: '1 1 0', minWidth: '240px', maxWidth: '320px', maxHeight: 'calc(100vh - 120px)' }}>
        <ActivityFeed />
      </div>

      {/* Create task modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div
            className="rounded-xl p-6 w-full max-w-md"
            style={{ backgroundColor: 'rgb(26, 26, 46)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">New task</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title *"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
                autoFocus
              />

              <textarea
                placeholder="Description"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 resize-none"
                rows={3}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-300 outline-none"
                >
                  {COLUMNS.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>

                <select
                  value={formAssignee}
                  onChange={e => setFormAssignee(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-300 outline-none"
                >
                  <option value="">Assign</option>
                  {TASK_ASSIGNEE_OPTIONS.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.label}</option>
                  ))}
                </select>

                <select
                  value={formProject}
                  onChange={e => setFormProject(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-300 outline-none"
                >
                  <option value="">Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                onClick={handleCreateTask}
                disabled={!formTitle.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ping modal */}
      {pingTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setPingTask(null); setPingMessage(''); }}>
          <div
            className="rounded-xl p-6 w-full max-w-sm"
            style={{ backgroundColor: 'rgb(26, 26, 46)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-3">📣 Task ping</h3>

            <div className="space-y-3 mb-4">
              <div>
                <span className="text-xs text-gray-500">Task</span>
                <p className="text-sm text-white">{pingTask.title}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Assignee</span>
                <p className="text-sm text-white">{pingTask.assignee ? (AGENT_NAMES[normalizeAgentId(pingTask.assignee)] || pingTask.assignee) : 'Не назначен'}</p>
              </div>
              <textarea
                placeholder="Comment (optional)"
                value={pingMessage}
                onChange={e => setPingMessage(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-yellow-500 resize-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
                onClick={() => { setPingTask(null); setPingMessage(''); }}
              >
                Cancel
              </button>
              <button
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                onClick={handlePing}
                disabled={pingSending}
              >
                {pingSending ? 'Sending...' : 'Send ping'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task detail modal */}
      {detailTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setDetailTask(null)}>
          <div
            className="rounded-xl p-6 w-full max-w-lg"
            style={{ backgroundColor: 'rgb(26, 26, 46)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">{detailTask.title}</h3>
            {detailTask.description && (
              <p className="text-sm text-gray-400 mb-4">{detailTask.description}</p>
            )}

            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
              {detailTask.assignee && getAgentAvatarId(detailTask.assignee) && (
                <img src={`/avatars/${getAgentAvatarId(detailTask.assignee)}.jpg`} alt="" className="w-5 h-5 rounded-full object-cover" />
              )}
              <span>Assignee: {detailTask.assignee ? AGENT_NAMES[normalizeAgentId(detailTask.assignee)] || detailTask.assignee : 'unassigned'}</span>
              <span>·</span>
              <span>Project: {projects.find(p => p.id === detailTask.project_id)?.name || 'none'}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {COLUMNS.map(col => (
                <button
                  key={col.key}
                  className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                    detailTask.status === col.key
                      ? 'text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  style={detailTask.status === col.key ? { backgroundColor: col.color } : undefined}
                  onClick={async () => {
                    if (detailTask.status !== col.key) {
                      await handleStatusChange(detailTask.id, col.key);
                      setDetailTask(prev => prev ? { ...prev, status: col.key } : null);
                    }
                  }}
                >
                  {col.emoji} {col.label}
                </button>
              ))}
            </div>

            {/* Результат */}
            {detailTask.status === 'done' && detailTask.result ? (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <div className="text-xs text-green-400 font-medium mb-1">📋 Result</div>
                <p className="text-sm text-green-200">{detailTask.result}</p>
              </div>
            ) : detailTask.status === 'done' ? (
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs text-gray-500">No result provided</p>
              </div>
            ) : null}

            <div className="flex justify-between">
              <button
                className="text-sm text-red-400/60 hover:text-red-400 px-4 py-2 transition-colors"
                onClick={async () => {
                  if (!confirm(`Удалить задачу "${detailTask.title}"?`)) return
                  await fetch(`/api/tasks/${detailTask.id}`, { method: 'DELETE' })
                  setTasks(prev => prev.filter(t => t.id !== detailTask.id))
                  setDetailTask(null)
                }}
              >
                🗑 Удалить
              </button>
              <button
                className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
                onClick={() => setDetailTask(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
