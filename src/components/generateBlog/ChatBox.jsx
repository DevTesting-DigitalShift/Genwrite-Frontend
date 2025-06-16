import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X, Bot, User, Loader2 } from "lucide-react"
import axiosInstance from "@api/index"

const ChatBox = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    // Add user's message to chat
    const userMessage = {
      id: Date.now(),
      text: trimmedMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage("")
    setIsGenerating(true)

    try {
      const response = await axiosInstance.post("/user/chat", {
        messages: [...messages, userMessage].slice(-5),
      })

      const reply = response.data?.trim?.() || "I couldn't process that. Could you try again?"
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: reply,
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("Chat request failed:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Sorry, I'm having trouble connecting. Please try again later.",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === ",") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-300/30 p-2 rounded-full">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">AI Assistant</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-indigo-400/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs opacity-80 mt-1">How can I help you today?</p>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center px-4"
              >
                <div className="bg-indigo-100 p-4 rounded-full mb-4">
                  <Bot className="w-8 h-8 text-indigo-600" />
                </div>
                <h4 className="font-medium text-gray-700">Welcome to AI Assistant</h4>
                <p className="text-sm text-gray-500 mt-2">
                  Ask me anything about content creation, SEO, or blog writing. I'm here to help!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 relative ${
                          msg.sender === "user"
                            ? "bg-indigo-500 text-white rounded-tr-none"
                            : "bg-white text-gray-700 rounded-tl-none border border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {msg.sender === "ai" && (
                            <div className="bg-indigo-100 p-1.5 rounded-full mt-0.5">
                              <Bot className="w-4 h-4 text-indigo-600" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm">{msg.text}</p>
                            <div
                              className={`text-xs mt-1.5 ${
                                msg.sender === "user" ? "text-indigo-200" : "text-gray-400"
                              }`}
                            >
                              {msg.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          {msg.sender === "user" && (
                            <div className="bg-indigo-400/30 p-1.5 rounded-full ml-2">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Message triangle */}
                        <div
                          className={`absolute top-0 w-3 h-3 ${
                            msg.sender === "user"
                              ? "-right-3 bg-indigo-500 clip-path-user"
                              : "-left-3 bg-white clip-path-ai border-l border-t border-gray-200"
                          }`}
                        ></div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] rounded-2xl p-3 bg-white text-gray-700 rounded-tl-none border border-gray-200 relative">
                      <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 p-1.5 rounded-full">
                          <Bot className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex space-x-1">
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          ></motion.div>
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          ></motion.div>
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          ></motion.div>
                        </div>
                      </div>
                      <div className="absolute top-0 -left-3 w-3 h-3 bg-white clip-path-ai border-l border-t border-gray-200"></div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <motion.div
                whileHover={{ boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.2)" }}
                className="flex-1 border border-gray-200 rounded-xl overflow-hidden"
              >
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full p-3 text-sm resize-none focus:outline-none"
                  rows={2}
                />
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={isGenerating || !message.trim()}
                className={`p-3 rounded-xl flex items-center justify-center ${
                  isGenerating || !message.trim()
                    ? "bg-gray-200 text-gray-400"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                }`}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Press ⏎ Enter to send</p>
          </div>

          {/* Custom clip paths for message bubbles */}
          <style jsx>{`
            .clip-path-user {
              clip-path: polygon(0 0, 100% 0, 100% 100%);
            }
            .clip-path-ai {
              clip-path: polygon(0 0, 100% 0, 0 100%);
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ChatBox
