import { type Socket, io } from "socket.io-client"

let socket: Socket | null = null
let socketToken: string | null = null

export const connectSocket = (token: string | null): Socket | null => {
  if (socket && socketToken === token) {
    console.log("🔌 Socket already connected for this account, reusing existing connection")
    return socket
  }
  if (socket) {
    // A different account's token — the old socket must not keep receiving events
    // for the account we're switching away from.
    console.log("🔌 Switching accounts, disconnecting previous socket")
    disconnectSocket()
  }
  const url = import.meta.env.VITE_BACKEND_URL
  socketToken = token

  console.log("🚀 Connecting to socket server:", url)

  const s = io(url, { path: "/events", auth: { token }, transports: ["websocket"] })
  socket = s

  // Connection event
  s.on("connect", () => {
    console.log("✅ Socket connected successfully!")
    console.log("📡 Socket ID:", s.id)
  })

  // Disconnection event
  s.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected. Reason:", reason)
  })

  // Connection error
  s.on("connect_error", (error) => {
    console.error("🔴 Socket connection error:", error.message)
  })

  // Reconnection attempt
  s.io.on("reconnect_attempt", (attemptNumber: number) => {
    console.log(`🔄 Reconnection attempt #${attemptNumber}`)
  })

  // Reconnection success
  s.io.on("reconnect", (attemptNumber: number) => {
    console.log(`✅ Socket reconnected after ${attemptNumber} attempts`)
  })

  // Reconnection failed
  s.io.on("reconnect_failed", () => {
    console.error("🔴 Socket reconnection failed")
  })

  // Log every event. `onevent` is internal to socket.io-client and not in its public
  // types, so this patch is cast rather than typed.
  interface PatchableSocket {
    onevent: (packet: { data?: unknown[] }) => void
  }
  const patchable = s as unknown as PatchableSocket
  const onevent = patchable.onevent
  patchable.onevent = function (this: PatchableSocket, packet: { data?: unknown[] }) {
    try {
      const [eventName, ...args] = packet.data || []
      console.log(`📨 Socket event received: "${eventName}"`, args)
    } catch (e) {
      console.warn("⚠️ Failed to log event:", e)
    }
    onevent.call(this, packet)
  }

  // Log outgoing events
  const originalEmit = s.emit.bind(s)
  s.emit = ((eventName: string, ...args: unknown[]) => {
    console.log(`📤 Socket event sent: "${eventName}"`, args)
    return originalEmit(eventName, ...args)
  }) as Socket["emit"]

  return socket
}

export const getSocket = (): Socket | null => {
  if (!socket) {
    console.warn("⚠️ Socket not initialized! Call connectSocket() first")
  }
  return socket
}

export const disconnectSocket = (): void => {
  if (!socket) return
  socket.disconnect()
  socket = null
  socketToken = null
}
