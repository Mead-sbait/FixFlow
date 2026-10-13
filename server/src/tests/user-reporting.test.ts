import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Request, Response } from 'express'
import { Types } from 'mongoose'
import { Category, Issue, User } from '../models/index.js'
import { createIssue, getIssueCategories, getUserIssueById, getUserIssues } from '../services/issue.service.js'
import { createUserIssue, getUserIssue, listIssueCategories, listUserIssues } from '../controllers/issue.controller.js'
import { requireUser } from '../middleware/user.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { createIssueSchema } from '../validators/issue.validator.js'
import { loginSchema, registerSchema } from '../validators/auth.validator.js'

const ownerId = '111111111111111111111111'
const otherId = '222222222222222222222222'
const issueId = '333333333333333333333333'
const categoryId = '444444444444444444444444'
const input = {
  title: 'Broken light', description: 'Light does not turn on', location: 'Room 204',
  categoryId, priority: 'medium' as const,
}

function response(userId?: string) {
  const captured: { status: number; body: unknown } = { status: 200, body: undefined }
  const res = {
    locals: userId ? { auth: { userId } } : {},
    status(code: number) { captured.status = code; return this },
    json(body: unknown) { captured.body = body; return this },
  } as unknown as Response
  return { res, captured }
}

test('issue validation trims fields and defaults priority', () => {
  const { priority: _priority, ...fields } = input
  void _priority
  const result = createIssueSchema.parse({ ...fields, title: '  Broken light  ' })
  assert.equal(result.title, 'Broken light')
  assert.equal(result.priority, 'medium')
})

test('issue validation rejects incomplete, overlong, invalid and privileged fields', () => {
  for (const field of ['title', 'description', 'location', 'categoryId'] as const) {
    assert.equal(createIssueSchema.safeParse({ ...input, [field]: undefined }).success, false)
    assert.equal(createIssueSchema.safeParse({ ...input, [field]: '   ' }).success, false)
  }
  for (const change of [
    { title: 'x'.repeat(201) }, { description: 'x'.repeat(5001) }, { location: 'x'.repeat(201) },
    { categoryId: 'invalid' }, { priority: 'critical' }, { status: 'completed' },
    { reporterId: otherId }, { technicianId: otherId },
  ]) assert.equal(createIssueSchema.safeParse({ ...input, ...change }).success, false)
})

test('registration normalizes email and rejects role injection and invalid passwords', () => {
  const valid = { name: '  Test  ', email: ' TEST@example.com ', password: 'TestPass123!' }
  const result = registerSchema.parse(valid)
  assert.equal(result.name, 'Test')
  assert.equal(result.email, 'test@example.com')
  for (const change of [{ role: 'admin' }, { name: ' ' }, { email: 'invalid' },
    { password: 'short' }, { password: 'ع'.repeat(37) }]) {
    assert.equal(registerSchema.safeParse({ ...valid, ...change }).success, false)
  }
  assert.equal(loginSchema.safeParse({ email: 'test@example.com', password: 'short' }).success, false)
})

test('categories expose only string id and name, ordered by name', async (t) => {
  t.mock.method(Category, 'find', () => ({ select(fields: string) {
    assert.equal(fields, '_id name')
    return { async sort(order: unknown) {
      assert.deepEqual(order, { name: 1 })
      return [{ _id: new Types.ObjectId(categoryId), name: 'Electrical', secret: 'hidden' }]
    } }
  } }))
  assert.deepEqual(await getIssueCategories(), [{ id: categoryId, name: 'Electrical' }])
})

test('category endpoint returns an empty array when no categories exist', async (t) => {
  t.mock.method(Category, 'find', () => ({ select: () => ({ sort: async () => [] }) }))
  const { res, captured } = response(ownerId)
  await listIssueCategories({} as Request, res)
  assert.equal(captured.status, 200)
  assert.deepEqual(captured.body, [])
})

test('category endpoint handles database errors without exposing details', async (t) => {
  t.mock.method(Category, 'find', () => { throw new Error('private database details') })
  const { res, captured } = response(ownerId)
  await listIssueCategories({} as Request, res)
  assert.equal(captured.status, 500)
  assert.deepEqual(captured.body, { error: 'Unable to load categories', code: 'INTERNAL_ERROR' })
})

test('issue list filters by authenticated reporter and sorts newest first', async (t) => {
  t.mock.method(Issue, 'find', (filter: unknown) => {
    assert.deepEqual(filter, { reporterId: ownerId })
    return { async sort(order: unknown) {
      assert.deepEqual(order, { createdAt: -1, _id: -1 })
      return [{ toJSON: () => ({ id: issueId, title: input.title }) }]
    } }
  })
  assert.deepEqual(await getUserIssues(ownerId), [{ id: issueId, title: input.title }])
})

