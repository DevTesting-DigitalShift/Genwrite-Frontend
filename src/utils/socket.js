import { io } from "socket.io-client"

let socket

export const connectSocket = token => {
  if (socket) {
    console.log("🔌 Socket already connected, reusing existing connection")
    return socket
  }
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"

  console.log("🚀 Connecting to socket server:", url)

  socket = io(url, {
    path: "/events",
    auth: { token },
    transports: ["websocket"],
  })

  // Connection event
  socket.on("connect", () => {
    console.log("✅ Socket connected successfully!")
    console.log("📡 Socket ID:", socket.id)
  })

  // Disconnection event
  socket.on("disconnect", reason => {
    console.log("❌ Socket disconnected. Reason:", reason)
  })

  // Connection error
  socket.on("connect_error", error => {
    console.error("🔴 Socket connection error:", error.message)
  })

  // Reconnection attempt
  socket.on("reconnect_attempt", attemptNumber => {
    console.log(`🔄 Reconnection attempt #${attemptNumber}`)
  })

  // Reconnection success
  socket.on("reconnect", attemptNumber => {
    console.log(`✅ Socket reconnected after ${attemptNumber} attempts`)
  })

  // Reconnection failed
  socket.on("reconnect_failed", () => {
    console.error("🔴 Socket reconnection failed")
  })

  // Log every event
  const onevent = socket.onevent
  socket.onevent = function (packet) {
    try {
      const [eventName, ...args] = packet.data || []
      console.log(`📨 Socket event received: "${eventName}"`, args)
    } catch (e) {
      console.warn("⚠️ Failed to log event:", e)
    }
    onevent.call(this, packet)
  }

  // Log outgoing events
  const originalEmit = socket.emit
  socket.emit = function (eventName, ...args) {
    console.log(`📤 Socket event sent: "${eventName}"`, args)
    return originalEmit.apply(this, [eventName, ...args])
  }

  return socket
}

export const getSocket = () => {
  if (!socket) {
    console.warn("⚠️ Socket not initialized! Call connectSocket() first")
  }
  return socket
}
