import { useEffect } from 'react'
import { io } from 'socket.io-client'

// 'connect' is in the list on purpose: it also fires after a reconnect, so anything
// that changed while we were offline gets picked up again
export const adminSocketEvents = ['connect', 'issue:created', 'issue:assigned', 'issue:updated']

type SocketLike = {
  on: (event: string, handler: () => void) => unknown
  off: (event: string, handler: () => void) => unknown
}

// attaches the refresh callback to every event we care about, returns a function that detaches it
export function bindAdminSocket(socket: SocketLike, onIssueChange: () => void) {
  for (const event of adminSocketEvents) {
    socket.on(event, onIssueChange)
  }

  return () => {
    for (const event of adminSocketEvents) {
      socket.off(event, onIssueChange)
    }
  }
}

// refetch the admin data whenever the server tells us an issue changed
export function useAdminSocket(token: string | null, onIssueChange: () => void) {
  useEffect(() => {
    if (!token) return

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000', {
      auth: { token }
    })

    const unbind = bindAdminSocket(socket, onIssueChange)

    return () => {
      unbind()
      socket.disconnect()
    }
  }, [token, onIssueChange])
}
