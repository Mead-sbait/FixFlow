import { expect, test } from '@playwright/test'
import { adminSession, cleanupTechnicians, createIssue, dragStrip, registerTechnician, registerUser, signIn, trackTechnician } from './helpers'

test.afterAll(async ({ request }) => {
  await cleanupTechnicians(request)
})

test.describe('the admin board', () => {
  test('a new issue shows up in the unassigned column and can be moved to a technician', async ({ page, request }) => {
    const admin = await adminSession(request)
    const tech = await registerTechnician(request, 'Board Tech')
    const reporter = await registerUser(request, 'Board Reporter')
    const title = `Flickering light ${Date.now()}`
    await createIssue(request, reporter.session, title)

    await signIn(page, admin, '/admin', 'ar')
    const unassigned = page.locator('.column[data-column="unassigned"]')
    const techColumn = page.locator(`.column[data-column="${tech.session.user.id}"]`)
    const strip = unassigned.locator('.strip', { hasText: title })
    await expect(strip).toBeVisible()

    // the menu on the strip is the keyboard path to the same move as the drag
    await strip.getByLabel(`نقل ${title} إلى`).selectOption(tech.session.user.id)
    await expect(techColumn.locator('.strip', { hasText: title })).toBeVisible()
    await expect(techColumn.locator('.strip', { hasText: title })).toContainText("مُسند")
    await expect(unassigned.locator('.strip', { hasText: title })).toHaveCount(0)
  })

  test('a strip can be dragged into a technician column', async ({ page, request }) => {
    const admin = await adminSession(request)
    // columns are sorted by name, so this one sits right next to Unassigned and is always on screen
    const tech = await registerTechnician(request, 'A Drag Tech')
    const reporter = await registerUser(request, 'Drag Reporter')
    const title = `Broken blind ${Date.now()}`
    await createIssue(request, reporter.session, title)

    await signIn(page, admin, '/admin', 'ar')
    const strip = page.locator('.column[data-column="unassigned"] .strip', { hasText: title })
    const target = page.locator(`.column[data-column="${tech.session.user.id}"] .column__body`)
    await expect(strip).toBeVisible()
    await expect(target).toBeInViewport()
    await dragStrip(page, strip, target)
    await expect(page.locator(`.column[data-column="${tech.session.user.id}"] .strip`, { hasText: title })).toBeVisible()
  })

  test('priority, cancel and reopen work from the list', async ({ page, request }) => {
    const admin = await adminSession(request)
    const reporter = await registerUser(request, 'List Reporter')
    const title = `Squeaky door ${Date.now()}`
    await createIssue(request, reporter.session, title)

    await signIn(page, admin, '/admin/issues', 'ar')
    await page.getByLabel("بحث في البلاغات").fill(title)
    await page.getByRole('button', { name: "بحث" }).click()
    const row = page.locator('tr', { hasText: title })
    await expect(row).toHaveCount(1)

    await row.getByLabel(`أولوية ${title}`).selectOption('urgent')
    await expect(row.locator('.magnet--urgent')).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await row.getByRole('button', { name: "إلغاء" }).click()
    await expect(row).toContainText("ملغى")
    await expect(row.locator('.struck')).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await row.getByRole('button', { name: "إعادة فتح" }).click()
    await expect(row).toContainText("مفتوح")
  })

  test('the people page can promote a user to technician', async ({ page, request }) => {
    const admin = await adminSession(request)
    const created = await registerUser(request, 'Promote Me')

    await signIn(page, admin, '/admin/users', 'ar')
    await page.getByLabel("البحث عن مستخدم").fill(created.email)
    await page.getByRole('button', { name: "بحث" }).click()
    const row = page.locator('tr', { hasText: created.email })
    await expect(row).toHaveCount(1)

    page.once('dialog', (dialog) => dialog.accept())
    await row.getByLabel('دور Promote Me').selectOption('technician')
    await expect(row.locator('.tag--technician')).toBeVisible()
    trackTechnician(created.session.user.id)
  })

  test('the tally page counts the board', async ({ page, request }) => {
    const admin = await adminSession(request)
    await signIn(page, admin, '/admin/statistics', 'ar')
    await expect(page.getByRole('heading', { name: "حسب الحالة" })).toBeVisible()
    await expect(page.getByRole('heading', { name: "حسب الفئة" })).toBeVisible()
    await expect(page.locator('.bar').first()).toBeVisible()
  })
})
