# OpenClaw Mission Control Lite

A sanitized public version of a real OpenClaw Mission Control dashboard.

The private version is used as an operator dashboard for coordinating AI-assisted workflows: tasks, project context, agent ownership, status changes, activity feed, and human approval checkpoints.

This repository keeps the real Next.js UI structure and local JSON workflow, but removes private production data, credentials, internal memory, Telegram routing, and live OpenClaw gateway calls.

## Screenshot

![Mission Control dashboard](docs/assets/dashboard.png)

## What remains from the real project

- Next.js app structure
- Kanban task board
- project filters
- assignee filters
- local task/project APIs
- activity feed
- task claim/complete endpoints
- ping flow, rewritten to log locally instead of messaging real agents
- sample data shaped like the production app expects

## What was removed or replaced

- production task data
- private agent names and avatars
- Telegram/Gateway calls
- token/system routes
- memory/docs/system pages
- `.env.local`, `.next`, `node_modules`, build artifacts
- hardcoded production host paths

## Quick start

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3000/tasks
```

The app reads sample JSON from `data/` by default.

To use your own folder:

```bash
MISSION_CONTROL_DATA_DIR=/path/to/your/data npm run dev
```

Expected files:

```text
data/tasks.json
data/projects.json
data/activity.jsonl
```

## Why this exists

AI agent workflows become messy fast. A chat transcript is not enough to manage real operations.

Mission Control is the operating layer:

- what is being worked on
- who owns it
- what is blocked
- what needs human approval
- what changed recently

This lite version is intentionally local-first and safe to inspect.

## License

MIT
