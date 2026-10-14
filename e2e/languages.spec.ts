import { expect, test } from '@playwright/test'
import { adminSession, registerUser, signIn } from './helpers'

test('switches between Arabic and Hebrew and keeps the preference', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { name: 'تسجيل الدخول' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'English' })).toHaveCount(0)
  await page.getByRole('button', { name: 'עברית' }).click()
  await expect(page.getByRole('heading', { name: 'כניסה' })).toBeVisible()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'he')
  await page.getByRole('button', { name: 'العربية' }).click()
  await expect(page.getByRole('heading', { name: 'تسجيل الدخول' })).toBeVisible()
})

test('the Hebrew board starts on the right', async ({ page, request }) => {
  await signIn(page, await adminSession(request), '/admin', 'he')
  await expect(page.getByRole('heading', { name: 'לוח התחזוקה' })).toBeVisible()
  const box = await page.locator('.column').first().boundingBox()
  expect(box!.x + box!.width / 2).toBeGreaterThan((await page.evaluate(() => innerWidth)) / 2)
})

test('a user can submit a maintenance request in Arabic', async ({ page, request }) => {
  const { session } = await registerUser(request, 'Arabic Reporter')
  await signIn(page, session, '/issues/new', 'ar')
  await page.getByLabel('ما المشكلة؟').fill('المكيف لا يعمل')
  await page.getByLabel('أين تقع؟').fill('الطابق الثاني')
  await page.getByLabel('التفاصيل').fill('منذ الصباح')
  await page.getByRole('button', { name: 'إرسال البلاغ' }).click()
  await expect(page).toHaveURL(/\/issues\/[a-f0-9]{24}$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('المكيف لا يعمل')
})
