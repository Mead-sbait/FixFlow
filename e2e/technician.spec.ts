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

    await signIn(page, tech.session, '/technician')
    await expect(page.getByRole('heading', { level: 1 })).toContainText("Working's column")
    await page.getByRole('link', { name: new RegExp(title) }).click()
    await expect(page).toHaveURL(new RegExp(`/technician/issues/${issue.id}$`))

    await page.getByRole('button', { name: 'Start work' }).click()
    await expect(page.locator('.tag--in_progress')).toBeVisible()

    await page.getByLabel('Add a comment').fill('Needs a new hinge, ordered one.')
    await page.getByRole('button', { name: 'Add comment' }).click()
    await expect(page.locator('.comment', { hasText: 'Needs a new hinge' })).toBeVisible()

    await page.getByLabel('Internal note').check()
    await page.getByLabel('Add a comment').fill('Reporter was rude about it.')
    await page.getByRole('button', { name: 'Add note' }).click()
    await expect(page.locator('.comment--internal', { hasText: 'rude' })).toBeVisible()

    await page.getByRole('button', { name: 'Mark as done' }).click()
    await expect(page.locator('.tag--completed')).toBeVisible()
    await expect(page.locator('.steps .ticked')).toContainText('Done')
  })

  test('a technician cannot open someone else\'s issue', async ({ page, request }) => {
    const tech = await registerTechnician(request, 'Nosy Tech')
    const otherTech = await registerTechnician(request, 'Other Tech')
    const reporter = await registerUser(request, 'Private Reporter')
    const issue = await createIssue(request, reporter.session, `Not yours ${Date.now()}`)
    await assignIssue(request, issue.id, otherTech.session.user.id)

    await signIn(page, tech.session, `/technician/issues/${issue.id}`)
    await expect(page.getByText('Issue not found')).toBeVisible()
  })

  test('the reporter sees the technician\'s progress', async ({ page, request }) => {
    const tech = await registerTechnician(request, 'Visible Tech')
    const reporter = await registerUser(request, 'Watching Reporter')
    const title = `Dripping ceiling ${Date.now()}`
    const issue = await createIssue(request, reporter.session, title)
    await assignIssue(request, issue.id, tech.session.user.id)

    await signIn(page, reporter.session, `/issues/${issue.id}`)
    await expect(page.locator('.tag--assigned')).toBeVisible()
    await expect(page.getByRole('list', { name: 'Status' }).locator('.now')).toContainText('Assigned')

    await page.getByRole('button', { name: /Notifications/ }).click()
    await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeVisible()
  })
})
