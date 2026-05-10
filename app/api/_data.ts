import fs from 'fs'
import path from 'path'
export const DATA_DIR = process.env.MISSION_CONTROL_DATA_DIR || path.join(process.cwd(), 'data')
export const TASKS_FILE = path.join(DATA_DIR, 'tasks.json')
export const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json')
export const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.jsonl')
export function ensureDataDir() { fs.mkdirSync(DATA_DIR, { recursive: true }) }
export function readJsonFile<T>(file: string, fallback: T): T { try { if (!fs.existsSync(file)) return fallback; return JSON.parse(fs.readFileSync(file, 'utf-8')) || fallback } catch { return fallback } }
export function writeJsonFile(file: string, value: unknown) { ensureDataDir(); fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8') }
export function appendActivity(event: Record<string, unknown>) { ensureDataDir(); const payload={ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), timestamp: new Date().toISOString(), ...event }; fs.appendFileSync(ACTIVITY_FILE, JSON.stringify(payload)+'\n') }
export function readActivity(): Record<string, unknown>[] { try { if (!fs.existsSync(ACTIVITY_FILE)) return []; return fs.readFileSync(ACTIVITY_FILE,'utf-8').split('\n').filter(Boolean).map((line)=>JSON.parse(line)) } catch { return [] } }
