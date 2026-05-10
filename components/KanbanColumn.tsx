'use client';

import TaskCard, { Task } from './TaskCard';

interface Project {
  id: string;
  name: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

interface KanbanColumnProps {
  config: ColumnConfig;
  tasks: Task[];
  projects: Project[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: string) => void;
  onPingClick?: (task: Task) => void;
}

export default function KanbanColumn({
  config,
  tasks,
  projects,
  onStatusChange,
  onTaskClick,
  onAddTask,
  onPingClick,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[220px] flex-1">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-sm font-semibold text-white">
            {config.emoji} {config.label}
          </span>
          <span className="text-xs text-gray-500 bg-white/5 rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </div>
        <button
          className="text-gray-400 hover:text-white text-lg leading-none transition-colors"
          onClick={() => onAddTask(config.key)}
          title="Add task"
        >
          +
        </button>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto pr-1 relative" style={{ maxHeight: 'calc(100vh - 300px)', maskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)' }}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            projects={projects}
            onStatusChange={onStatusChange}
            onTaskClick={onTaskClick}
            onPingClick={onPingClick}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-gray-600 text-xs py-8">Empty</div>
        )}
      </div>
    </div>
  );
}
