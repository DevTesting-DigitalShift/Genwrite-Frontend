import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Send,
  Trash2,
  Upload,
  MessageSquare,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Zap,
  Shield,
  File as FileIcon,
  Loader2,
  ArrowRight,
  BrainCircuit,
} from "lucide-react"
import { Button, Input, message, Upload as AntUpload, Avatar } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { pdfChat, resetPdfChat } from "@/store/slices/toolsSlice"
import { Helmet } from "react-helmet"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { checkSufficientCredits, getInsufficientCreditsPopup } from "@/utils/creditCheck"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

const { Dragger } = AntUpload
const { TextArea } = Input

const ChatWithPdf = () => {
  const dispatch = useDispatch()
  const { loading, cacheKey, error } = useSelector(state => state.tools.pdfChat)

  const [file, setFile] = useState(null)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "model",
      content:
        "Hi! Upload a PDF and I'll analyze it for you. Then you can ask me anything about it.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleUpload = info => {
    const { status } = info.file
    if (status === "done") {
      const uploadedFile = info.file.originFileObj
      // Size check: 2MB limit (2 * 1024 * 1024 bytes)
      if (uploadedFile.size > 2 * 1024 * 1024) {
        message.error(
          `File is too large (${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB). Max size is 2MB.`
        )
        return
      }

      setFile(uploadedFile)
      message.success(`${uploadedFile.name} uploaded successfully!`)
      setMessages([
        {
          id: 1,
          role: "model",
          content: `I've analyzed "${uploadedFile.name}". What would you like to know?`,
          timestamp: new Date(),
        },
      ])
    } else if (status === "error") {
      message.error(`${info.file.name} file upload failed.`)
    }
  }

  const dummyRequest = ({ onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok")
    }, 0)
  }

  const user = useSelector(state => state.auth.user)
  const { handlePopup } = useConfirmPopup()

  const handleSendMessage = async () => {
    if (!input.trim() || !file) return

    // Credit Check
    const creditCheck = checkSufficientCredits(user, "tools.chatpdf", "gemini")
    if (!creditCheck.hasEnough) {
      const popupConfig = getInsufficientCreditsPopup(
        creditCheck.required,
        creditCheck.available,
        "Chat with PDF"
      )
      handlePopup({
        ...popupConfig,
        onConfirm: () => {
          // Navigate to pricing or handle confirm
          window.location.href = "/pricing" // Or use navigate from router
        },
      })
      return
    }

    const userMessage = { id: Date.now(), role: "user", content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput("")

    try {
      let payload
      if (!cacheKey) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("question", userMessage.content)
        payload = formData
      } else {
        const conversationHistory = messages
          .slice(-10)
          .map(msg => ({ role: msg.role, content: msg.content }))
        payload = { cacheKey, messages: conversationHistory, question: userMessage.content }
      }

      const result = await dispatch(pdfChat(payload)).unwrap()
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: "model", content: result.text, timestamp: new Date() },
      ])
    } catch (err) {
      message.error(err?.message || "Failed to get response")
    }
  }

  const handleKeyPress = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearFile = () => {
    setFile(null)
    dispatch(resetPdfChat())
    setMessages([
      {
        id: 1,
        role: "model",
        content:
          "Hi! Upload a PDF and I'll analyze it for you. Then you can ask me anything about it.",
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Helmet>
        <title>Chat with PDF | GenWrite</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 h-screen flex flex-col gap-6">
        {/* Header - Always visible but adaptable */}
        <header className="flex items-center justify-between bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-sm sticky top-0 z-10 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white transform hover:scale-105 transition-transform duration-300">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Chat with PDF</h1>
              <p className="text-sm text-slate-500 font-medium">Research Assistant</p>
            </div>
          </div>

          {file && (
            <Button
              danger
              type="text"
              className="hover:bg-red-50 text-red-600 rounded-xl font-medium flex items-center gap-2"
              onClick={clearFile}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">End Session</span>
            </Button>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {!file ? (
              /* EMPTY STATE / LANDING */
              <motion.div
                key="upload-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="items-center justify-center"
              >
                <div className="w-full">
                  <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                    <div className="p-4 md:p-8 h-[35rem]">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                          <Upload className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Upload your PDF</h3>
                        <p className="text-slate-500 mt-2">Up to 2MB • Auto-OCR included</p>
                      </div>

                      <div className="relative group">
                        <Dragger
                          accept=".pdf"
                          customRequest={dummyRequest}
                          onChange={handleUpload}
                          showUploadList={false}
                          className="!border-0 !bg-transparent w-full"
                          style={{ padding: 0 }}
                        >
                          <div
                            className="border-2 border-dashed border-slate-200 rounded-2xl p-10 bg-slate-50/50 
                group-hover:bg-indigo-50/30 group-hover:border-indigo-400 
                transition-all cursor-pointer text-center h-[20rem]
                flex flex-col items-center justify-center"
                          >
                            <p className="text-indigo-600 font-medium mb-2">Click to browse</p>
                            <p className="text-slate-400 text-sm">or drag and drop here</p>
                          </div>
                        </Dragger>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* CHAT STATE */
              <motion.div
                key="chat-interface"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden"
              >
                {/* File Context Bar */}
                <div className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-50 p-1.5 rounded text-red-500">
                      <FileIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-700 truncate max-w-[200px] md:max-w-md">
                        {file.name}
                      </h2>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50/30 scroll-smooth">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {/* Avatar (Model) */}
                      {msg.role === "model" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 text-white mt-1">
                          <BrainCircuit className="w-4 h-4" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`
                        max-w-[85%] md:max-w-[75%] p-4 md:p-6 rounded-2xl text-[15px] leading-relaxed shadow-sm
                        ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-tr-none"
                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                        }
                      `}
                      >
                        {msg.role === "model" ? (
                          <div className="prose prose-sm max-w-none prose-slate">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>

                      {/* Avatar (User) */}
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Loading Indicator */}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 text-white mt-1">
                        <BrainCircuit className="w-4 h-4" />
                      </div>
                      <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-white border-t border-slate-100">
                  <div className="max-w-4xl mx-auto relative group">
                    <TextArea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question about your document..."
                      autoSize={{ minRows: 1, maxRows: 6 }}
                      className="!pr-14 !pl-6 !py-4 !rounded-2xl !bg-slate-50 !border-slate-200 focus:!bg-white focus:!border-indigo-500 hover:!border-indigo-300 !text-slate-800 !text-base !resize-none !shadow-inner transition-all"
                      disabled={loading}
                    />
                    <Button
                      type="primary"
                      shape="circle"
                      size="large"
                      icon={
                        loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ArrowRight className="w-5 h-5" />
                        )
                      }
                      onClick={handleSendMessage}
                      disabled={!input.trim() || loading}
                      className={`absolute right-2 bottom-2 !flex !items-center !justify-center !w-10 !h-10 !border-0 !shadow-lg ${
                        !input.trim() || loading
                          ? "!bg-slate-200 !text-slate-400"
                          : "!bg-gradient-to-r !from-indigo-600 !to-violet-600 !text-white hover:!scale-110"
                      } transition-all duration-300`}
                    />
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-xs text-slate-400">
                      AI can assist with key findings, summaries, and data extraction. (Cost: 1
                      credit/message)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ChatWithPdf
