export interface AgentOption { id: string; label: string }
export const WORKSPACE_AGENT_OPTIONS: AgentOption[] = [
  { id: 'operator', label: 'Operator' },
  { id: 'reporting-agent', label: 'Reporting Agent' },
  { id: 'data-agent', label: 'Data Agent' },
  { id: 'content-agent', label: 'Content Agent' },
]
export const TASK_ASSIGNEE_OPTIONS: AgentOption[] = WORKSPACE_AGENT_OPTIONS
export const AGENT_NAMES: Record<string, string> = {
  operator: 'Operator',
  system: 'System',
  'reporting-agent': 'Reporting Agent',
  'data-agent': 'Data Agent',
  'content-agent': 'Content Agent',
}
export const AGENT_COLORS: Record<string, string> = {
  operator: '#6366f1', system: '#6b7280', 'reporting-agent': '#60a5fa', 'data-agent': '#22c55e', 'content-agent': '#f59e0b',
}
export const AGENT_THREADS: Record<string, string> = {}
export function normalizeAgentId(agentId: string | null | undefined): string { return agentId || '' }
export function getAgentName(agentId: string | null | undefined): string { const id=normalizeAgentId(agentId); return AGENT_NAMES[id] ?? id }
export function getAgentColor(agentId: string | null | undefined): string { const id=normalizeAgentId(agentId); return AGENT_COLORS[id] ?? '#6b7280' }
export function getAgentAvatarId(_agentId?: string | null): string | null { void _agentId; return null }
