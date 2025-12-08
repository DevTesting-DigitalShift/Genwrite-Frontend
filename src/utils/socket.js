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
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

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
    console.error("❌ Socket connection error:", err.message)
    console.error("Error details:", err)
  })

  // Log ALL events for debugging
  socket.onAny((eventName, ...args) => {
    console.log(`📡📡📡 Socket event received: ${eventName}`, args)
  })

  // Test listeners
  socket.on("blog:statusChanged", data => {
    console.log("🎯🎯🎯 BLOG STATUS CHANGED EVENT RECEIVED!", data)
  })

  socket.on("blog:updated", data => {
    console.log("🎯🎯🎯 BLOG UPDATED EVENT RECEIVED!", data)
  })

  socket.on("blog:created", data => {
    console.log("🎯🎯🎯 BLOG CREATED EVENT RECEIVED!", data)
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    console.warn("⚠️ Socket not initialized! Call connectSocket() first")
  }
  return socket
}