test('issue-list controller ignores a requested reporter override', async (t) => {
  t.mock.method(Issue, 'find', (filter: unknown) => {
    assert.deepEqual(filter, { reporterId: ownerId })
    return { sort: async () => [] }
  })
  const { res, captured } = response(ownerId)
  await listUserIssues({ query: { reporterId: otherId } } as unknown as Request, res)
  assert.equal(captured.status, 200)
  assert.deepEqual(captured.body, [])
})

test('issue detail lookup includes both issue id and reporter id', async (t) => {
  t.mock.method(Issue, 'findOne', async (filter: unknown) => {
    assert.deepEqual(filter, { _id: issueId, reporterId: ownerId })
    return { toJSON: () => ({ id: issueId, title: input.title }) }
  })
  assert.deepEqual(await getUserIssueById(ownerId, issueId), { id: issueId, title: input.title })
})

test('malformed issue id returns null without querying the database', async (t) => {
  const find = t.mock.method(Issue, 'findOne', () => { throw new Error('must not query') })
  assert.equal(await getUserIssueById(ownerId, 'not-an-id'), null)
  assert.equal(find.mock.callCount(), 0)
})

test('another reporter receives 404 when the scoped issue lookup finds no match', async (t) => {
  t.mock.method(Issue, 'findOne', async (filter: unknown) => {
    assert.deepEqual(filter, { _id: issueId, reporterId: otherId })
    return null
  })
  const { res, captured } = response(otherId)
  await getUserIssue({ params: { id: issueId } } as Request<{ id: string }>, res)
  assert.equal(captured.status, 404)
  assert.deepEqual(captured.body, { error: 'Issue not found', code: 'NOT_FOUND' })
})

test('issue creation rejects a missing category without creating a document', async (t) => {
  t.mock.method(Category, 'findById', () => ({ select: async () => null }))
  const create = t.mock.method(Issue, 'create', () => { throw new Error('must not create') })
  assert.deepEqual(await createIssue(ownerId, input), { type: 'invalid_category' })
  assert.equal(create.mock.callCount(), 0)
})

test('issue creation uses authenticated ownership and sets status to open', async (t) => {
  const categoryObjectId = new Types.ObjectId(categoryId)
  t.mock.method(Category, 'findById', (id: string) => {
    assert.equal(id, categoryId)
    return { select: async () => ({ _id: categoryObjectId }) }
  })
  t.mock.method(Issue, 'create', async (fields: unknown) => {
    assert.deepEqual(fields, { ...input, categoryId: categoryObjectId, reporterId: ownerId, status: 'open' })
    return { toJSON: () => ({ id: issueId, ...input, reporterId: ownerId, status: 'open' }) }
  })
  const { res, captured } = response(ownerId)
  await createUserIssue({ body: input } as Request, res)
  assert.equal(captured.status, 201)
  assert.equal((captured.body as { reporterId: string }).reporterId, ownerId)
})

test('incomplete creation payload returns 400 without database access', async (t) => {
  const find = t.mock.method(Category, 'findById', () => { throw new Error('must not query') })
  const { res, captured } = response(ownerId)
  await createUserIssue({ body: {} } as Request, res)
  assert.equal(captured.status, 400)
  assert.equal(find.mock.callCount(), 0)
})

test('missing bearer token is rejected before protected route handlers', () => {
  const { res, captured } = response()
  let nextCalled = false
  requireAuth({ get: () => undefined } as unknown as Request, res, () => { nextCalled = true })
  assert.equal(captured.status, 401)
  assert.equal(nextCalled, false)
})

test('user middleware rejects admin and technician accounts', async (t) => {
  for (const role of ['admin', 'technician']) {
    const lookup = t.mock.method(User, 'findById', () => ({ select: async () => ({ role }) }))
    const { res, captured } = response(ownerId)
    let nextCalled = false
    await requireUser({} as Request, res, () => { nextCalled = true })
    assert.equal(captured.status, 403)
    assert.equal(nextCalled, false)
    lookup.mock.restore()
  }
})

test('user middleware permits a current user account', async (t) => {
  t.mock.method(User, 'findById', () => ({ select: async () => ({ role: 'user' }) }))
  const { res } = response(ownerId)
  let nextCalled = false
  await requireUser({} as Request, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
})
