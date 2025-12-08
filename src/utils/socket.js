import { io } from "socket.io-client"

let socket

export const connectSocket = token => {
  if (socket) {
    console.warn("Socket already connected")
    return socket
  }
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
  socket = io(url, {
    path: "/events",
    auth: { token },
    transports: ["websocket"],
  })

  // Log every event
  const onevent = socket.onevent
  socket.onevent = function (packet) {
    try {
      const [eventName, ...args] = packet.data || []
      console.log("📡 Incoming Event:", eventName, args)
    } catch (e) {
      console.warn("Failed to log event:", e)
    }
    onevent.call(this, packet)
  }

  socket.on("connect", () => {
    console.debug("✅ Socket connected:", socket.id)
  })

  socket.on("disconnect", () => {
    console.debug("❌ Socket disconnected")
  })

  socket.on("connect_error", err => {
    console.error("Connection error:", err.message)
  })

  return socket
}

export const getSocket = () => socket
