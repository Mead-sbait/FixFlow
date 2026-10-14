import { expect, test, type Page } from '@playwright/test'
import { ar } from '../client/src/i18n/ar'
import { he } from '../client/src/i18n/he'

const id = '123456789012345678901234'
const person = { id, name: 'نور نور / נור', email: 'preview@example.test' }
const category = { id: 'category', name: 'Electrical' }
const issue = { id, title: 'تسرب مياه / נזילת מים', description: 'وصف البلاغ الأصلي يبقى كما كتبه المستخدم.', location: 'المبنى أ · קומה 2', status: 'assigned', priority: 'high', categoryId: category.id, category, reporter: person, technician: person, technicianId: id, reporterId: id, createdAt: '2026-10-14T09:00:00Z', updatedAt: '2026-10-14T10:00:00Z' }
const notice = { id, type: 'issue_assigned', message: `You have been assigned to "${issue.title}"`, isRead: false, createdAt: issue.createdAt }
const routes = ['/login', '/register', '/dashboard', '/issues/new', `/issues/${id}`, '/technician', `/technician/issues/${id}`, '/admin', '/admin/issues', `/admin/issues/${id}`, '/admin/users', '/admin/statistics']

async function setup(page: Page, lang: 'ar' | 'he', path: string, empty = false) {
  const role = path.startsWith('/admin') ? 'admin' : path.startsWith('/technician') ? 'technician' : 'user'
  await page.addInitScript(({ lang, role, person, auth }) => {
    localStorage.setItem('fixflow.lang', lang)
    if (auth) localStorage.setItem('fixflow.session', JSON.stringify({ token: 'ui-test', user: { ...person, role } }))
    else localStorage.removeItem('fixflow.session')
  }, { lang, role, person, auth: !['/login', '/register'].includes(path) })
  await page.route('**/api/**', async route => {
    const endpoint = new URL(route.request().url()).pathname.replace('/api', '')
    let body: unknown = []
    if (endpoint === '/auth/login') return route.fulfill({ status: 401, json: { error: 'Invalid email or password' } })
    if (endpoint === '/categories') body = [category]
    else if (endpoint === '/notifications') body = empty ? [] : [notice]
    else if (endpoint.endsWith('/read')) body = { ...notice, isRead: true }
    else if (endpoint === '/admin/technicians') body = [person]
    else if (endpoint === '/admin/users') body = [{ ...person, role: 'technician', createdAt: issue.createdAt }]
    else if (endpoint === '/admin/stats') body = { total: 1, open: 0, assigned: 1, inProgress: 0, completed: 0, cancelled: 0, urgent: 0, unassigned: 0, byCategory: [{ ...category, count: 1 }], byTechnician: [{ ...person, count: 1 }] }
    else if (endpoint === '/admin/issues') body = { items: empty ? [] : [issue], pagination: { page: 1, pages: 1, total: empty ? 0 : 1, limit: 100 } }
    else if (endpoint.endsWith('/comments')) body = []
    else if (endpoint === '/issues' || endpoint === '/technician/issues') body = empty ? [] : [issue]
    else if (endpoint.endsWith(id)) body = issue
    await route.fulfill({ json: body })
  })
  await page.goto(path)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('.skeleton')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
}

