import { appendFileSync, mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

const LOG_FILE = join(import.meta.dirname, '../../logs/debug.log')

function ensureLogFile() {
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true })
  } catch {}
}

export function clearLog() {
  ensureLogFile()
  writeFileSync(LOG_FILE, '')
}

export function log(label: string, data: any) {
  ensureLogFile()
  const line = `[${label}] ${JSON.stringify(data)}\n`
  appendFileSync(LOG_FILE, line)
}
