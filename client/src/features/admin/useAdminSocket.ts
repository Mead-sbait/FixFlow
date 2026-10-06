import { useEffect } from 'react'
import { io } from 'socket.io-client'

const events = ['issue:created', 'issue:assigned', 'issue:updated']

// refetch the admin data whenever the server tells us an issue changed
export function useAdminSocket(token: string | null, onIssueChange: () => void) {
  useEffect(() => {
    if (!token) return

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000', {
      auth: { token }
    })

    for (const event of events) {
      socket.on(event, onIssueChange)
    }

    return () => {
      socket.disconnect()
    }
  }, [token, onIssueChange])
}
