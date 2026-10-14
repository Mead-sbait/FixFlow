import { expect, test } from '@playwright/test'
import { adminSession, registerUser, signIn } from './helpers'

test.describe('languages and direction', () => {
  test('the login page switches between english, hebrew and arabic', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    await page.getByRole('button', { name: 'עברית' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'he')
    await expect(page.getByRole('heading', { name: 'כניסה' })).toBeVisible()

    await page.getByRole('button', { name: 'العربية' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.getByRole('heading', { name: 'تسجيل الدخول' })).toBeVisible()

    // the choice sticks across reloads
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')

    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  })

  test('the board reads right to left in hebrew', async ({ page, request }) => {
    const admin = await adminSession(request)
    await signIn(page, admin, '/admin', 'he')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByRole('heading', { name: 'הלוח' })).toBeVisible()
    await expect(page.locator('.column').first()).toContainText('לא משובץ')

    // in rtl the first column sits on the right hand side of the page
    const box = await page.locator('.column').first().boundingBox()
    const width = await page.evaluate(() => window.innerWidth)
    expect(box!.x + box!.width / 2).toBeGreaterThan(width / 2)
  })

  test('a reporter can work in arabic', async ({ page, request }) => {
    const { session } = await registerUser(request, 'Arabic Reporter')
    await signIn(page, session, '/issues/new', 'ar')
    await expect(page.getByRole('heading', { name: 'الإبلاغ عن مشكلة' })).toBeVisible()
    await page.getByLabel('ما المشكلة؟').fill('المكيف لا يعمل')
    await page.getByLabel('أين تقع؟').fill('الطابق الثاني')
    await page.getByLabel('التفاصيل').fill('منذ الصباح')
    await page.getByRole('button', { name: 'تثبيت على اللوحة' }).click()
    await expect(page).toHaveURL(/\/issues\/[a-f0-9]{24}$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('المكيف لا يعمل')
  })
})
