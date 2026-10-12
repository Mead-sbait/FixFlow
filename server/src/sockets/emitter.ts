
import type { Server } from 'socket.io'

type SocketEvents = {
    'issue:assigned': {
        issueId: string
    }

    'issue:updated': {
        issueId: string
    }

    'comment:added': {
        issueId: string
    }

    'notification:new': {
        notificationId: string
    }
}

let io: Server | null = null

// Register the Socket.IO server
export function setSocketServer(server: Server)
{
    io = server
}

// Send an event to a specific user
export function emitToUser<Event extends keyof SocketEvents>(userId: string, event: Event, payload: SocketEvents[Event])
{
    if (!io)
    {
        return
    }

    io.to(`user:${userId}`).emit(event, payload)
}
