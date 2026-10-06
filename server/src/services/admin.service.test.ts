import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildIssueFilter, resolveAdminStatus } from './admin.service.js'
import { assignTechnicianSchema, issueListQuerySchema } from '../validators/admin.validator.js'

const techId = '507f1f77bcf86cd799439011'

test('issue list query applies defaults and rejects unknown statuses', () => {
  const parsed = issueListQuerySchema.parse({ status: 'open', page: '2', limit: '10' })
  assert.equal(parsed.page, 2)
  assert.equal(parsed.limit, 10)
  assert.equal(parsed.status, 'open')

  assert.equal(issueListQuerySchema.parse({}).limit, 20)
  assert.equal(issueListQuerySchema.safeParse({ status: 'waiting' }).success, false)
  assert.equal(issueListQuerySchema.safeParse({ technicianId: 'not-an-id' }).success, false)
})

test('issue filter handles unassigned and escapes the search text', () => {
  const filter = buildIssueFilter(issueListQuerySchema.parse({ technicianId: 'unassigned', search: 'Room 2.04' }))
  assert.equal(filter.technicianId, null)

  const or = filter.$or as Array<{ title: RegExp }>
  assert.equal(or.length, 3)
  assert.equal(or[0].title.test('room 2.04 leak'), true)
  assert.equal(or[0].title.test('room 2x04 leak'), false)

  const byTech = buildIssueFilter(issueListQuerySchema.parse({ technicianId: techId, priority: 'urgent' }))
  assert.equal(byTech.technicianId, techId)
  assert.equal(byTech.priority, 'urgent')
  assert.equal('$or' in byTech, false)
})

test('assignment body needs a real technician id', () => {
  assert.equal(assignTechnicianSchema.safeParse({ technicianId: techId }).success, true)
  assert.equal(assignTechnicianSchema.safeParse({ technicianId: 'nora' }).success, false)
  assert.equal(assignTechnicianSchema.safeParse({ technicianId: techId, status: 'completed' }).success, false)
})

test('admin can only cancel active issues and reopen closed ones', () => {
  assert.equal(resolveAdminStatus('open', 'cancelled', false), 'cancelled')
  assert.equal(resolveAdminStatus('in_progress', 'cancelled', true), 'cancelled')
  assert.equal(resolveAdminStatus('completed', 'cancelled', true), null)

  assert.equal(resolveAdminStatus('cancelled', 'open', false), 'open')
  assert.equal(resolveAdminStatus('completed', 'open', true), 'assigned')
  assert.equal(resolveAdminStatus('assigned', 'open', true), null)
})
