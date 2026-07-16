import { describe, expect, it } from 'vitest'
import { shouldStartInTray, START_IN_TRAY_ARGUMENT } from './startup-options'

describe('shouldStartInTray', () => {
  it('起動引数に --start-in-tray がある場合は true を返す', () => {
    expect(
      shouldStartInTray(['C:\\Program Files\\povo-promo-code-notify.exe', START_IN_TRAY_ARGUMENT])
    ).toBe(true)
  })

  it('開発起動でも --start-in-tray を検出する', () => {
    expect(
      shouldStartInTray(['C:\\path\\to\\electron.exe', 'C:\\path\\to\\app', START_IN_TRAY_ARGUMENT])
    ).toBe(true)
  })

  it('起動引数がない場合は false を返す', () => {
    expect(shouldStartInTray(['C:\\Program Files\\povo-promo-code-notify.exe'])).toBe(false)
  })

  it('似ているだけの起動引数は検出しない', () => {
    expect(shouldStartInTray(['--start-in-tray=true', '--START-IN-TRAY'])).toBe(false)
  })
})
