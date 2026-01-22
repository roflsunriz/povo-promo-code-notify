/**
 * IPCハンドラー
 * main-renderer間の通信処理
 */

import { IPC_CHANNELS } from '@types/ipc'
import { ipcMain, Notification } from 'electron'
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
  GetAllCodesResponse,
  GetCoverageResponse,
  GetDashboardResponse,
  GetFilteredCodesRequest,
  GetFilteredCodesResponse,
  GetNextCandidateResponse,
  GetNotificationSettingsResponse,
  ImportDataRequest,
  ImportDataResponse,
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
      return { code }
    }
  )
}

function registerCreateCodes(): void {
  ipcMain.handle(
    IPC_CHANNELS.CREATE_CODES,
    (_event, request: CreateCodesRequest): CreateCodesResponse => {
      const codes = createCodes(request.inputs)
      return { codes }
    }
  )
}

function registerDeleteCode(): void {
  ipcMain.handle(
    IPC_CHANNELS.DELETE_CODE,
    (_event, request: DeleteCodeRequest): DeleteCodeResponse => {
      const success = deleteCode(request.id)
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
      return { code: code ?? null }
    }
  )
}

function registerCancelCode(): void {
  ipcMain.handle(
    IPC_CHANNELS.CANCEL_CODE,
    (_event, request: CancelCodeRequest): CancelCodeResponse => {
      const code = cancelCode(request.id)
      return { code: code ?? null }
    }
  )
}

function registerEditStartedAt(): void {
  ipcMain.handle(
    IPC_CHANNELS.EDIT_STARTED_AT,
    (_event, request: EditStartedAtRequest): EditStartedAtResponse => {
      const code = editStartedAt(request.id, new Date(request.newStartedAt))
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
