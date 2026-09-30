import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError } from '../lib/errors.js'
import { buildIssueFilter, parseAdminIssueQuery } from './admin.js'

test('parses pagination and accepted admin filters', () => {
  const query = parseAdminIssueQuery({ status: 'open', priority: 'urgent', page: '2', limit: '10', search: 'boiler' })
  assert.equal(query.page, 2)
  assert.equal(query.limit, 10)
  assert.equal(query.status, 'open')
  assert.equal(query.priority, 'urgent')
})

test('builds an unassigned issue filter and escapes search input', () => {
  const query = parseAdminIssueQuery({ technicianId: 'unassigned', search: 'Room 2.04' })
  const filter = buildIssueFilter(query)

  assert.equal(filter.technicianId, null)
  assert.ok(Array.isArray(filter.$or))
  assert.equal(String((filter.$or as Array<{ title: RegExp }>)[0].title), '/Room 2\\.04/i')
})

test('rejects unsupported statuses before querying MongoDB', () => {
  assert.throws(
    () => parseAdminIssueQuery({ status: 'waiting' }),
    (error) => error instanceof ApiError && error.code === 'VALIDATION_ERROR'
  )
})
