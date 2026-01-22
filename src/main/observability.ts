/**
 * 監視・ログ収集（構造化ログ + 相関ID）
 */

import { randomUUID } from 'crypto'
import { mkdir, appendFile } from 'fs/promises'
import { dirname, join } from 'path'
import { app } from 'electron'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEvent {
  timestamp: string
  level: LogLevel
  message: string
  traceId: string
  context?: Record<string, unknown>
}

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

let currentLogLevel: LogLevel = 'info'

export function configureObservability(options: { logLevel?: LogLevel }): void {
  if (options.logLevel) {
    currentLogLevel = options.logLevel
  }
}

export function createTraceId(): string {
  return randomUUID()
}

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[currentLogLevel]
}

function getLogFilePath(): string {
  const baseDir = app.isReady() ? app.getPath('userData') : process.cwd()
  return join(baseDir, 'logs', 'app.log')
}

async function writeLogLine(line: string): Promise<void> {
  const logPath = getLogFilePath()
  const logDir = dirname(logPath)
  await mkdir(logDir, { recursive: true })
  await appendFile(logPath, `${line}\n`, 'utf-8')
}

export function logEvent(event: Omit<LogEvent, 'timestamp'>): void {
  if (!shouldLog(event.level)) {
    return
  }

  const payload: LogEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  }

  const line = JSON.stringify(payload)

  if (event.level === 'error') {
    console.error(line)
  } else if (event.level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }

  void writeLogLine(line)
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return { message: String(error) }
}

export function setupProcessErrorHandlers(): void {
  process.on('uncaughtException', (error) => {
    logEvent({
      level: 'error',
      message: 'uncaughtException',
      traceId: createTraceId(),
      context: { error: serializeError(error) },
    })
  })

  process.on('unhandledRejection', (reason) => {
    logEvent({
      level: 'error',
      message: 'unhandledRejection',
      traceId: createTraceId(),
      context: { error: serializeError(reason) },
    })
  })
}

export async function withTrace<T>(
  name: string,
  handler: (traceId: string) => T | Promise<T>
): Promise<T> {
  const traceId = createTraceId()
  logEvent({ level: 'info', message: `${name}:start`, traceId })
  try {
    const result = await handler(traceId)
    logEvent({ level: 'info', message: `${name}:success`, traceId })
    return result
  } catch (error) {
    logEvent({
      level: 'error',
      message: `${name}:error`,
      traceId,
      context: { error: serializeError(error) },
    })
    throw error
  }
}
