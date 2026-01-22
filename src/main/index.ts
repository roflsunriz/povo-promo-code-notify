import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, shell } from 'electron'
import { registerIpcHandlers } from './ipc-handlers'
import {
  configureObservability,
  createTraceId,
  logEvent,
  setupProcessErrorHandlers
} from './observability'
import {
  getAllCodes,
  getNotificationSettings,
  startNotificationScheduler,
  stopNotificationScheduler
} from './services'

configureObservability({ logLevel: 'info' })
setupProcessErrorHandlers()

logEvent({
  level: 'info',
  message: 'app:boot',
  traceId: createTraceId()
})

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'povo プロモコード管理',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url).catch((error) => {
      logEvent({
        level: 'error',
        message: 'window:openExternal:failed',
        traceId: createTraceId(),
        context: { error: error instanceof Error ? error.message : String(error) }
      })
    })
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite CLI
  // Load the remote URL for development or the local html file for production
  if (is.dev && process.env['ELECTRON_RENDERER_URL'] !== undefined) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).catch((error) => {
      logEvent({
        level: 'error',
        message: 'window:loadURL:failed',
        traceId: createTraceId(),
        context: { error: error instanceof Error ? error.message : String(error) }
      })
    })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')).catch((error) => {
      logEvent({
        level: 'error',
        message: 'window:loadFile:failed',
        traceId: createTraceId(),
        context: { error: error instanceof Error ? error.message : String(error) }
      })
    })
  }
}

// This method will be called when Electron has finished initialization
void app.whenReady().then(() => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.povo-promo-code-notify')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPCハンドラーを登録
  registerIpcHandlers()

  // 通知スケジューラーを初期化
  initNotificationScheduler()

  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// アプリ終了時に通知スケジューラーを停止
app.on('will-quit', () => {
  stopNotificationScheduler()
})

/**
 * 通知スケジューラーを初期化
 */
function initNotificationScheduler(): void {
  try {
    const codes = getAllCodes()
    const settings = getNotificationSettings()
    startNotificationScheduler(codes, settings)
  } catch (error) {
    logEvent({
      level: 'error',
      message: 'scheduler:init:failed',
      traceId: createTraceId(),
      context: { error: error instanceof Error ? error.message : String(error) }
    })
  }
}
