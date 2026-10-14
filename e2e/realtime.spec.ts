import { expect, test } from '@playwright/test'
import { adminSession, assignIssue, cleanupTechnicians, createIssue, registerTechnician, registerUser, signIn } from './helpers'

test.afterAll(async ({ request }) => {
  await cleanupTechnicians(request)
})

test.describe('live updates', () => {
  test('a new report appears on the admin board without a reload', async ({ page, request }) => {
    const admin = await adminSession(request)
    const reporter = await registerUser(request, 'Live Reporter')

    await signIn(page, admin, '/admin')
    await expect(page.locator('.column[data-column="unassigned"]')).toBeVisible()

    const title = `Live issue ${Date.now()}`
    await createIssue(request, reporter.session, title)

    // no page.reload() here on purpose, the socket has to bring it in
    await expect(page.locator('.column[data-column="unassigned"] .strip', { hasText: title })).toBeVisible({ timeout: 10_000 })
  })

  test('a technician sees an assignment land in their column live', async ({ page, request }) => {
    const tech = await registerTechnician(request, 'Live Tech')
    const reporter = await registerUser(request, 'Live Reporter 2')
    const title = `Live job ${Date.now()}`
    const issue = await createIssue(request, reporter.session, title)

    await signIn(page, tech.session, '/technician')
    await expect(page.getByText("لا مهام بانتظارك")).toBeVisible()

    await assignIssue(request, issue.id, tech.session.user.id)
    await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /الإشعارات، 1 غير مقروءة/ })).toBeVisible({ timeout: 10_000 })
  })
})
