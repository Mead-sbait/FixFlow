import type { Server } from 'socket.io'
import { setSocketServer } from '../sockets/emitter.js'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Comment, Issue, Notification } from '../models/index.js'
import { createUserIssueComment, getUserIssueComments } from './issue.service.js'

import { createUserCommentSchema } from '../validators/issue.validator.js'

const issueId = '507f1f77bcf86cd799439011'
const reporterId = '507f1f77bcf86cd799439012'

test('invalid issue IDs do not query comments', async t => {
  const find = t.mock.method(Comment, 'find', () => { throw new Error('must not query') })
  assert.equal(await getUserIssueComments(reporterId, 'invalid'), null)
  assert.equal(find.mock.callCount(), 0)
})

test('a reporter cannot read another person’s comments', async t => {
  t.mock.method(Issue, 'exists', async (filter: unknown) => {
    assert.deepEqual(filter, { _id: issueId, reporterId })
    return null
  })
  const find = t.mock.method(Comment, 'find', () => { throw new Error('must not query') })
  assert.equal(await getUserIssueComments(reporterId, issueId), null)
  assert.equal(find.mock.callCount(), 0)
})

test('public comments require ownership and exclude internal notes in the database query', async t => {
  t.mock.method(Issue, 'exists', async (filter: unknown) => {
    assert.deepEqual(filter, { _id: issueId, reporterId })
    return { _id: issueId }
  })
  t.mock.method(Comment, 'find', (filter: unknown) => {
    assert.deepEqual(filter, { issueId, isInternal: false })
    return {
      populate: (field: string, selected: string) => {
        assert.equal(field, 'userId')
        assert.equal(selected, 'name role')
        return { sort: async () => [{ toJSON: () => ({ id: 'comment', userId: { id: 'tech', name: 'نور', role: 'technician' }, message: 'تم الإصلاح', createdAt: new Date('2026-10-14') }) }] }
      }
    }
  })
  const comments = await getUserIssueComments(reporterId, issueId)
  assert.equal(comments?.[0].message, 'تم الإصلاح')
  assert.equal(comments?.[0].author?.name, 'نور')
  assert.equal(comments?.[0].isInternal, false)
})

test('reporter comments reject internal flags, blank text and excessive length', () => {
  assert.equal(createUserCommentSchema.safeParse({ message: 'reply', isInternal: true }).success, false)
  assert.equal(createUserCommentSchema.safeParse({ message: '  ' }).success, false)
  assert.equal(createUserCommentSchema.safeParse({ message: 'a'.repeat(2001) }).success, false)
  assert.deepEqual(createUserCommentSchema.parse({ message: ' reply ' }), { message: 'reply' })
})
test('a reporter cannot post to another person’s issue', async t => {
  t.mock.method(Issue, 'findOne', (filter: unknown) => {
    assert.deepEqual(filter, { _id: issueId, reporterId })
    return { select: async () => null }
  })
  const create = t.mock.method(Comment, 'create', () => { throw new Error('must not save') })
  assert.equal(await createUserIssueComment(reporterId, issueId, 'reply'), null)
  assert.equal(create.mock.callCount(), 0)
})
test('reporter comments always use authenticated author and public visibility', async t => {
  t.mock.method(Issue, 'findOne', () => ({ select: async () => ({ technicianId: null }) }))
  t.mock.method(Comment, 'create', async (input: unknown) => {
    assert.deepEqual(input, { issueId, userId: reporterId, message: 'reply', isInternal: false })
    return { _id: 'comment' }
  })
  t.mock.method(Comment, 'findById', () => ({ populate: async () => ({ toJSON: () => ({ id: 'comment', userId: { id: reporterId, name: 'نور', role: 'user' }, message: 'reply', createdAt: new Date() }) }) }))
  const result = await createUserIssueComment(reporterId, issueId, 'reply')
  assert.equal(result?.author?.id, reporterId)
  assert.equal(result?.isInternal, false)
})


test('a public reporter reply notifies the assigned technician and refreshes both participants', async t => {
  const technicianId = '507f1f77bcf86cd799439013'
  const events: { room: string; event: string; payload: unknown }[] = []
  setSocketServer({ to: (room: string) => ({ emit: (event: string, payload: unknown) => events.push({ room, event, payload }) }) } as unknown as Server)
  t.after(() => setSocketServer(null as unknown as Server))
  t.mock.method(Issue, 'findOne', () => ({ select: async () => ({ technicianId }) }))
  t.mock.method(Comment, 'create', async () => ({ _id: 'comment' }))
  t.mock.method(Comment, 'findById', () => ({ populate: async () => ({ toJSON: () => ({ id: 'comment', userId: { id: reporterId, name: 'نور', role: 'user' }, message: 'reply', createdAt: new Date() }) }) }))
  t.mock.method(Notification, 'create', async (input: unknown) => {
    assert.equal((input as { userId: string }).userId, technicianId)
    return { _id: 'notification', toJSON: () => input }
  })
  await createUserIssueComment(reporterId, issueId, 'reply')
  assert.deepEqual(events.filter(item => item.event === 'comment:added').map(item => item.room).sort(), ['admins', 'user:' + reporterId, 'user:' + technicianId].sort())
  assert.equal(events.some(item => item.room === 'user:' + technicianId && item.event === 'notification:new'), true)
})

test('HTTP routes enforce comment roles and ownership', async t => {
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'fixflow-permission-test-secret'
  const { app } = await import('../app.js')
  const { default: jwt } = await import('jsonwebtoken')
  const { User } = await import('../models/index.js')
  const server = app.listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.once('listening', resolve))
  t.after(async () => {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    if (previousSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousSecret
  })
  const address = server.address() as { port: number }
  const base = 'http://127.0.0.1:' + address.port + '/api'
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: reporterId, expiresIn: '1h' })
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
  let role = 'user'
  t.mock.method(User, 'findById', () => ({ select: async () => ({ role }) }))
  t.mock.method(Issue, 'exists', async () => null)
  t.mock.method(Issue, 'findOne', () => ({ select: async () => null }))
  const create = t.mock.method(Comment, 'create', () => { throw new Error('unauthorized write') })
  assert.equal((await fetch(base + '/issues/' + issueId + '/comments')).status, 401)
  assert.equal((await fetch(base + '/admin/issues/' + issueId + '/comments', { headers })).status, 403)
  assert.equal((await fetch(base + '/issues/' + issueId + '/comments', { headers })).status, 404)
  assert.equal((await fetch(base + '/issues/' + issueId + '/comments', { method: 'POST', headers, body: JSON.stringify({ message: 'reply' }) })).status, 404)
  role = 'admin'
  assert.equal((await fetch(base + '/issues/' + issueId + '/comments', { method: 'POST', headers, body: JSON.stringify({ message: 'reply' }) })).status, 403)
  assert.equal((await fetch(base + '/technician/issues/' + issueId + '/comments', { method: 'POST', headers, body: JSON.stringify({ message: 'reply' }) })).status, 403)
  assert.equal((await fetch(base + '/admin/issues/' + issueId + '/comments', { method: 'POST', headers, body: JSON.stringify({ message: 'reply' }) })).status, 404)
  assert.equal(create.mock.callCount(), 0)
})
