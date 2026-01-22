import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../types/ipc'
import type {
  CancelCodeRequest,
  CancelCodeResponse,
  CreateBackupResponse,
  CreateCodeRequest,
  CreateCodeResponse,
  CreateCodesRequest,
  CreateCodesResponse,
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
  UpdateOrdersResponse
} from '../types/ipc'

// Custom APIs for renderer
const api = {
  // コード操作
  getAllCodes: (): Promise<GetAllCodesResponse> => ipcRenderer.invoke(IPC_CHANNELS.GET_ALL_CODES),

  createCode: (request: CreateCodeRequest): Promise<CreateCodeResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CREATE_CODE, request),

  createCodes: (request: CreateCodesRequest): Promise<CreateCodesResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CREATE_CODES, request),

  deleteCode: (request: DeleteCodeRequest): Promise<DeleteCodeResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.DELETE_CODE, request),

  updateOrders: (request: UpdateOrdersRequest): Promise<UpdateOrdersResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_ORDERS, request),

  // 使用開始・取り消し
  startCode: (request: StartCodeRequest): Promise<StartCodeResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.START_CODE, request),

  cancelCode: (request: CancelCodeRequest): Promise<CancelCodeResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CANCEL_CODE, request),

  editStartedAt: (request: EditStartedAtRequest): Promise<EditStartedAtResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.EDIT_STARTED_AT, request),

  // カバレッジ・候補
  getCoverage: (): Promise<GetCoverageResponse> => ipcRenderer.invoke(IPC_CHANNELS.GET_COVERAGE),

  getNextCandidate: (): Promise<GetNextCandidateResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_NEXT_CANDIDATE),

  // ダッシュボード
  getDashboard: (): Promise<GetDashboardResponse> => ipcRenderer.invoke(IPC_CHANNELS.GET_DASHBOARD),

  // フィルター付き取得
  getFilteredCodes: (request: GetFilteredCodesRequest): Promise<GetFilteredCodesResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_FILTERED_CODES, request),

  // 通知設定
  getNotificationSettings: (): Promise<GetNotificationSettingsResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_NOTIFICATION_SETTINGS),

  updateNotificationSettings: (
    request: UpdateNotificationSettingsRequest
  ): Promise<UpdateNotificationSettingsResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_NOTIFICATION_SETTINGS, request),

  // エクスポート/インポート
  exportData: (): Promise<ExportDataResponse> => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_DATA),

  importData: (request: ImportDataRequest): Promise<ImportDataResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.IMPORT_DATA, request),

  createBackup: (): Promise<CreateBackupResponse> => ipcRenderer.invoke(IPC_CHANNELS.CREATE_BACKUP),

  exportToFile: (): Promise<ExportToFileResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_TO_FILE),

  importFromFile: (): Promise<ImportFromFileResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.IMPORT_FROM_FILE),

  // メール解析
  parseEmail: (request: ParseEmailRequest): Promise<ParseEmailResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.PARSE_EMAIL, request),

  // テスト通知
  sendTestNotification: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC_CHANNELS.SEND_TEST_NOTIFICATION)
}

export type ApiType = typeof api

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
