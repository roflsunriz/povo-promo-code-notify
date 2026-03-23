/**
 * アプリ更新管理フック
 */

import { useState, useCallback, useEffect } from 'react'
import type { DownloadProgressInfo, UpdaterStatus } from '../../../types/ipc'

export interface UseUpdaterReturn {
  currentVersion: string | null
  latestVersion: string | null
  status: UpdaterStatus
  progress: DownloadProgressInfo | null
  error: string | null
  releaseNotes: string | null
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  quitAndInstall: () => Promise<void>
}

export function useUpdater(): UseUpdaterReturn {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [status, setStatus] = useState<UpdaterStatus>('idle')
  const [progress, setProgress] = useState<DownloadProgressInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null)

  useEffect(() => {
    void window.api.getAppVersion().then((res) => {
      setCurrentVersion(res.version)
    })
  }, [])

  useEffect(() => {
    const unsubEvent = window.api.onUpdaterEvent((event) => {
      setStatus(event.status)
      if (event.version) {
        setLatestVersion(event.version)
      }
      if (event.error) {
        setError(event.error)
      }
      if (event.releaseNotes !== undefined) {
        setReleaseNotes(event.releaseNotes)
      }
    })

    const unsubProgress = window.api.onDownloadProgress((prog) => {
      setProgress(prog)
    })

    return () => {
      unsubEvent()
      unsubProgress()
    }
  }, [])

  const checkForUpdates = useCallback(async () => {
    setError(null)
    setStatus('checking')
    setProgress(null)
    const result = await window.api.checkForUpdates()
    if (result.error) {
      setError(result.error)
      setStatus('error')
    } else if (!result.updateAvailable) {
      setStatus('not-available')
    }
    if (result.version) {
      setLatestVersion(result.version)
    }
  }, [])

  const downloadUpdate = useCallback(async () => {
    setError(null)
    setProgress(null)
    const result = await window.api.downloadUpdate()
    if (!result.success && result.error) {
      setError(result.error)
      setStatus('error')
    }
  }, [])

  const quitAndInstall = useCallback(async () => {
    await window.api.quitAndInstall()
  }, [])

  return {
    currentVersion,
    latestVersion,
    status,
    progress,
    error,
    releaseNotes,
    checkForUpdates,
    downloadUpdate,
    quitAndInstall
  }
}
