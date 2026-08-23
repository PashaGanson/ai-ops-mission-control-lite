import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const dataDir = await mkdtemp(path.join(os.tmpdir(), 'mission-control-lite-'))
const logs = []

async function reservePort() {
  const server = net.createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  assert(address && typeof address === 'object')
  const { port } = address
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

async function request(url, init) {
  const response = await fetch(url, init)
  const body = await response.json()
  return { response, body }
}

for (const file of ['tasks.json', 'projects.json', 'activity.jsonl']) {
  await copyFile(path.join(root, 'data', file), path.join(dataDir, file))
}

const port = await reservePort()
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
const child = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: root,
  env: {
    ...process.env,
    MISSION_CONTROL_DATA_DIR: dataDir,
    NEXT_TELEMETRY_DISABLED: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

child.stdout.on('data', (chunk) => logs.push(chunk.toString()))
child.stderr.on('data', (chunk) => logs.push(chunk.toString()))

try {
  const baseUrl = `http://127.0.0.1:${port}`
  let tasks
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const result = await request(`${baseUrl}/api/tasks`)
      if (result.response.ok) {
        tasks = result.body
        break
      }
    } catch {
      // The isolated server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  assert(Array.isArray(tasks), `server did not become ready\n${logs.join('')}`)
  assert(tasks.length > 0, 'sample task list is empty')

  const title = `Synthetic portability task ${process.pid}`
  const created = await request(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title, assignee: 'planner', status: 'backlog' }),
  })
  assert.equal(created.response.status, 201)
  assert.equal(created.body.title, title)

  const updated = await request(`${baseUrl}/api/tasks/${created.body.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'in_progress' }),
  })
  assert.equal(updated.response.status, 200)
  assert.equal(updated.body.status, 'in_progress')

  const ping = await request(`${baseUrl}/api/tasks/ping`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ taskId: created.body.id, message: 'synthetic local smoke' }),
  })
  assert.equal(ping.response.status, 200)
  assert.equal(ping.body.delivered, false)

  const removed = await request(`${baseUrl}/api/tasks/${created.body.id}`, { method: 'DELETE' })
  assert.equal(removed.response.status, 200)
  assert.equal(removed.body.ok, true)

  const activity = await request(`${baseUrl}/api/activity`)
  assert.equal(activity.response.status, 200)
  assert(activity.body.some((event) => event.type === 'task_ping'))

  const originalTasks = JSON.parse(await readFile(path.join(root, 'data', 'tasks.json'), 'utf8'))
  assert(!originalTasks.some((task) => task.title === title), 'smoke modified tracked sample data')
  console.log('Verified local task CRUD, no-delivery ping, activity readback, and isolated data writes.')
} finally {
  child.kill()
  await new Promise((resolve) => {
    if (child.exitCode !== null) return resolve()
    child.once('exit', resolve)
    setTimeout(resolve, 5_000).unref()
  })
  await rm(dataDir, { recursive: true, force: true })
}
