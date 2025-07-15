import { io } from "socket.io-client"

let socket

export const connectSocket = (token) => {
  socket = io("http://localhost:8000", {
    path: "/events", // must match backend
    auth: { token }, // send JWT here
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
