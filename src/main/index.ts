import { join } from 'path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, Menu, nativeImage, shell, Tray } from 'electron'
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

/** システムトレイインスタンス */
let tray: Tray | null = null
/** メインウィンドウインスタンス */
let mainWindow: BrowserWindow | null = null
/** アプリを完全に終了するかどうか（トレイから終了時にtrue） */
let isQuitting = false

configureObservability({ logLevel: 'info' })
setupProcessErrorHandlers()

logEvent({
  level: 'info',
  message: 'app:boot',
  traceId: createTraceId()
})

function createWindow(): void {
  mainWindow = new BrowserWindow({
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
    mainWindow?.show()
  })

  // ウィンドウを閉じようとした時、トレイに最小化する（完全終了フラグがfalseの場合）
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
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

/**
 * システムトレイを作成
 */
function createTray(): void {
  // 開発環境ではアイコンがない場合があるため、アイコンなしでも動作するようにする
  // 本番環境では適切なアイコンを設定する
  try {
    // 16x16のシンプルなアイコンを作成（オレンジ色の四角）
    const iconDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAM0lEQVQ4T2NkYGD4z0ABYBw1YDQMGBgYGP6TYwA+lzOQawA+/aMGjIYBIwMDA/l+GAoAAHCWBBF0M5WeAAAAAElFTkSuQmCC'
    const icon = nativeImage.createFromDataURL(iconDataUrl)

    tray = new Tray(icon)
    tray.setToolTip('povo プロモコード管理')

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'ウィンドウを表示',
        click: () => {
          mainWindow?.show()
          mainWindow?.focus()
        }
      },
      { type: 'separator' },
      {
        label: '終了',
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])

    tray.setContextMenu(contextMenu)

    // トレイアイコンをダブルクリックでウィンドウを表示
    tray.on('double-click', () => {
      mainWindow?.show()
      mainWindow?.focus()
    })

    logEvent({
      level: 'info',
      message: 'tray:created',
      traceId: createTraceId()
    })
  } catch (error) {
    logEvent({
      level: 'warn',
      message: 'tray:create:failed',
      traceId: createTraceId(),
      context: { error: error instanceof Error ? error.message : String(error) }
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

  // システムトレイを作成
  createTray()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// before-quitイベントで終了フラグを立てる
app.on('before-quit', () => {
  isQuitting = true
})

// Quit when all windows are closed, except on macOS
// ただし、トレイに常駐している間は終了しない
app.on('window-all-closed', () => {
  // トレイに常駐しているため、ウィンドウが閉じられても終了しない
  // 終了はトレイメニューから行う
  if (process.platform === 'darwin') {
    // macOSでは通常の挙動（ウィンドウを閉じてもアプリは終了しない）
  }
  // Windowsではトレイに常駐するため、ここでは何もしない
})

// アプリ終了時に通知スケジューラーを停止、トレイを破棄
app.on('will-quit', () => {
  stopNotificationScheduler()
  if (tray !== null) {
    tray.destroy()
    tray = null
  }
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
