import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { _electron as electron } from 'playwright'
import type {} from '../src/preload/api.d.ts'

test('更新後のElectronで画面・IPC・保存と再起動が動作する', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'povo-dependency-e2e-'))
  const userData = path.join(directory, 'user-data')
  const launcher = path.join(directory, 'launcher.cjs')
  const entry = path.resolve('out/main/index.js')
  await writeFile(
    launcher,
    `const { app } = require('electron');
app.setPath('userData', ${JSON.stringify(userData)});
app.setAppPath(${JSON.stringify(process.cwd())});
require(${JSON.stringify(entry)});
`
  )
  const launch = () =>
    electron.launch({
      args: [launcher, '--start-in-tray'],
      env: { ...process.env, NODE_ENV: 'test' }
    })

  let application: Awaited<ReturnType<typeof launch>> | undefined
  try {
    application = await launch()
    const page = await application.firstWindow()
    expect(await application.evaluate(({ app }) => app.getPath('userData'))).toBe(userData)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.locator('#tab-overview').waitFor()
    const browserWindowHandle = await application.browserWindow(page)
    expect(await browserWindowHandle.evaluate((browserWindow) => browserWindow.isVisible())).toBe(
      false
    )

    for (const size of [
      { width: 1280, height: 720 },
      { width: 800, height: 600 }
    ]) {
      await page.setViewportSize(size)
      for (const tab of ['overview', 'codes', 'register', 'edit', 'notification', 'update']) {
        await page.locator(`#tab-${tab}`).click()
        await expect(page.locator(`#tab-${tab}`)).toHaveAttribute('aria-selected', 'true')
        await expect(page.locator(`#tabpanel-${tab}`)).toBeVisible()
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      ).toBe(true)
    }

    const result = await page.evaluate(async () => {
      const { code } = await window.api.createCode({
        input: {
          order: 1,
          code: 'DEPENDENCY123',
          inputDeadline: '2099-12-31T23:59:59.000Z',
          validityDurationMinutes: 60
        }
      })
      // 実際のIPC境界でundefinedを渡し、既存の順序が壊れないことを確かめる。
      const input = Object.assign({ code: 'UPDATED123' }, { order: undefined })
      const updated = await window.api.updateCode({
        id: code.id,
        input: input as { code: string }
      })
      const started = await window.api.startCode({ id: code.id })
      const canceled = await window.api.cancelCode({ id: code.id })
      const settings = {
        expiryThresholdsMinutes: [60, 15],
        inputDeadlineThresholdsMinutes: [120]
      }
      await window.api.updateNotificationSettings({ settings })
      return { id: code.id, updated: updated.code, started: started.code, canceled: canceled.code }
    })
    expect(result.updated?.order).toBe(1)
    expect(result.updated?.code).toBe('UPDATED123')
    expect(result.started?.startedAt).not.toBeNull()
    expect(result.canceled?.startedAt).toBeNull()
    await page.reload()
    await page.locator('#tab-overview').waitFor()
    expect(await page.evaluate(() => window.api.getAllCodes())).toMatchObject({
      codes: [{ id: result.id, code: 'UPDATED123', order: 1 }]
    })
    await page.screenshot({ path: 'test-results/dependency-update.png' })
    expect(errors).toEqual([])

    await application.close()
    application = await launch()
    const reopened = await application.firstWindow()
    await reopened.locator('#tab-overview').waitFor()
    expect(await reopened.evaluate(() => window.api.getAllCodes())).toMatchObject({
      codes: [{ id: result.id, code: 'UPDATED123', order: 1 }]
    })
    expect(await reopened.evaluate(() => window.api.getNotificationSettings())).toMatchObject({
      settings: { expiryThresholdsMinutes: [60, 15], inputDeadlineThresholdsMinutes: [120] }
    })
    expect(await reopened.evaluate((id) => window.api.deleteCode({ id }), result.id)).toEqual({
      success: true
    })
    expect(await reopened.evaluate(() => window.api.getAllCodes())).toEqual({ codes: [] })
  } finally {
    await application?.close()
    await rm(directory, { recursive: true, force: true })
  }
})
