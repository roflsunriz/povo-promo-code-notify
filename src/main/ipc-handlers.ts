/**
 * IPCハンドラー
 * main-renderer間の通信処理
 */

import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { IPC_CHANNELS } from '@types/ipc'
import { app, dialog, ipcMain, Notification } from 'electron'
import {
  getAllCodes,
  createCode,
  createCodes,
  deleteCode,
  startCode,
  cancelCode,
  editStartedAt,
  updateOrders,
  getNotificationSettings,
  updateNotificationSettings,
  exportData,
  createBackup,
  importData,
  attachStatusToAll,
  calculateCoverage,
  getNextCandidate,
  getActiveCodes,
  getUnusedCodes,
  parseEmailForRegistration,
  updateNotificationSchedulerCodes,
  updateNotificationSchedulerSettings,
} from './services'
import type { CodeStatus, PromoCodeWithStatus } from '@types/code'
import type {
  CancelCodeRequest,
  CancelCodeResponse,
  CodeFilter,
  CodeSort,
  CreateCodeRequest,
  CreateCodeResponse,
  CreateCodesRequest,
  CreateCodesResponse,
  CreateBackupResponse,
  DashboardData,
  DeleteCodeRequest,
  DeleteCodeResponse,
  EditStartedAtRequest,
  EditStartedAtResponse,
  ExportDataResponse,
  ExportToFileResponse,
  GetAllCodesResponse,
  GetCoverageResponse,
  GetDashboardResponse,
  GetFilteredCodesRequest,
  GetFilteredCodesResponse,
  GetNextCandidateResponse,
  GetNotificationSettingsResponse,
  ImportDataRequest,
  ImportDataResponse,
  ImportFromFileResponse,
  ParseEmailRequest,
  ParseEmailResponse,
  StartCodeRequest,
  StartCodeResponse,
  UpdateNotificationSettingsRequest,
  UpdateNotificationSettingsResponse,
  UpdateOrdersRequest,
  UpdateOrdersResponse,
} from '@types/ipc'

/**
 * すべてのIPCハンドラーを登録
 */
export function registerIpcHandlers(): void {
  // コード操作
  registerGetAllCodes()
  registerCreateCode()
  registerCreateCodes()
  registerDeleteCode()
  registerUpdateOrders()

  // 使用開始・取り消し
  registerStartCode()
  registerCancelCode()
  registerEditStartedAt()

  // カバレッジ・候補
  registerGetCoverage()
  registerGetNextCandidate()

  // ダッシュボード
  registerGetDashboard()

  // フィルター付き取得
  registerGetFilteredCodes()

  // 通知設定
  registerGetNotificationSettings()
  registerUpdateNotificationSettings()

  // エクスポート/インポート
  registerExportData()
  registerImportData()
  registerCreateBackup()
  registerExportToFile()
  registerImportFromFile()

  // メール解析
  registerParseEmail()

  // テスト通知
  registerSendTestNotification()
}

// ==================== コード操作 ====================

function registerGetAllCodes(): void {
  ipcMain.handle(IPC_CHANNELS.GET_ALL_CODES, (): GetAllCodesResponse => {
    const codes = getAllCodes()
    const codesWithStatus = attachStatusToAll(codes)
    return { codes: codesWithStatus }
  })
}

function registerCreateCode(): void {
  ipcMain.handle(
    IPC_CHANNELS.CREATE_CODE,
    (_event, request: CreateCodeRequest): CreateCodeResponse => {
      const code = createCode(request.input)
      // 通知スケジューラーを更新
      updateNotificationSchedulerCodes(getAllCodes())
      return { code }
    }
  )
}

function registerCreateCodes(): void {
  ipcMain.handle(
    IPC_CHANNELS.CREATE_CODES,
    (_event, request: CreateCodesRequest): CreateCodesResponse => {
      const codes = createCodes(request.inputs)
      // 通知スケジューラーを更新
      updateNotificationSchedulerCodes(getAllCodes())
      return { codes }
    }
  )
}

function registerDeleteCode(): void {
  ipcMain.handle(
    IPC_CHANNELS.DELETE_CODE,
    (_event, request: DeleteCodeRequest): DeleteCodeResponse => {
      const success = deleteCode(request.id)
      // 通知スケジューラーを更新
      updateNotificationSchedulerCodes(getAllCodes())
      return { success }
    }
  )
}

function registerUpdateOrders(): void {
  ipcMain.handle(
    IPC_CHANNELS.UPDATE_ORDERS,
    (_event, request: UpdateOrdersRequest): UpdateOrdersResponse => {
      updateOrders(request.orders)
      return { success: true }
    }
  )
}

// ==================== 使用開始・取り消し ====================

