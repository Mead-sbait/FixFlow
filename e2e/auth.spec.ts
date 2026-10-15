import { expect, test } from '@playwright/test'
import { PASSWORD, adminSession, registerUser, signIn, uniqueEmail } from './helpers'

test.describe('signing up and in', () => {
  test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('fixflow.lang', 'ar')) })
  test('a visitor can register, sign in and lands on their board', async ({ page }) => {
    const email = uniqueEmail('visitor')

    await page.goto('/register')
    await page.getByLabel("الاسم").fill('Visitor Test')
    await page.getByLabel("البريد الإلكتروني").fill(email)
    await page.getByLabel("كلمة المرور").fill(PASSWORD)
    await page.getByRole('button', { name: "إنشاء حساب" }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('تم إنشاء الحساب')).toBeVisible()

    await page.getByLabel("البريد الإلكتروني").fill(email)
    await page.getByLabel("كلمة المرور").fill(PASSWORD)
    await page.getByRole('button', { name: "تسجيل الدخول" }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText("بلاغات Visitor")
  })

  test('a wrong password shows an error and stays on the login page', async ({ page, request }) => {
    const { email } = await registerUser(request, 'Wrong Pass')
    await page.goto('/login')
    await page.getByLabel("البريد الإلكتروني").fill(email)
    await page.getByLabel("كلمة المرور").fill('not-the-password')
    await page.getByRole('button', { name: "تسجيل الدخول" }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('the session survives a reload and sign out clears it', async ({ page, request }) => {
    const { session } = await registerUser(request, 'Reload Me')
    await signIn(page, session, '/dashboard', 'ar')
    await page.reload()
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.getByRole('button', { name: "تسجيل الخروج" }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('roles cannot open each other\'s pages', async ({ page, request }) => {
    const { session } = await registerUser(request, 'Just A User')
    await signIn(page, session, '/admin', 'ar')
    await expect(page).toHaveURL(/\/dashboard$/)

    const admin = await adminSession(request)
    await signIn(page, admin, '/technician', 'ar')
    await expect(page).toHaveURL(/\/admin$/)
  })

  test('a signed out visitor is sent to login', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page).toHaveURL(/\/login$/)
  })
})
