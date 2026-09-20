import type { Server } from 'socket.io'

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.on('disconnect', () => undefined)
  })
}

