/// <reference types="vite/client" />
/// <reference types="../../preload/index.d.ts" />

import type { ElectronAPI } from '@electron-toolkit/preload'
import type { ApiType } from '../../preload/index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApiType
  }
}
