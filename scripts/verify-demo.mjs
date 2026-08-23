import assert from 'node:assert/strict'
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
let dataDir
let app
let server

async function request(url, init) {
  const response = await fetch(url, init)
  const body = await response.json()
  return { response, body }
}

try {
  dataDir = await mkdtemp(path.join(os.tmpdir(), 'mission-control-lite-'))
  for (const file of ['tasks.json', 'projects.json', 'activity.jsonl']) {
    await copyFile(path.join(root, 'data', file), path.join(dataDir, file))
  }

  process.env.MISSION_CONTROL_DATA_DIR = dataDir
  process.env.NEXT_TELEMETRY_DISABLED = '1'
  const next = (await import('next')).default
  app = next({ dev: false, dir: root, hostname: '127.0.0.1', port: 0 })
  await app.prepare()
  const handler = app.getRequestHandler()
  server = http.createServer((request, response) => {
    handler(request, response).catch((error) => {
      response.statusCode = 500
      response.end('Synthetic server error')
      console.error(error)
    })
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  assert(address && typeof address === 'object')
  const port = address.port
  const baseUrl = `http://127.0.0.1:${port}`
  const initial = await request(`${baseUrl}/api/tasks`)
  assert.equal(initial.response.status, 200)
  const tasks = initial.body
  assert(Array.isArray(tasks), 'task API did not return an array')
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
  if (server) {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
  if (app) await app.close()
  if (dataDir) await rm(dataDir, { recursive: true, force: true })
}
