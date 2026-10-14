import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test'

export const API = process.env.E2E_API ?? 'http://localhost:3000/api'

export type Session = { token: string; user: { id: string; name: string; email: string; role: string } }

let counter = 0
// every test gets its own accounts, so tests never step on each other or on the seeded demo data
export function uniqueEmail(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}@e2e.local`
}

export const PASSWORD = 'password123'

export async function login(request: APIRequestContext, email: string, password: string): Promise<Session> {
  const response = await request.post(`${API}/auth/login`, { data: { email, password } })
  expect(response.ok(), `login ${email}`).toBeTruthy()
  const data = await response.json()
  return { token: data.accessToken, user: data.user }
}

export async function adminSession(request: APIRequestContext) {
  return login(request, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!)
}

export async function registerUser(request: APIRequestContext, name: string, prefix = 'user') {
  const email = uniqueEmail(prefix)
  const response = await request.post(`${API}/auth/register`, { data: { name, email, password: PASSWORD } })
  expect(response.ok(), 'register').toBeTruthy()
  return { email, session: await login(request, email, PASSWORD) }
}

// technicians created by the tests, demoted again afterwards so the board does not fill up with columns
const createdTechnicians: string[] = []

// a technician is a registered user that the admin promoted
export async function registerTechnician(request: APIRequestContext, name: string) {
  const admin = await adminSession(request)
  const created = await registerUser(request, name, 'tech')
  const response = await request.patch(`${API}/admin/users/${created.session.user.id}/role`, {
    headers: { Authorization: `Bearer ${admin.token}` },
    data: { role: 'technician' },
  })
  expect(response.ok(), 'promote to technician').toBeTruthy()
  createdTechnicians.push(created.session.user.id)
  return { email: created.email, session: await login(request, created.email, PASSWORD) }
}

// for technicians promoted some other way (for example through the people page)
export function trackTechnician(userId: string) {
  createdTechnicians.push(userId)
}

// html5 drag and drop needs a real sequence of mouse moves before chrome starts the drag
export async function dragStrip(page: Page, strip: Locator, target: Locator) {
  const from = await strip.boundingBox()
  const to = await target.boundingBox()
  if (!from || !to) throw new Error('strip or target not on screen')
  await page.mouse.move(from.x + from.width / 2, from.y + 20)
  await page.mouse.down()
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + 30, { steps: 5 })
  await page.mouse.move(to.x + to.width / 2, to.y + 40, { steps: 15 })
  await page.mouse.move(to.x + to.width / 2, to.y + 50, { steps: 5 })
  await page.mouse.up()
}

// call from test.afterAll in every spec that uses registerTechnician
export async function cleanupTechnicians(request: APIRequestContext) {
  if (createdTechnicians.length === 0) return
  const admin = await adminSession(request)
  for (const id of createdTechnicians.splice(0)) {
    await request.patch(`${API}/admin/users/${id}/role`, {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: { role: 'user' },
    })
  }
}

export async function firstCategoryId(request: APIRequestContext, session: Session) {
  const response = await request.get(`${API}/categories`, { headers: { Authorization: `Bearer ${session.token}` } })
  expect(response.ok()).toBeTruthy()
  const list = await response.json()
  return list[0].id as string
}

export async function createIssue(request: APIRequestContext, session: Session, title: string, extra: Record<string, string> = {}) {
  const categoryId = await firstCategoryId(request, session)
  const response = await request.post(`${API}/issues`, {
    headers: { Authorization: `Bearer ${session.token}` },
    data: { title, description: 'Created by the e2e suite.', location: 'Test lab', categoryId, priority: 'medium', ...extra },
  })
  expect(response.ok(), 'create issue').toBeTruthy()
  return (await response.json()) as { id: string; title: string }
}

export async function assignIssue(request: APIRequestContext, issueId: string, technicianId: string) {
  const admin = await adminSession(request)
  const response = await request.patch(`${API}/admin/issues/${issueId}/assign`, {
    headers: { Authorization: `Bearer ${admin.token}` },
    data: { technicianId },
  })
  expect(response.ok(), 'assign').toBeTruthy()
}

// puts a session into localStorage the same way the login page does, then opens a route
export async function signIn(page: Page, session: Session, path = '/', lang = 'en') {
  await page.goto('/login')
  await page.evaluate(([s, l]) => {
    localStorage.setItem('fixflow.session', JSON.stringify(s))
    localStorage.setItem('fixflow.lang', l as string)
  }, [session, lang] as const)
  await page.goto(path)
}

export async function expectNoHorizontalScroll(page: Page) {
  const widths = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, view: window.innerWidth }))
  expect(widths.doc, 'document wider than the viewport').toBeLessThanOrEqual(widths.view + 1)
}
