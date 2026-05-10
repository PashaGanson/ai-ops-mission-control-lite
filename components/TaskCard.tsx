/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  result?: string | null;
}

interface Project {
  id: string;
  name: string;
}

const STATUS_ORDER = ['backlog', 'in_progress', 'review', 'done'];

const STATUS_COLORS: Record<string, string> = {
  backlog: '#6b7280',
  in_progress: '#eab308',
  review: '#f97316',
  done: '#22c55e',
};

const PROJECT_COLORS: Record<string, string> = {
  '1': '#6366f1',
  '2': '#ec4899',
  '3': '#f59e0b',
  '4': '#06b6d4',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface TaskCardProps {
  task: Task;
  projects: Project[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
  onPingClick?: (task: Task) => void;
}

export default function TaskCard({ task, projects, onStatusChange, onTaskClick, onPingClick }: TaskCardProps) {
  const [hovered, setHovered] = useState(false);
  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const canMoveLeft = currentIdx > 0;
  const canMoveRight = currentIdx < STATUS_ORDER.length - 1;

  const statusColor = STATUS_COLORS[task.status] || '#6b7280';

  const project = projects.find(p => p.id === task.project_id);
  const projectColor = task.project_id ? (PROJECT_COLORS[task.project_id] || '#6b7280') : null;

  const truncatedTitle = task.title.length > 60 ? task.title.slice(0, 57) + '...' : task.title;

  return (
    <div
      className="rounded-lg p-3 mb-2 cursor-pointer transition-all"
      style={{
        backgroundColor: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onTaskClick(task)}
    >
      {/* Title with status dot */}
      <div className="flex items-start gap-2 mb-1">
        <span
          className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
        />
        <span className="text-sm text-white font-medium leading-tight">{truncatedTitle}</span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2 ml-4">{task.description}</p>
      )}

      {/* Divider */}
      <div className="border-t border-white/10 mt-2 pt-2 ml-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            {task.assignee ? (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-indigo-500">
                {task.assignee.slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gray-500">
                ?
              </div>
            )}

            {/* Project badge */}
            {project && projectColor && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: projectColor + '20',
                  color: projectColor,
                }}
              >
                {project.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">{timeAgo(task.updated_at)}</span>
            {onPingClick && task.assignee && (
              <button
                className="text-[10px] text-gray-500 hover:text-yellow-400 transition-colors"
                title="Ping assignee"
                onClick={(e) => {
                  e.stopPropagation();
                  onPingClick(task);
                }}
              >
                📣
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Move buttons on hover */}
      {hovered && (
        <div className="flex items-center justify-end gap-1 mt-2">
          {canMoveLeft && (
            <button
              className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded px-2 py-0.5 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, STATUS_ORDER[currentIdx - 1]);
              }}
            >
              ←
            </button>
          )}
          {canMoveRight && (
            <button
              className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded px-2 py-0.5 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, STATUS_ORDER[currentIdx + 1]);
              }}
            >
              →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
