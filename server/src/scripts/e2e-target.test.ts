import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cleanupAllowed } from './e2e-target.js'

test('e2e cleanup runs against local databases', () => {
  assert.equal(cleanupAllowed('mongodb://127.0.0.1:27017/fixflow', {}).ok, true)
  assert.equal(cleanupAllowed('mongodb://localhost:27017/fixflow?replicaSet=rs0', {}).ok, true)
})

test('e2e cleanup runs against remote databases only when they are named as test databases', () => {
  assert.equal(cleanupAllowed('mongodb+srv://user:pw@cluster0.example.net/fixflow-e2e', {}).ok, true)
  assert.equal(cleanupAllowed('mongodb+srv://user:pw@cluster0.example.net/fixflow_test', {}).ok, true)
  assert.equal(cleanupAllowed('mongodb+srv://user:pw@cluster0.example.net/fixflow', {}).ok, false)
})

test('e2e cleanup never runs in production, whatever the database is called', () => {
  assert.equal(cleanupAllowed('mongodb://127.0.0.1:27017/fixflow-test', { NODE_ENV: 'production' }).ok, false)
  assert.equal(cleanupAllowed('mongodb://127.0.0.1:27017/fixflow', { NODE_ENV: 'production', ALLOW_E2E_CLEANUP: 'yes' }).ok, false)
})

test('e2e cleanup can be forced on a remote database on purpose', () => {
  assert.equal(cleanupAllowed('mongodb+srv://user:pw@cluster0.example.net/fixflow', { ALLOW_E2E_CLEANUP: 'yes' }).ok, true)
})

test('e2e cleanup refuses a uri it cannot read', () => {
  assert.equal(cleanupAllowed('not a uri', {}).ok, false)
})
