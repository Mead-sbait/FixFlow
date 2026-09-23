import assert from 'node:assert/strict'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import { ApiError } from '../lib/errors.js'
import { decodeAdminSession } from './auth.js'

const secret = 'test-only-secret'
const adminId = '507f1f77bcf86cd799439011'

test('accepts a valid administrator token', () => {
  const token = jwt.sign({ role: 'admin' }, secret, { subject: adminId })
  assert.deepEqual(decodeAdminSession(`Bearer ${token}`, secret), { userId: adminId, role: 'admin' })
})

test('rejects a technician token on admin routes', () => {
  const token = jwt.sign({ role: 'technician' }, secret, { subject: '507f1f77bcf86cd799439012' })
  assert.throws(
    () => decodeAdminSession(`Bearer ${token}`, secret),
    (error) => error instanceof ApiError && error.status === 403 && error.code === 'FORBIDDEN'
  )
})

test('rejects a missing bearer token', () => {
  assert.throws(
    () => decodeAdminSession(undefined, secret),
    (error) => error instanceof ApiError && error.status === 401
  )
})

test('rejects a token whose subject is not a MongoDB user id', () => {
  const token = jwt.sign({ role: 'admin' }, secret, { subject: 'admin-12' })
  assert.throws(
    () => decodeAdminSession(`Bearer ${token}`, secret),
    (error) => error instanceof ApiError && error.status === 401
  )
})
