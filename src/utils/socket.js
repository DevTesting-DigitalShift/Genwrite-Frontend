import { io } from "socket.io-client"

let socket

export const connectSocket = (token) => {
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

  socket.on("connect", () => {
    console.debug("✅ Socket connected:", socket.id)
  })

  socket.on("disconnect", () => {
    console.debug("❌ Socket disconnected")
  })

  socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message)
  })

  return socket
}

export const getSocket = () => socket
