import { io } from "socket.io-client"

let socket

export const connectSocket = token => {
  if (socket) {
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
    } catch (e) {
      console.warn("Failed to log event:", e)
    }
    onevent.call(this, packet)
  }

  return socket
}

export const getSocket = () => {
  if (!socket) {
    console.warn("⚠️ Socket not initialized! Call connectSocket() first")
  }
  return socket
}