for (const lang of ['ar', 'he'] as const) {
  for (const width of [320, 390, 1440]) {
    for (const path of routes) {
      test(`${lang} ${width}px ${path}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await setup(page, lang, path)
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        if (lang === 'ar' && width === 390 && ['/admin', '/dashboard'].includes(path)) await page.screenshot({ path: `work/${path.slice(1)}-phone.png`, fullPage: true })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1)
        await expect(page.getByRole('button', { name: 'English' })).toHaveCount(0)
        if (path === '/login' || path === '/register') {
          const input = page.locator('input[autocomplete$="password"]')
          const toggle = page.locator('.password-control button')
          await input.fill('long-password-1234567890')
          const a = (await input.boundingBox())!, b = (await toggle.boundingBox())!
          expect(b.x + b.width).toBeLessThanOrEqual(a.x + 1)
          await toggle.click()
          await expect(input).toHaveAttribute('type', 'text')
          await expect(input).toHaveValue('long-password-1234567890')
        } else if (width < 720) {
          for (const label of await page.locator('.frame__nav a span').all()) await expect(label).toBeVisible()
        }
      })
    }
  }
  test(`${lang}: notifications, category and error messages follow language changes`, async ({ page }) => {
    const dict = lang === 'ar' ? ar : he
    await setup(page, lang, '/dashboard')
    await expect(page.getByText(dict['category.electrical'], { exact: true })).toBeVisible()
    await page.locator('.notif > button').click()
    await expect(page.getByRole('dialog')).toContainText(dict['notif.assigned'])
    const next = lang === 'ar' ? he : ar
    await page.getByRole('button', { name: lang === 'ar' ? 'עברית' : 'العربية' }).click()
    await page.locator('.notif > button').click()
    await expect(page.getByRole('dialog')).toContainText(next['notif.assigned'])
    await expect(page.getByText(next['category.electrical'], { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
  test(`${lang}: empty dashboard and reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setup(page, lang, '/dashboard', true)
    await expect(page.locator('.empty h3')).toHaveText((lang === 'ar' ? ar : he)['mine.emptyTitle'])
    expect(await page.locator('.ambient i').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  })
}

test('login errors update after switching languages', async ({ page }) => {
  await setup(page, 'ar', '/login')
  await page.getByLabel(ar['login.email']).fill('user@example.test')
  await page.getByLabel(ar['login.password']).fill('wrong-password')
  await page.getByRole('button', { name: ar['login.submit'], exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText(ar['login.failed'])
  await page.getByRole('button', { name: 'עברית' }).click()
  await expect(page.getByRole('alert')).toHaveText(he['login.failed'])
})

test('login, report submission and the success notice work across language changes', async ({ page }) => {
  await setup(page, 'ar', '/login')
  await page.route('**/api/auth/login', route => route.fulfill({ json: { accessToken: 'ui-test', user: { ...person, role: 'user' } } }))
  await page.getByLabel(ar['login.email']).fill('user@example.test')
  await page.getByLabel(ar['login.password']).fill('test-password')
  await page.getByRole('button', { name: ar['login.submit'], exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.getByRole('link', { name: ar['mine.report'], exact: true }).click()
  await page.getByLabel(ar['report.what']).fill('مكيف لا يعمل')
  await page.getByLabel(ar['report.where']).fill('غرفة 204')
  await page.getByLabel(ar['report.details']).fill('توقف المكيف عن التبريد')
  let submitted: Record<string, string> | undefined
  await page.route('**/api/issues', async route => {
    submitted = route.request().postDataJSON()
    await route.fulfill({ json: { ...issue, ...submitted } })
  })
  await page.getByRole('button', { name: ar['report.submit'] }).click()
  await expect(page).toHaveURL(new RegExp(`/issues/${id}$`))
  expect(submitted).toMatchObject({ title: 'مكيف لا يعمل', location: 'غرفة 204', categoryId: 'category' })
  await expect(page.locator('.notice--success')).toHaveText(ar['report.pinned'])
  await page.getByRole('button', { name: 'עברית' }).click()
  await expect(page.locator('.notice--success')).toHaveText(he['report.pinned'])
})

test('registration validation blocks malformed email and short password', async ({ page }) => {
  await setup(page, 'ar', '/register')
  await page.getByLabel(ar['register.name']).fill('نور')
  await page.getByLabel(ar['login.email']).fill('invalid-email')
  await page.getByLabel(ar['login.password']).fill('short')
  await expect(page.getByRole('button', { name: ar['register.submit'], exact: true })).toBeDisabled()
  await page.getByLabel(ar['login.password']).fill('long-password')
  await page.getByRole('button', { name: ar['register.submit'], exact: true }).click()
  expect(await page.locator('input[type=email]').evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true)
  await expect(page).toHaveURL(/\/register$/)
})

for (const lang of ['ar', 'he'] as const) {
  test(`${lang}: assignment selector follows drag and reassignment`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await setup(page, lang, '/admin')
    const second = { ...person, id: '223456789012345678901234', name: 'الفني الثاني / טכנאי שני' }
    let current = { ...issue, status: 'open', technician: null as typeof person | null }
    await page.route('**/api/admin/technicians', route => route.fulfill({ json: [person, second] }))
    await page.route('**/api/admin/issues?*', route => route.fulfill({ json: { items: [current], pagination: { page: 1, pages: 1, total: 1, limit: 100 } } }))
    await page.route('**/api/admin/issues/*/assign', async route => {
      const target = route.request().postDataJSON().technicianId
      current = { ...current, status: 'assigned', technician: target === person.id ? person : second }
      await route.fulfill({ json: current })
    })
    await page.reload()
    const source = page.locator('.column[data-column="unassigned"] .strip')
    const destination = page.locator(`.column[data-column="${person.id}"]`)
    await expect(source).toBeVisible()
    await source.dragTo(destination.locator('.column__body'))
    await expect(destination.locator('.strip')).toBeVisible()
    const label = (lang === 'ar' ? ar : he)['board.moveLabel'].replace('{title}', issue.title)
    await expect(destination.getByLabel(label)).toHaveValue(person.id)
    await expect(destination.getByLabel(label).locator('option:checked')).toHaveText(person.name)
    await destination.getByLabel(label).selectOption(second.id)
    const reassigned = page.locator(`.column[data-column="${second.id}"]`)
    await expect(reassigned.getByLabel(label)).toHaveValue(second.id)
    await expect(reassigned.getByLabel(label).locator('option:checked')).toHaveText(second.name)
    await expect(destination.locator('.strip')).toHaveCount(0)
  })
}

test('the reporter reads public comments and receives comment refreshes', async ({ page }) => {
  await setup(page, 'ar', `/issues/${id}`)
  const comment = { id: 'public', issueId: id, author: { ...person, role: 'technician' }, message: 'تم طلب قطعة الغيار', isInternal: false, createdAt: issue.createdAt }
  let comments = [comment, { ...comment, id: 'internal', message: 'ملاحظة داخلية سرية', isInternal: true }]
  await page.route('**/api/issues/*/comments', route => route.fulfill({ json: comments }))
  await page.reload()
  await expect(page.getByText(comment.message, { exact: true })).toBeVisible()
  await expect(page.getByText('ملاحظة داخلية سرية')).toHaveCount(0)
  await expect(page.locator('.comment-form')).toBeVisible()
  await expect(page.locator('.comment-form input[type=checkbox]')).toHaveCount(0)
  comments = [...comments, { ...comment, id: 'second', message: 'وصلت القطعة وتم إصلاح العطل' }]
  // Exercise the same Redux event dispatched by the Socket.IO comment:added listener.
  await page.evaluate(async issueId => {
    const storeUrl = performance.getEntriesByType('resource').map(entry => entry.name).find(url => new URL(url).pathname === '/src/app/store.ts')!
    const { store } = await import(storeUrl)
    store.dispatch({ type: 'technician/commentEventReceived', payload: issueId })
  }, id)
  await expect(page.getByText('وصلت القطعة وتم إصلاح العطل')).toBeVisible()
  await expect(page.getByText('ملاحظة داخلية سرية')).toHaveCount(0)
})

for (const lang of ['ar', 'he'] as const) {
  test(`${lang}: reporter submits own public comment`, async ({ page }) => {
    const dict = lang === 'ar' ? ar : he
    await setup(page, lang, `/issues/${id}`)
    let body: unknown
    await page.route('**/api/issues/*/comments', async route => {
      if (route.request().method() === 'POST') {
        body = route.request().postDataJSON()
        return route.fulfill({ status: 201, json: { id: 'reply', issueId: id, author: { ...person, role: 'user' }, message: 'شكرًا لكم / תודה', isInternal: false, createdAt: issue.createdAt } })
      }
      return route.fulfill({ json: [] })
    })
    await page.getByLabel(dict['comments.add']).fill('شكرًا لكم / תודה')
    await page.getByRole('button', { name: dict['comments.submit'], exact: true }).click()
    await expect(page.locator('.comment')).toHaveCount(1)
    await expect(page.locator('.comment')).toContainText('شكرًا لكم / תודה')
    await expect(page.getByLabel(dict['comments.add'])).toHaveValue('')
    expect(body).toEqual({ message: 'شكرًا لكم / תודה' })
  })
  test(`${lang}: admin reads comments and closes issue without commenting`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const dict = lang === 'ar' ? ar : he
    await setup(page, lang, '/admin/issues')
    await page.route('**/api/admin/issues/*/comments', route => route.fulfill({ json: [{ id: 'comment', issueId: id, author: { ...person, role: 'user' }, message: 'يرجى المتابعة', isInternal: false, createdAt: issue.createdAt }] }))
    await page.getByRole('link', { name: issue.title }).click()
    await expect(page.getByText('يرجى المتابعة')).toBeVisible()
    await expect(page.locator('.comment-form')).toHaveCount(0)
    let body: unknown
    await page.route('**/api/admin/issues/*/status', async route => { body = route.request().postDataJSON(); await route.fulfill({ json: { ...issue, status: 'completed' } }) })
    page.on('dialog', () => { throw new Error('Native browser dialog must not open') })
    const open = page.getByRole('button', { name: dict['issue.close'], exact: true })
    await open.click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await page.screenshot({ path: `work/confirm-${lang}-phone.png` })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    await modal.getByRole('button', { name: dict['common.cancel'], exact: true }).click()
    await expect(modal).not.toBeVisible()
    expect(body).toBeUndefined()
    await expect(open).toBeFocused()
    await open.click()
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
    await open.click()
    await modal.getByRole('button', { name: dict['issue.close'], exact: true }).click()
    await expect(modal).not.toBeVisible()
    await expect(page.getByRole('button', { name: dict['board.reopen'] })).toBeVisible()
    expect(body).toEqual({ status: 'completed' })
  })
  test(`${lang}: select alignment and visible mobile background motion`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setup(page, lang, '/admin')
    const selects = page.locator('.board-tray .select')
    for (const select of await selects.all()) {
      const styles = await select.evaluate(el => ({ align: getComputedStyle(el).alignItems, height: el.getBoundingClientRect().height, lineHeight: getComputedStyle(el).lineHeight }))
      expect(styles.align).toBe('center')
      expect(styles.height).toBe(48)
    }
    const icon = page.locator('.ambient > svg').first()
    await expect(icon).toBeVisible()
    const before = await icon.evaluate(el => getComputedStyle(el).transform)
    await expect.poll(() => icon.evaluate(el => getComputedStyle(el).transform)).not.toBe(before)
    await page.screenshot({ path: `work/selects-${lang}-phone.png`, fullPage: true })
  })
}


test('admin comment view refreshes after reconnect invalidation', async ({ page }) => {
  await setup(page, 'ar', `/admin/issues/${id}`)
  await page.route('**/api/admin/issues/*/comments', route => route.fulfill({ json: [{ id: 'reconnected', issueId: id, author: { ...person, role: 'user' }, message: 'تعليق أثناء انقطاع الاتصال', isInternal: false, createdAt: issue.createdAt }] }))
  await page.evaluate(async () => {
    const storeUrl = performance.getEntriesByType('resource').map(entry => entry.name).find(url => new URL(url).pathname === '/src/app/store.ts')!
    const { store } = await import(storeUrl)
    store.dispatch({ type: 'technician/commentEventReceived', payload: '*' })
  })
  await expect(page.getByText('تعليق أثناء انقطاع الاتصال')).toBeVisible()
  await expect(page.locator('.comment-form')).toHaveCount(0)
})

test('an open confirmation keeps its original action when the issue changes remotely', async ({ page }) => {
  await setup(page, 'ar', `/admin/issues/${id}`)
  await page.getByRole('button', { name: ar['issue.close'], exact: true }).click()
  await page.route('**/api/admin/issues/' + id, route => route.fulfill({ json: { ...issue, status: 'completed' } }))
  await page.evaluate(async () => {
    const storeUrl = performance.getEntriesByType('resource').map(entry => entry.name).find(url => new URL(url).pathname === '/src/app/store.ts')!
    const { store } = await import(storeUrl)
    const state = store.getState()
    store.dispatch({ type: 'admin/fetchIssues/pending', meta: { requestId: 'remote-test' } })
    store.dispatch({ type: 'admin/fetchIssues/fulfilled', meta: { requestId: 'remote-test' }, payload: { items: [...state.admin.issues], pagination: state.admin.pagination } })
  })
  await expect(page.locator('.page__head .tag')).toHaveText(ar['status.completed'])
  let body: unknown
  await page.route('**/api/admin/issues/*/status', async route => {
    body = route.request().postDataJSON()
    await route.fulfill({ status: 409, json: { error: 'Invalid status transition' } })
  })
  const modal = page.getByRole('dialog')
  await modal.getByRole('button', { name: ar['issue.close'], exact: true }).click()
  expect(body).toEqual({ status: 'completed' })
  await expect(modal.getByRole('alert')).toBeVisible()
  await expect(modal).toBeVisible()
})

test('a delayed comments read cannot erase a newly submitted reply', async ({ page }) => {
  await setup(page, 'ar', `/issues/${id}`)
  let releaseRead!: () => void
  const delayed = new Promise<void>(resolve => { releaseRead = resolve })
  let readStarted!: () => void
  const started = new Promise<void>(resolve => { readStarted = resolve })
  await page.route('**/api/issues/*/comments', async route => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 201, json: { id: 'saved-reply', issueId: id, author: { ...person, role: 'user' }, message: 'رد جديد محفوظ', isInternal: false, createdAt: issue.createdAt } })
    readStarted()
    await delayed
    return route.fulfill({ json: [] })
  })
  await page.evaluate(async () => {
    const storeUrl = performance.getEntriesByType('resource').map(entry => entry.name).find(url => new URL(url).pathname === '/src/app/store.ts')!
    const { store } = await import(storeUrl)
    store.dispatch({ type: 'technician/commentEventReceived', payload: '*' })
  })
  await started
  await page.getByLabel(ar['comments.add']).fill('رد جديد محفوظ')
  await page.getByRole('button', { name: ar['comments.submit'], exact: true }).click()
  await expect(page.getByText('رد جديد محفوظ', { exact: true })).toBeVisible()
  const response = page.waitForResponse(res => res.url().endsWith('/comments') && res.request().method() === 'GET')
  releaseRead()
  await response
  await expect(page.locator('.loading')).toHaveCount(0)
  await expect(page.getByText('رد جديد محفوظ', { exact: true })).toBeVisible()
})