function registerStartCode(): void {
  ipcMain.handle(
    IPC_CHANNELS.START_CODE,
    (_event, request: StartCodeRequest): StartCodeResponse => {
      const startedAt = request.startedAt ? new Date(request.startedAt) : undefined
      const code = startCode(request.id, startedAt)
      // 通知スケジューラーを更新
      updateNotificationSchedulerCodes(getAllCodes())
      return { code: code ?? null }
    }
  )
}

function registerCancelCode(): void {
  ipcMain.handle(
    IPC_CHANNELS.CANCEL_CODE,
    (_event, request: CancelCodeRequest): CancelCodeResponse => {
      const code = cancelCode(request.id)
      // 通知スケジューラーを更新
      updateNotificationSchedulerCodes(getAllCodes())
      return { code: code ?? null }
    }
  )
}

function registerEditStartedAt(): void {
  ipcMain.handle(
    IPC_CHANNELS.EDIT_STARTED_AT,
    (_event, request: EditStartedAtRequest): EditStartedAtResponse => {
      const code = editStartedAt(request.id, new Date(request.newStartedAt))
      // 通知スケジューラーを更新
      updateNotificationSchedulerCodes(getAllCodes())
      return { code: code ?? null }
    }
  )
}

// ==================== カバレッジ・候補 ====================

function registerGetCoverage(): void {
  ipcMain.handle(IPC_CHANNELS.GET_COVERAGE, (): GetCoverageResponse => {
    const codes = getAllCodes()
    const coverage = calculateCoverage(codes)
    return { coverage }
  })
}

function registerGetNextCandidate(): void {
  ipcMain.handle(IPC_CHANNELS.GET_NEXT_CANDIDATE, (): GetNextCandidateResponse => {
    const codes = getAllCodes()
    const result = getNextCandidate(codes)
    return { result }
  })
}

// ==================== ダッシュボード ====================

function registerGetDashboard(): void {
  ipcMain.handle(IPC_CHANNELS.GET_DASHBOARD, (): GetDashboardResponse => {
    const codes = getAllCodes()
    const now = new Date()

    const coverage = calculateCoverage(codes, now)
    const nextCandidate = getNextCandidate(codes, now)
    const activeCodes = getActiveCodes(codes, now)
    const unusedCodes = getUnusedCodes(codes, now)

    const data: DashboardData = {
      coverage,
      nextCandidate,
      activeCodes,
      unusedCount: unusedCodes.length,
      totalCount: codes.length,
    }

    return { data }
  })
}

// ==================== フィルター付き取得 ====================

function registerGetFilteredCodes(): void {
  ipcMain.handle(
    IPC_CHANNELS.GET_FILTERED_CODES,
    (_event, request: GetFilteredCodesRequest): GetFilteredCodesResponse => {
      const codes = getAllCodes()
      const now = new Date()
      let codesWithStatus = attachStatusToAll(codes, now)

      // フィルター適用
      if (request.filter) {
        codesWithStatus = applyFilter(codesWithStatus, request.filter, now)
      }

      // ソート適用
      if (request.sort) {
        codesWithStatus = applySort(codesWithStatus, request.sort)
      } else {
        // デフォルトは順序の昇順
        codesWithStatus = applySort(codesWithStatus, { key: 'order', direction: 'asc' })
      }

      return { codes: codesWithStatus }
    }
  )
}

function applyFilter(
  codes: PromoCodeWithStatus[],
  filter: CodeFilter,
  now: Date
): PromoCodeWithStatus[] {
  let result = codes

  // 状態フィルター
  if (filter.statuses && filter.statuses.length > 0) {
    const statuses = new Set<CodeStatus>(filter.statuses)
    result = result.filter((code) => statuses.has(code.status))
  }

  // 入力期限フィルター（○日以内）
  if (filter.inputDeadlineWithinDays !== undefined && filter.inputDeadlineWithinDays !== null) {
    const thresholdMs = filter.inputDeadlineWithinDays * 24 * 60 * 60 * 1000
    const threshold = now.getTime() + thresholdMs
    result = result.filter((code) => {
      const deadlineTime = new Date(code.inputDeadline).getTime()
      return deadlineTime <= threshold
    })
  }

  return result
}

function applySort(codes: PromoCodeWithStatus[], sort: CodeSort): PromoCodeWithStatus[] {
  const sorted = [...codes]
  const direction = sort.direction === 'asc' ? 1 : -1

  sorted.sort((a, b) => {
    switch (sort.key) {
      case 'order':
        return (a.order - b.order) * direction
      case 'inputDeadline':
        return (
          (new Date(a.inputDeadline).getTime() - new Date(b.inputDeadline).getTime()) * direction
        )
      case 'status': {
        const statusOrder: Record<CodeStatus, number> = {
          active: 0,
          unused: 1,
          consumed: 2,
          expired: 3,
        }
        return (statusOrder[a.status] - statusOrder[b.status]) * direction
      }
      case 'createdAt':
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
        )
      default:
        return 0
    }
  })

  return sorted
}

// ==================== 通知設定 ====================

