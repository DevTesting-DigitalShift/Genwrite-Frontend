import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Bot, User } from "lucide-react"

const ChatBox = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([])
  const [showQuestions, setShowQuestions] = useState(true)
  const messagesEndRef = useRef(null)

  const qna = [
    {
      question: "What is this software about?",
      answer: "This software helps you create SEO-optimized blog content using AI.",
    },
    {
      question: "How does the AI generate blogs?",
      answer: "It uses trained models to understand your topic and generate a complete article.",
    },
    {
      question: "Can I use it for free?",
      answer: "Yes, there's a free plan with limited usage. Upgrade for more features.",
    },
    {
      question: "What are Quick Tools?",
      answer: "Quick Tools are mini-features that let you generate intros, titles, summaries, and more in seconds.",
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, showQuestions])

  const handleQuestionClick = (question, answer) => {
    const userMsg = {
      id: Date.now(),
      text: question,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setShowQuestions(false)

    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        text: answer,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    }, 800)

    setTimeout(() => {
      setShowQuestions(true)
    }, 1500)
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
            <p className="text-xs opacity-80 mt-1">Click any question below to begin</p>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100">
            {messages.length > 0 && (
              <div className="space-y-4 mb-4">
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
                        </div>
                        {msg.sender === "user" && (
                          <div className="bg-indigo-400/30 p-1.5 rounded-full ml-2">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
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
              </div>
            )}

            {showQuestions && (
              <div className="flex flex-col gap-2">
                {qna.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(item.question, item.answer)}
                    className="text-left text-sm px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition"
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 py-3 border-t bg-white">
            Predefined Q&A Mode – no typing needed
          </div>

          {/* Custom Bubbles */}
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
