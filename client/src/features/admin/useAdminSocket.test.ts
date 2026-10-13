import { describe, expect, it, vi } from 'vitest'
import { adminSocketEvents, bindAdminSocket } from './useAdminSocket'

// tiny fake socket: remembers handlers so the test can fire events itself
function fakeSocket() {
  const handlers = new Map<string, Array<() => void>>()
  return {
    on: (event: string, handler: () => void) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler])
    },
    off: (event: string, handler: () => void) => {
      handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== handler))
    },
    fire: (event: string) => {
      for (const handler of handlers.get(event) ?? []) handler()
    },
    count: () => [...handlers.values()].reduce((sum, list) => sum + list.length, 0)
  }
}

describe('admin socket wiring', () => {
  it('refreshes on connect and reconnect, not only on issue events', () => {
    const socket = fakeSocket()
    const refresh = vi.fn()
    bindAdminSocket(socket, refresh)

    socket.fire('connect')
    expect(refresh).toHaveBeenCalledTimes(1)

    // socket.io fires 'connect' again after it reconnects
    socket.fire('connect')
    expect(refresh).toHaveBeenCalledTimes(2)

    socket.fire('issue:assigned')
    expect(refresh).toHaveBeenCalledTimes(3)
  })

  it('removes every listener again on cleanup', () => {
    const socket = fakeSocket()
    const refresh = vi.fn()
    const unbind = bindAdminSocket(socket, refresh)

    expect(socket.count()).toBe(adminSocketEvents.length)
    unbind()
    expect(socket.count()).toBe(0)

    socket.fire('connect')
    expect(refresh).not.toHaveBeenCalled()
  })
})
