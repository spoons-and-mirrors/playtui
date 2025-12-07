import { appendFileSync, writeFileSync } from "fs"

const LOG_FILE = "/home/lefrog/code/playtui/logs/debug.log"

export function clearLog() {
  writeFileSync(LOG_FILE, "")
}

export function log(label: string, data: any) {
  const line = `[${label}] ${JSON.stringify(data)}\n`
  appendFileSync(LOG_FILE, line)
}
