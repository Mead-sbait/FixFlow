import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Types } from 'mongoose'
import { User, Issue, Comment, IssueStatusHistory, Notification } from './index.js'

test('user JSON uses string IDs and never includes password hashes', () => {
  const user = new User({ name: 'Test', email: ' TEST@example.com ', passwordHash: 'hashed-test-value' })
  assert.equal(user.validateSync(), undefined)
  const json = JSON.parse(JSON.stringify(user))
  assert.equal(json.id, user._id.toString())
  assert.equal(json.email, 'test@example.com')
  assert.equal(json.role, 'user')
  assert.equal('passwordHash' in json, false)
  assert.equal('_id' in json, false)
})

test('issues validate references and enums and default to open and unassigned', () => {
  const issue = new Issue({ title: 'Leak', description: 'Pipe leaking', location: 'Room 1', reporterId: new Types.ObjectId(), categoryId: new Types.ObjectId() })
  assert.equal(issue.validateSync(), undefined)
  assert.equal(issue.status, 'open')
  assert.equal(issue.technicianId, null)
  const invalid = new Issue({ ...issue.toObject(), status: 'invalid', priority: 'invalid', reporterId: 'not-an-object-id' })
  const errors = invalid.validateSync()?.errors
  assert.ok(errors?.status)
  assert.ok(errors?.priority)
  assert.ok(errors?.reporterId)
})

test('comments, history, and notifications require their essential fields', () => {
  for (const document of [new Comment(), new IssueStatusHistory(), new Notification()]) {
    assert.ok(document.validateSync())
  }
  const history = new IssueStatusHistory({ issueId: new Types.ObjectId(), changedBy: new Types.ObjectId(), toStatus: 'open' })
  assert.equal(history.validateSync(), undefined)
  assert.equal(history.fromStatus, null)
})
