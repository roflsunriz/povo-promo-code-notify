/**
 * アプリ自動更新モジュール
 * electron-updater を使った差分アップデートを管理する
 */

import { is } from '@electron-toolkit/utils'
import { IPC_CHANNELS } from '@types/ipc'
import { autoUpdater } from 'electron-updater'
import { createTraceId, logEvent } from './observability'
import type { CheckForUpdatesResponse, DownloadProgressInfo, UpdaterEvent } from '@types/ipc'
import type { BrowserWindow } from 'electron'

let targetWindow: BrowserWindow | null = null

function sendUpdaterEvent(event: UpdaterEvent): void {
  targetWindow?.webContents.send(IPC_CHANNELS.UPDATER_EVENT, event)
}

function sendDownloadProgress(progress: DownloadProgressInfo): void {
  targetWindow?.webContents.send(IPC_CHANNELS.UPDATER_PROGRESS, progress)
}

/**
 * アップデーターを初期化
 * mainWindow 生成後に1回だけ呼ぶ
 */
export function initUpdater(win: BrowserWindow): void {
  targetWindow = win

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    logEvent({ level: 'info', message: 'updater:checking', traceId: createTraceId() })
    sendUpdaterEvent({ status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    logEvent({
      level: 'info',
      message: 'updater:available',
      traceId: createTraceId(),
      context: { version: info.version }
    })
    const notes =
      typeof info.releaseNotes === 'string'
        ? info.releaseNotes
        : Array.isArray(info.releaseNotes)
          ? info.releaseNotes.map((n) => n.note).join('\n')
          : undefined
    sendUpdaterEvent({ status: 'available', version: info.version, releaseNotes: notes })
  })

  autoUpdater.on('update-not-available', () => {
    logEvent({ level: 'info', message: 'updater:not-available', traceId: createTraceId() })
    sendUpdaterEvent({ status: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress) => {
    sendDownloadProgress({
      bytesPerSecond: progress.bytesPerSecond,
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    })
    sendUpdaterEvent({ status: 'downloading' })
  })

  autoUpdater.on('update-downloaded', (info) => {
    logEvent({
      level: 'info',
      message: 'updater:downloaded',
      traceId: createTraceId(),
      context: { version: info.version }
    })
    sendUpdaterEvent({ status: 'downloaded', version: info.version })
  })

  autoUpdater.on('error', (err) => {
    logEvent({
      level: 'error',
      message: 'updater:error',
      traceId: createTraceId(),
      context: { error: err.message }
    })
    sendUpdaterEvent({ status: 'error', error: err.message })
  })
}

/**
 * 更新を確認する
 * 開発モードではスキップ
 */
export async function checkForUpdates(): Promise<CheckForUpdatesResponse> {
  if (is.dev) {
    return { updateAvailable: false, error: '開発モードでは更新確認を利用できません' }
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    if (result === null) {
      return { updateAvailable: false }
    }
    const currentVer = String(autoUpdater.currentVersion)
    const available = result.updateInfo.version !== currentVer
    return { updateAvailable: available, version: result.updateInfo.version }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { updateAvailable: false, error: msg }
  }
}

/**
 * 更新をダウンロードする
 */
export async function downloadUpdate(): Promise<{ success: boolean; error?: string }> {
  if (is.dev) {
    return { success: false, error: '開発モードではダウンロードを利用できません' }
  }
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, error: msg }
  }
}

/**
 * アプリを再起動して更新をインストールする
 */
export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
