import { io } from "socket.io-client"

let socket

export const connectSocket = token => {
  if (socket) {
    console.warn("⚠️ Socket already connected")
    return socket
  }
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
  console.log("🔌 Connecting socket to:", url)
  console.log("🔑 Using token:", token ? "✅ Token exists" : "❌ No token")

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
    console.log("✅✅✅ Socket connected successfully! ✅✅✅")
    console.log("Socket ID:", socket.id)
    console.log("Socket connected:", socket.connected)
    console.log("Listening for events: blog:statusChanged, blog:updated, blog:created")
  })

  socket.on("disconnect", reason => {
    console.log("❌❌❌ Socket disconnected! ❌❌❌")
    console.log("Reason:", reason)
  })

  socket.on("connect_error", err => {
    console.error("Connection error:", err.message)
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    console.warn("⚠️ Socket not initialized! Call connectSocket() first")
  }
  return socket
}
