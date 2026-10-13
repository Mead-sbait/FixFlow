import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Server } from 'socket.io'
import { emitToUser, setSocketServer, syncRoleRooms, userRoom } from './emitter.js'

const userId = '507f1f77bcf86cd799439011'

// minimal stand-in for the socket.io server that just records what was called
function fakeServer() {
  const calls: string[] = []
  const server = {
    to: (room: string) => ({ emit: (event: string) => calls.push(`to ${room} emit ${event}`) }),
    in: (room: string) => ({
      socketsJoin: (target: string) => calls.push(`in ${room} join ${target}`),
      socketsLeave: (target: string) => calls.push(`in ${room} leave ${target}`),
    }),
  }
  return { calls, server: server as unknown as Server }
}

test('room names are the same for upper and lower case spellings of an id', () => {
  assert.equal(userRoom(userId.toUpperCase()), userRoom(userId))
  assert.equal(userRoom(userId), `user:${userId}`)
})

test('demoting an admin with an uppercase id still removes them from the admins room', () => {
  const { calls, server } = fakeServer()
  setSocketServer(server)

  syncRoleRooms(userId.toUpperCase(), 'user')
  assert.deepEqual(calls, [`in user:${userId} leave admins`])

  syncRoleRooms(userId, 'admin')
  assert.equal(calls[1], `in user:${userId} join admins`)
})

test('events for a user go to their private room', () => {
  const { calls, server } = fakeServer()
  setSocketServer(server)

  emitToUser(userId.toUpperCase(), 'notification:new', { notificationId: 'n1' })
  assert.deepEqual(calls, [`to user:${userId} emit notification:new`])
})
