import { expect, test } from '@playwright/test'
import { assignIssue, cleanupTechnicians, createIssue, registerTechnician, registerUser, signIn } from './helpers'

test.afterAll(async ({ request }) => {
  await cleanupTechnicians(request)
})

test.describe('the technician column', () => {
  test('an assigned issue is started, commented on and completed', async ({ page, request }) => {
    const tech = await registerTechnician(request, 'Working Tech')
    const reporter = await registerUser(request, 'Work Reporter')
    const title = `Jammed window ${Date.now()}`
    const issue = await createIssue(request, reporter.session, title)
    await assignIssue(request, issue.id, tech.session.user.id)

    await signIn(page, tech.session, '/technician', 'ar')
    await expect(page.getByRole('heading', { level: 1 })).toContainText("مهام Working")
    await page.getByRole('link', { name: new RegExp(title) }).click()
    await expect(page).toHaveURL(new RegExp(`/technician/issues/${issue.id}$`))

    await page.getByRole('button', { name: "بدء العمل" }).click()
    await expect(page.locator('.tag--in_progress')).toBeVisible()

    await page.getByLabel("إضافة تعليق").fill('Needs a new hinge, ordered one.')
    await page.getByRole('button', { name: "إضافة تعليق" }).click()
    await expect(page.locator('.comment', { hasText: 'Needs a new hinge' })).toBeVisible()

    await page.getByLabel("ملاحظة داخلية").check()
    await page.getByLabel("إضافة تعليق").fill('Reporter was rude about it.')
    await page.getByRole('button', { name: "إضافة ملاحظة" }).click()
    await expect(page.locator('.comment--internal', { hasText: 'rude' })).toBeVisible()

    await page.getByRole('button', { name: "إكمال المهمة" }).click()
    await expect(page.locator('.tag--completed')).toBeVisible()
    await expect(page.locator('.steps .ticked')).toContainText("منجز")
  })

  test('a technician cannot open someone else\'s issue', async ({ page, request }) => {
    const tech = await registerTechnician(request, 'Nosy Tech')
    const otherTech = await registerTechnician(request, 'Other Tech')
    const reporter = await registerUser(request, 'Private Reporter')
    const issue = await createIssue(request, reporter.session, `Not yours ${Date.now()}`)
    await assignIssue(request, issue.id, otherTech.session.user.id)

    await signIn(page, tech.session, `/technician/issues/${issue.id}`, 'ar')
    await expect(page.getByText("البلاغ غير موجود")).toBeVisible()
  })

  test('the reporter sees the technician\'s progress', async ({ page, request }) => {
    const tech = await registerTechnician(request, 'Visible Tech')
    const reporter = await registerUser(request, 'Watching Reporter')
    const title = `Dripping ceiling ${Date.now()}`
    const issue = await createIssue(request, reporter.session, title)
    await assignIssue(request, issue.id, tech.session.user.id)

    await signIn(page, reporter.session, `/issues/${issue.id}`, 'ar')
    await expect(page.locator('.tag--assigned')).toBeVisible()
    await expect(page.getByRole('list', { name: "الحالة" }).locator('.now')).toContainText("مُسند")

    await page.getByRole('button', { name: /الإشعارات/ }).click()
    await expect(page.getByRole('dialog', { name: "الإشعارات" })).toBeVisible()
  })
})
