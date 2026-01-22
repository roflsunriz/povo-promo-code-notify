/**
 * サービス層のエントリーポイント
 */

// 状態判定
export {
  determineCodeStatus,
  attachStatus,
  attachStatusToAll,
  filterByStatus,
  getActiveCodes,
  getUnusedCodes,
  getConsumedCodes,
  getExpiredCodes,
  isCodeUsable,
  isCodeFinished,
} from './code-status'

// 連続カバレッジ計算
export { calculateCoverage, formatRemainingTime, formatCoverageEndAt } from './coverage'

// 次開始候補
export { getNextCandidate, getUnusedCodesSorted, getNextCandidateSummary } from './next-candidate'

// 永続化（electron-storeを使用するため、メインプロセス専用）
export {
  getAllCodes,
  getCodeById,
  createCode,
  createCodes,
  updateCode,
  deleteCode,
  deleteAllCodes,
  startCode,
  cancelCode,
  editStartedAt,
  updateOrders,
  getNextOrder,
  getNotificationSettings,
  updateNotificationSettings,
  getStoreData,
  exportData,
  createBackup,
  importData,
  resetStore,
  getStorePath,
} from './store'

// メール解析
export {
  parseEmailText,
  parseEmailForRegistration,
  parseDateInput,
  parseValidityInput,
} from './email-parser'