function registerGetNotificationSettings(): void {
  ipcMain.handle(
    IPC_CHANNELS.GET_NOTIFICATION_SETTINGS,
    (): GetNotificationSettingsResponse => {
      const settings = getNotificationSettings()
      return { settings }
    }
  )
}

function registerUpdateNotificationSettings(): void {
  ipcMain.handle(
    IPC_CHANNELS.UPDATE_NOTIFICATION_SETTINGS,
    (_event, request: UpdateNotificationSettingsRequest): UpdateNotificationSettingsResponse => {
      updateNotificationSettings(request.settings)
      // 通知スケジューラーの設定を更新
      updateNotificationSchedulerSettings(request.settings)
      return { success: true }
    }
  )
}

// ==================== エクスポート/インポート ====================

function registerExportData(): void {
  ipcMain.handle(IPC_CHANNELS.EXPORT_DATA, (): ExportDataResponse => {
    const json = exportData()
    return { json }
  })
}

function registerImportData(): void {
  ipcMain.handle(
    IPC_CHANNELS.IMPORT_DATA,
    (_event, request: ImportDataRequest): ImportDataResponse => {
      const result = importData(request.json)
      if (result.success) {
        // 通知スケジューラーを更新（コードと設定の両方）
        updateNotificationSchedulerCodes(getAllCodes())
        updateNotificationSchedulerSettings(getNotificationSettings())
      }
      return result
    }
  )
}

function registerCreateBackup(): void {
  ipcMain.handle(IPC_CHANNELS.CREATE_BACKUP, (): CreateBackupResponse => {
    const json = createBackup()
    return { json }
  })
}

/**
 * ファイルにエクスポート（ダイアログ付き）
 */
function registerExportToFile(): void {
  ipcMain.handle(IPC_CHANNELS.EXPORT_TO_FILE, async (): Promise<ExportToFileResponse> => {
    try {
      // 保存ダイアログを表示
      const result = await dialog.showSaveDialog({
        title: 'データをエクスポート',
        defaultPath: `povo-codes-${formatDateForFilename(new Date())}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'キャンセルされました' }
      }

      // データをエクスポート
      const json = exportData()

      // ファイルに書き込み
      await writeFile(result.filePath, json, 'utf-8')

      return { success: true, filePath: result.filePath }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '不明なエラー'
      return { success: false, error: errorMessage }
    }
  })
}

/**
 * ファイルからインポート（バックアップ付き）
 */
function registerImportFromFile(): void {
  ipcMain.handle(IPC_CHANNELS.IMPORT_FROM_FILE, async (): Promise<ImportFromFileResponse> => {
    try {
      // ファイル選択ダイアログを表示
      const result = await dialog.showOpenDialog({
        title: 'データをインポート',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'キャンセルされました' }
      }

      const selectedPath = result.filePaths[0]
      if (!selectedPath) {
        return { success: false, error: 'ファイルが選択されていません' }
      }

      // 現在のデータをバックアップ
      const backupPath = await createAutoBackup()

      // ファイルを読み込み
      const json = await readFile(selectedPath, 'utf-8')

      // インポート実行
      const importResult = importData(json)

      if (!importResult.success) {
        return {
          success: false,
          error: importResult.error,
          backupPath,
        }
      }

      // 通知スケジューラーを更新
      updateNotificationSchedulerCodes(getAllCodes())
      updateNotificationSchedulerSettings(getNotificationSettings())

      return { success: true, backupPath }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '不明なエラー'
      return { success: false, error: errorMessage }
    }
  })
}

/**
 * 日付をファイル名用にフォーマット
 */
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}${month}${day}-${hours}${minutes}`
}

/**
 * 自動バックアップを作成
 */
async function createAutoBackup(): Promise<string> {
  const backupDir = join(app.getPath('userData'), 'backups')

  // バックアップディレクトリを作成
  await mkdir(backupDir, { recursive: true })

  // バックアップファイル名
  const backupFileName = `backup-${formatDateForFilename(new Date())}.json`
  const backupPath = join(backupDir, backupFileName)

  // バックアップを作成
  const json = createBackup()
  await writeFile(backupPath, json, 'utf-8')

  return backupPath
}

// ==================== メール解析 ====================

function registerParseEmail(): void {
  ipcMain.handle(
    IPC_CHANNELS.PARSE_EMAIL,
    (_event, request: ParseEmailRequest): ParseEmailResponse => {
      return parseEmailForRegistration(request.text)
    }
  )
}

// ==================== テスト通知 ====================

function registerSendTestNotification(): void {
  ipcMain.handle(IPC_CHANNELS.SEND_TEST_NOTIFICATION, (): { success: boolean } => {
    if (!Notification.isSupported()) {
      return { success: false }
    }

    const notification = new Notification({
      title: 'povo プロモコード管理',
      body: 'テスト通知です。通知が正常に機能しています。',
      icon: undefined, // アイコンは後で追加可能
    })

    notification.show()
    return { success: true }
  })
}
