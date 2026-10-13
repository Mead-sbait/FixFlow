import type { Server } from 'socket.io'

// same event names and payload shapes as the technician branch, so both sides share one emitter
type SocketEvents = {
  'issue:created': { issueId: string }
  'issue:assigned': { issueId: string }
  'issue:updated': { issueId: string }
  'comment:added': { issueId: string }
  'notification:new': { notificationId: string }
}

let io: Server | null = null

export function setSocketServer(server: Server) {
  io = server
}

export function emitToUser<Event extends keyof SocketEvents>(userId: string, event: Event, payload: SocketEvents[Event]) {
  io?.to(`user:${userId}`).emit(event, payload)
}

export function emitToAdmins<Event extends keyof SocketEvents>(event: Event, payload: SocketEvents[Event]) {
  io?.to('admins').emit(event, payload)
}

// called when an admin changes someone's role, so open connections follow the new role right away
export function syncRoleRooms(userId: string, role: string) {
  if (!io) return

  if (role === 'admin') {
    io.in(`user:${userId}`).socketsJoin('admins')
  } else {
    io.in(`user:${userId}`).socketsLeave('admins')
  }
}
