
import type { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/index.js'
import { setSocketServer } from './emitter.js'

export function registerSocketHandlers(io: Server)
{
      setSocketServer(io)

    // Socket authentication
    io.use(async (socket, next) =>
    {
        const token: unknown = socket.handshake.auth?.token

        if (typeof token !== 'string' || !env.jwtSecret)
        {
            return next(new Error('UNAUTHORIZED'))
        }

        try
        {
            const payload = jwt.verify(token, env.jwtSecret, {
                algorithms: ['HS256'],
            })

            if (
                typeof payload === 'string' ||
                typeof payload.sub !== 'string' ||
                !/^[a-f\d]{24}$/i.test(payload.sub) ||
                typeof payload.exp !== 'number'
            )
            {
                return next(new Error('UNAUTHORIZED'))
            }

            // Verify that the user still exists
            const user = await User.exists({
                _id: payload.sub,
            })

            if (!user)
            {
                return next(new Error('UNAUTHORIZED'))
            }

            socket.data.userId = payload.sub

            next()
        }
        catch
        {
            next(new Error('UNAUTHORIZED'))
        }
    })

    // User connection
    io.on('connection', (socket) =>
    {
        const userId = socket.data.userId as string

        // Private room for this user
        socket.join(`user:${userId}`)
    })
}
