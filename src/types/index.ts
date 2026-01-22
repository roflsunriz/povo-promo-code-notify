/**
 * 型定義のエントリーポイント
 */

// コードエンティティ型
export type {
  CodeStatus,
  PromoCode,
  CreatePromoCodeInput,
  UpdatePromoCodeInput,
  PromoCodeWithStatus,
  CoverageResult,
  NextCandidateResult,
  StoreData,
  NotificationSettings,
} from './code'

export {
  DEFAULT_NOTIFICATION_SETTINGS,
  VALIDITY_DURATIONS,
  INITIAL_STORE_DATA,
} from './code'

// Zodスキーマ
export {
  CodeStatusSchema,
  PromoCodeSchema,
  CreatePromoCodeInputSchema,
  UpdatePromoCodeInputSchema,
  NotificationSettingsSchema,
  StoreDataSchema,
  ExportDataSchema,
  validate,
  validatePromoCode,
  validateCreatePromoCodeInput,
  validateUpdatePromoCodeInput,
  validateStoreData,
  validateExportData,
} from './schemas'

export type {
  CodeStatusFromSchema,
  PromoCodeFromSchema,
  CreatePromoCodeInputFromSchema,
  UpdatePromoCodeInputFromSchema,
  NotificationSettingsFromSchema,
  StoreDataFromSchema,
  ExportDataFromSchema,
  ValidationResult,
} from './schemas'

// IPC型定義
export type {
  GetAllCodesResponse,
  CreateCodeRequest,
  CreateCodeResponse,
  CreateCodesRequest,
  CreateCodesResponse,
  DeleteCodeRequest,
  DeleteCodeResponse,
  UpdateOrdersRequest,
  UpdateOrdersResponse,
  StartCodeRequest,
  StartCodeResponse,
  CancelCodeRequest,
  CancelCodeResponse,
  EditStartedAtRequest,
  EditStartedAtResponse,
  GetCoverageResponse,
  GetNextCandidateResponse,
  GetNotificationSettingsResponse,
  UpdateNotificationSettingsRequest,
  UpdateNotificationSettingsResponse,
  ExportDataResponse,
  ImportDataRequest,
  ImportDataResponse,
  CreateBackupResponse,
  ParseEmailRequest,
  ParsedCodeInfo,
  ParseEmailResponse,
  DashboardData,
  GetDashboardResponse,
  CodeFilter,
  CodeSortKey,
  CodeSortDirection,
  CodeSort,
  GetFilteredCodesRequest,
  GetFilteredCodesResponse,
  IpcChannel,
} from './ipc'

export { IPC_CHANNELS } from './ipc'
