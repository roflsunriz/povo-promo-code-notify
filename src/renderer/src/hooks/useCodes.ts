/**
 * コードデータ管理フック
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  CreatePromoCodeInput,
  NotificationSettings,
  PromoCodeWithStatus
} from '../../../types/code'
import type { CodeFilter, CodeSort, DashboardData, ParsedCodeInfo } from '../../../types/ipc'

/**
 * ダッシュボードデータ取得フック
 */
export function useDashboard(refreshInterval = 60000): {
  data: DashboardData | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
} {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await window.api.getDashboard()
      setData(response.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()

    // 自動更新（デフォルト60秒）
    const interval = setInterval(() => {
      void refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refresh, refreshInterval])

  return { data, isLoading, error, refresh }
}

/**
 * コード一覧取得フック
 */
export function useCodes(
  filter?: CodeFilter,
  sort?: CodeSort
): {
  codes: PromoCodeWithStatus[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
} {
  const [codes, setCodes] = useState<PromoCodeWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await window.api.getFilteredCodes({ filter, sort })
      setCodes(response.codes)
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [filter, sort])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { codes, isLoading, error, refresh }
}

/**
 * コード操作フック
 */
export function useCodeActions(): {
  startCode: (id: string, startedAt?: string) => Promise<boolean>
  cancelCode: (id: string) => Promise<boolean>
  editStartedAt: (id: string, newStartedAt: string) => Promise<boolean>
  deleteCode: (id: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCode = useCallback(async (id: string, startedAt?: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await window.api.startCode({ id, startedAt })
      return response.code !== null
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const cancelCode = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await window.api.cancelCode({ id })
      return response.code !== null
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const editStartedAt = useCallback(async (id: string, newStartedAt: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await window.api.editStartedAt({ id, newStartedAt })
      return response.code !== null
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteCode = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await window.api.deleteCode({ id })
      return response.success
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { startCode, cancelCode, editStartedAt, deleteCode, isLoading, error }
}

/**
 * コード登録フック
 */
export function useCodeRegistration(): {
  parseEmail: (text: string) => Promise<ParsedCodeInfo[]>
  registerCodes: (inputs: CreatePromoCodeInput[]) => Promise<boolean>
  isLoading: boolean
  error: string | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseEmail = useCallback(async (text: string): Promise<ParsedCodeInfo[]> => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await window.api.parseEmail({ text })
      if (!response.success) {
        setError(response.error ?? '解析に失敗しました')
        return []
      }
      return response.codes
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const registerCodes = useCallback(async (inputs: CreatePromoCodeInput[]): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      await window.api.createCodes({ inputs })
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { parseEmail, registerCodes, isLoading, error }
}

/**
 * 通知設定フック
 */
export function useNotificationSettings(): {
  settings: NotificationSettings | null
  isLoading: boolean
  error: string | null
  updateSettings: (settings: NotificationSettings) => Promise<boolean>
  sendTestNotification: () => Promise<boolean>
  refresh: () => Promise<void>
} {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await window.api.getNotificationSettings()
      setSettings(response.settings)
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateSettings = useCallback(
    async (newSettings: NotificationSettings): Promise<boolean> => {
      try {
        setIsLoading(true)
        setError(null)
        await window.api.updateNotificationSettings({ settings: newSettings })
        setSettings(newSettings)
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      const response = await window.api.sendTestNotification()
      return response.success
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
      return false
    }
  }, [])

  return { settings, isLoading, error, updateSettings, sendTestNotification, refresh }
}

/**
 * 順序更新フック
 */
export function useOrderUpdate(): {
  updateOrders: (orders: Array<{ id: string; order: number }>) => Promise<boolean>
  isLoading: boolean
  error: string | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateOrders = useCallback(
    async (orders: Array<{ id: string; order: number }>): Promise<boolean> => {
      try {
        setIsLoading(true)
        setError(null)
        await window.api.updateOrders({ orders })
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : '不明なエラーが発生しました')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { updateOrders, isLoading, error }
}

/**
 * 前回の値を保持するフック
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

/**
 * エクスポート結果
 */
export interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
}

/**
 * インポート結果
 */
export interface ImportResult {
  success: boolean
  backupPath?: string
  error?: string
}

/**
 * エクスポート/インポートフック
 */
export function useDataExportImport(): {
  exportToFile: () => Promise<ExportResult>
  importFromFile: () => Promise<ImportResult>
  isExporting: boolean
  isImporting: boolean
  error: string | null
} {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportToFile = useCallback(async (): Promise<ExportResult> => {
    try {
      setIsExporting(true)
      setError(null)
      const response = await window.api.exportToFile()
      if (!response.success) {
        setError(response.error ?? 'エクスポートに失敗しました')
      }
      return response
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '不明なエラーが発生しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsExporting(false)
    }
  }, [])

  const importFromFile = useCallback(async (): Promise<ImportResult> => {
    try {
      setIsImporting(true)
      setError(null)
      const response = await window.api.importFromFile()
      if (!response.success) {
        setError(response.error ?? 'インポートに失敗しました')
      }
      return response
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '不明なエラーが発生しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsImporting(false)
    }
  }, [])

  return { exportToFile, importFromFile, isExporting, isImporting, error }
}
