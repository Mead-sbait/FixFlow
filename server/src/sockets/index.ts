import jwt from 'jsonwebtoken'
import type { Server, Socket } from 'socket.io'
import { env } from '../config/env.js'

type SocketUser = {
  userId: string
  role: string
}

let io: Server | null = null

function readUser(socket: Socket): SocketUser | null {
  const token = socket.handshake.auth?.token

  if (typeof token !== 'string' || !env.jwtSecret) {
    return null
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] })

    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      return null
    }

    return {
      userId: payload.sub,
      role: typeof payload.role === 'string' ? payload.role : 'user',
    }
  } catch {
    return null
  }
}

export function registerSocketHandlers(server: Server) {
  io = server

  server.use((socket, next) => {
    const user = readUser(socket)

    if (!user) {
      next(new Error('Authentication required'))
      return
    }

    socket.data.user = user
    next()
  })

  server.on('connection', (socket) => {
    const user = socket.data.user as SocketUser

    // each user has a private room, admins also share one so they see everything
    socket.join(`user:${user.userId}`)
    if (user.role === 'admin') {
      socket.join('admins')
    }

    socket.on('disconnect', () => undefined)
  })
}

type IssueEvent = {
  id: string
  reporter: { id: string } | null
  technician: { id: string } | null
}

function roomsFor(issue: IssueEvent) {
  const rooms = ['admins']

  if (issue.reporter) rooms.push(`user:${issue.reporter.id}`)
  if (issue.technician) rooms.push(`user:${issue.technician.id}`)

  return rooms
}

export function emitIssueAssigned(issue: IssueEvent) {
  io?.to(roomsFor(issue)).emit('issue:assigned', issue)
}

export function emitIssueUpdated(issue: IssueEvent) {
  io?.to(roomsFor(issue)).emit('issue:updated', issue)
}
