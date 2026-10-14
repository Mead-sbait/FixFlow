import jwt from 'jsonwebtoken'
import { isValidObjectId } from 'mongoose'
import type { Server } from 'socket.io'
import { env } from '../config/env.js'
import { User } from '../models/index.js'
import { setSocketServer, userRoom } from './emitter.js'

export function registerSocketHandlers(io: Server) {
  setSocketServer(io)

  // Socket authentication
  io.use(async (socket, next) => {
    const token: unknown = socket.handshake.auth?.token

    if (typeof token !== 'string' || !env.jwtSecret) {
      next(new Error('UNAUTHORIZED'))
      return
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] })

      if (typeof payload === 'string' || typeof payload.sub !== 'string' || !isValidObjectId(payload.sub)) {
        next(new Error('UNAUTHORIZED'))
        return
      }

      // the role inside the token can be stale, the database decides which rooms the socket joins
      const user = await User.findById(payload.sub).select('role')

      if (!user) {
        next(new Error('UNAUTHORIZED'))
        return
      }

      socket.data.userId = user._id.toString()
      socket.data.role = user.role
      next()
    } catch {
      next(new Error('UNAUTHORIZED'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string
    const role = socket.data.role as string

    // private room per user, plus a shared room for admins
    socket.join(userRoom(userId))
    if (role === 'admin') {
      socket.join('admins')
    }
  })
}
