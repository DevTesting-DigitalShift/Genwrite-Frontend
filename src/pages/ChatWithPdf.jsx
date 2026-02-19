import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Send,
  Trash2,
  Upload,
  User,
  Sparkles,
  File as FileIcon,
  Loader2,
  ArrowRight,
  BrainCircuit,
  Plus,
  Zap,
} from "lucide-react"
import toast from "@utils/toast"
import useAuthStore from "@store/useAuthStore"
import useToolsStore from "@store/useToolsStore"
import { usePdfChatMutation } from "@api/queries/toolsQueries"
import { Helmet } from "react-helmet"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { checkSufficientCredits, getInsufficientCreditsPopup } from "@/utils/creditCheck"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

const ChatWithPdf = () => {
  const { pdfChat, resetPdfChat } = useToolsStore()
  const { cacheKey } = pdfChat
  const { mutateAsync: sendMessage, isPending: loading } = usePdfChatMutation()
  const { user } = useAuthStore()
  const { handlePopup } = useConfirmPopup()

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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const processFile = uploadedFile => {
    if (!uploadedFile || uploadedFile.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file.")
      return
    }

    // Size check: 2MB limit (2 * 1024 * 1024 bytes)
    if (uploadedFile.size > 2 * 1024 * 1024) {
      toast.error(
        `File is too large (${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB). Max size is 2MB.`
      )
      return
    }

    setFile(uploadedFile)
    toast.success(`${uploadedFile.name} added to spectral memory`)
    setMessages([
      {
        id: 1,
        role: "model",
        content: `I've analyzed "${uploadedFile.name}". What would you like to know?`,
        timestamp: new Date(),
      },
    ])
  }

  const handleFileUpload = e => {
    const uploadedFile = e.target.files?.[0]
    processFile(uploadedFile)
  }

  const handleDragOver = e => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = e => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    processFile(droppedFile)
  }

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
          window.location.href = "/pricing"
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

      const result = await sendMessage(payload)
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: "model", content: result.text, timestamp: new Date() },
      ])
    } catch (err) {
      toast.error(err?.message || "Failed to get response")
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
    resetPdfChat()
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
    <div className="min-h-screen bg-slate-50 font-inter overflow-hidden flex flex-col">
      <Helmet>
        <title>Docu-Intelligence | GenWrite</title>
      </Helmet>

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col p-4 md:p-8 gap-6 h-screen">
        {/* Header - Glassmorphism */}
        <header className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-white flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
              <FileText className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Docu-Intel</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                Neural Document Processor
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            {file && (
              <button
                onClick={clearFile}
                className="btn btn-ghost btn-sm text-slate-400 hover:text-rose-500 font-bold uppercase tracking-widest text-[10px]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eject Session
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            {!file ? (
              /* LANDING / UPLOAD STATE */
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex items-center justify-center"
              >
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full max-w-2xl bg-white rounded-[48px] p-12 shadow-2xl shadow-slate-200/60 border-2 border-dashed transition-all duration-500 flex flex-col items-center text-center space-y-8 ${
                    isDragging ? "bg-blue-50 border-blue-400 scale-[1.02]" : "border-slate-100"
                  }`}
                >
                  <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl shadow-slate-200 group relative">
                    <Upload className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="absolute -inset-1 bg-blue-400 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition-opacity" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                      Neural PDF Core
                    </h2>
                    <p className="text-slate-400 font-medium max-w-xs">
                      Drag your source document here or click to initiate spectral scan.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary px-10 h-16 rounded-2xl bg-slate-900 border-none text-white font-black shadow-2xl hover:bg-black transition-all gap-3"
                  >
                    Select PDF Source
                    <Plus className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-6 pt-4">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="w-4 h-4 text-slate-300" />
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        Encrypted
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Zap className="w-4 h-4 text-slate-300" />
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        Instant OCR
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* CHAT INTERFACE */
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 flex flex-col overflow-hidden"
              >
                {/* Active Context Bar */}
                <div className="h-16 bg-slate-900 px-8 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shadow-lg shadow-rose-500/20">
                      <FileIcon size={16} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-sm font-black text-white truncate max-w-[200px] md:max-w-md tracking-tight">
                        {file.name}
                      </h2>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Sync Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-slate-50/30 custom-scroll">
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-6 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "model" && (
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-200 mt-1">
                          <BrainCircuit className="w-5 h-5 text-blue-400" />
                        </div>
                      )}

                      <div
                        className={`
                        max-w-[85%] md:max-w-[70%] p-6 rounded-3xl text-[15px] leading-relaxed shadow-sm
                        ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white rounded-tr-none"
                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-none font-medium"
                        }
                      `}
                      >
                        {msg.role === "model" ? (
                          <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-strong:text-slate-900 prose-pre:bg-slate-900">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="font-bold">{msg.content}</p>
                        )}
                        <p
                          className={`text-[9px] font-black uppercase tracking-widest mt-4 opacity-30 ${msg.role === "user" ? "text-white" : "text-slate-400"}`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {msg.role === "user" && (
                        <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 mt-1">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Neural Processing State */}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-6"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-200 mt-1 animate-pulse">
                        <BrainCircuit className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="bg-white p-6 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Neural Synthesis
                        </span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Matrix */}
                <div className="p-6 md:p-10 bg-white border-t border-slate-50">
                  <div className="max-w-4xl mx-auto relative flex items-end gap-4">
                    <div className="relative flex-1">
                      <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Inquire about document semantics..."
                        rows={1}
                        className="w-full bg-slate-50 border-slate-100 rounded-[28px] pl-8 pr-16 py-5 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none font-bold text-slate-800 custom-scroll min-h-[64px] max-h-48"
                        disabled={loading}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || loading}
                        className={`absolute right-2.5 bottom-2.5 w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-xl ${
                          !input.trim() || loading
                            ? "bg-slate-100 text-slate-300"
                            : "bg-slate-900 text-white hover:bg-black hover:scale-105 active:scale-95"
                        }`}
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 rotate-12" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 opacity-50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      1 Credit / Prompt
                    </span>
                    <div className="h-1 w-1 bg-slate-300 rounded-full" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Context Window High
                    </span>
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
