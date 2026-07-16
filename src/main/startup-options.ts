export const START_IN_TRAY_ARGUMENT = '--start-in-tray'

/**
 * 起動時にメインウィンドウを表示せず、タスクトレイに常駐するかを判定する。
 */
export function shouldStartInTray(args: readonly string[]): boolean {
  return args.includes(START_IN_TRAY_ARGUMENT)
}
