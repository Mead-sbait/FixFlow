import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { app } from './app.js'
import { env } from './config/env.js'
import { registerSocketHandlers } from './sockets/index.js'
import { connectDatabase } from './config/db.js'

const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: env.clientOrigin } })
registerSocketHandlers(io)
try {
  await connectDatabase()
  httpServer.listen(env.port, () => console.log(`FixFlow API listening on port ${env.port}`))
} catch {
  console.error('Database connection failed. Check MONGODB_URI and MongoDB availability.')
  process.exit(1)
}
