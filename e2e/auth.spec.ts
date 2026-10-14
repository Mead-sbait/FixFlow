import { expect, test } from '@playwright/test'
import { PASSWORD, adminSession, registerUser, signIn, uniqueEmail } from './helpers'

test.describe('signing up and in', () => {
  test('a visitor can register, sign in and lands on their board', async ({ page }) => {
    const email = uniqueEmail('visitor')

    await page.goto('/register')
    await page.getByLabel('Name').fill('Visitor Test')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('Account created')).toBeVisible()

    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText("Visitor's issues")
  })

  test('a wrong password shows an error and stays on the login page', async ({ page, request }) => {
    const { email } = await registerUser(request, 'Wrong Pass')
    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('not-the-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('the session survives a reload and sign out clears it', async ({ page, request }) => {
    const { session } = await registerUser(request, 'Reload Me')
    await signIn(page, session, '/dashboard')
    await page.reload()
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('roles cannot open each other\'s pages', async ({ page, request }) => {
    const { session } = await registerUser(request, 'Just A User')
    await signIn(page, session, '/admin')
    await expect(page).toHaveURL(/\/dashboard$/)

    const admin = await adminSession(request)
    await signIn(page, admin, '/technician')
    await expect(page).toHaveURL(/\/admin$/)
  })

  test('a signed out visitor is sent to login', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page).toHaveURL(/\/login$/)
  })
})
