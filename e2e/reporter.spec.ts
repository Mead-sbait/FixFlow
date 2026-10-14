import { expect, test } from '@playwright/test'
import { registerUser, signIn } from './helpers'

test.describe('reporting an issue', () => {
  test('a user pins an issue and sees it on their board', async ({ page, request }) => {
    const { session } = await registerUser(request, 'Reporter One')
    const title = `Leaking tap ${Date.now()}`

    await signIn(page, session, '/issues/new')
    await page.getByLabel('What is the problem?').fill(title)
    await page.getByLabel('Where is it?').fill('Building A, floor 2')
    await page.getByRole('button', { name: /Urgent/ }).click()
    await page.getByLabel('Details').fill('Water everywhere since this morning.')
    await page.getByRole('button', { name: 'Pin it on the board' }).click()

    await expect(page).toHaveURL(/\/issues\/[a-f0-9]{24}$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page.getByText('Pinned on the board')).toBeVisible()
    await expect(page.getByRole('list', { name: 'Status' })).toContainText('Reported')
    await expect(page.getByText('Not yet')).toBeVisible()

    await page.getByRole('link', { name: 'My issues' }).first().click()
    await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible()
  })

  test('the form refuses an empty report', async ({ page, request }) => {
    const { session } = await registerUser(request, 'Reporter Two')
    await signIn(page, session, '/issues/new')
    await page.getByRole('button', { name: 'Pin it on the board' }).click()
    await expect(page.getByText('A short title is required.')).toBeVisible()
    await expect(page).toHaveURL(/\/issues\/new$/)
  })

  test('a user only sees their own issues', async ({ page, request }) => {
    const other = await registerUser(request, 'Someone Else')
    const mine = await registerUser(request, 'Only Mine')

    // the other person reports something
    const { createIssue } = await import('./helpers')
    const theirs = await createIssue(request, other.session, `Not mine ${Date.now()}`)

    await signIn(page, mine.session, '/dashboard')
    await expect(page.getByText('Nothing on the board yet')).toBeVisible()
    await page.goto(`/issues/${theirs.id}`)
    await expect(page.getByRole('heading', { name: 'Issue not found' })).toBeVisible()
  })
})
