import { devices, expect, test } from '@playwright/test'
import { adminSession, createIssue, expectNoHorizontalScroll, registerUser, signIn } from './helpers'

test.use({ ...devices['Pixel 7'], channel: 'chrome' })

test.describe('on a phone', () => {
  test('the main pages fit the screen without sideways scrolling', async ({ page, request }) => {
    const admin = await adminSession(request)
    const reporter = await registerUser(request, 'Phone Reporter')
    await createIssue(request, reporter.session, `Phone issue ${Date.now()}`)

    for (const path of ['/login', '/register']) {
      await page.goto(path)
      await expectNoHorizontalScroll(page)
    }

    await signIn(page, reporter.session, '/dashboard', 'ar')
    await expectNoHorizontalScroll(page)
    await page.goto('/issues/new')
    await expectNoHorizontalScroll(page)

    for (const path of ['/admin', '/admin/issues', '/admin/users', '/admin/statistics']) {
      await signIn(page, admin, path, 'ar')
      await expect(page.locator('main')).toBeVisible()
      await expectNoHorizontalScroll(page)
    }
  })

  test('right to left pages fit the screen too', async ({ page, request }) => {
    const admin = await adminSession(request)
    const reporter = await registerUser(request, 'Phone RTL Reporter')
    for (const lang of ['he', 'ar']) {
      await signIn(page, reporter.session, '/dashboard', lang)
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      await expectNoHorizontalScroll(page)
      await page.goto('/issues/new')
      await expectNoHorizontalScroll(page)
      await signIn(page, admin, '/admin', lang)
      await expectNoHorizontalScroll(page)
      await page.goto('/admin/issues')
      await expectNoHorizontalScroll(page)
    }
  })

  test('the notifications panel opens and closes on a phone', async ({ page, request }) => {
    const admin = await adminSession(request)
    await signIn(page, admin, '/admin', 'ar')
    await page.getByRole('button', { name: /الإشعارات/ }).click()
    const panel = page.getByRole('dialog', { name: "الإشعارات" })
    await expect(panel).toBeVisible()
    await page.getByRole('button', { name: "إغلاق" }).click()
    await expect(panel).toHaveCount(0)
  })
})
