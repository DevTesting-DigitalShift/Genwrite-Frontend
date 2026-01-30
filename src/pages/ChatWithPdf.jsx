import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UploadOutlined,
  FilePdfOutlined,
  SendOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  RobotOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { Button, Input, message, Upload, Spin, Avatar } from "antd"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet"

const { Dragger } = Upload

const ChatWithPdf = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I've analyzed your PDF. Ask me anything about it.",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleUpload = info => {
    const { status } = info.file
    if (status === "done") {
      message.success(`${info.file.name} file uploaded successfully.`)
      setAnalyzing(true)
      // Simulate analysis delay
      setTimeout(() => {
        setFile(info.file.originFileObj)
        setAnalyzing(false)
      }, 2000)
    } else if (status === "error") {
      message.error(`${info.file.name} file upload failed.`)
    }
  }

  const dummyRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok")
    }, 1000)
  }

  const handleSendMessage = () => {
    if (!input.trim()) return

    const newMessage = { id: Date.now(), text: input, sender: "user", timestamp: new Date() }

    setMessages(prev => [...prev, newMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "This is a simulated response based on the PDF content. In a real integration, I would answer based on the analysis of the document.",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    }, 1500)
  }

  const handleKeyPress = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearFile = () => {
    setFile(null)
    setMessages([
      {
        id: 1,
        text: "Hi! I've analyzed your PDF. Ask me anything about it.",
        sender: "ai",
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <Helmet>
        <title>Chat with PDF | GenWrite</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={() => navigate("/toolbox")}
              className="text-gray-500 hover:text-gray-900"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 m-0">Chat with PDF</h1>
              <p className="text-gray-500 text-sm m-0">Upload a document and get instant answers</p>
            </div>
          </div>
          {file && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={clearFile}
              className="flex items-center"
            >
              Remove PDF
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative flex flex-col">
          {!file && !analyzing && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md"
              >
                <div className="mb-8">
                  <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FilePdfOutlined className="text-4xl text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Upload your PDF</h2>
                  <p className="text-gray-500">
                    Drag and drop your file here, or click to browse. We'll analyze it instantly.
                  </p>
                </div>

                <Dragger
                  accept=".pdf"
                  customRequest={dummyRequest}
                  onChange={handleUpload}
                  showUploadList={false}
                  className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-500 transition-colors"
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined className="text-red-500 text-2xl" />
                  </p>
                  <p className="ant-upload-text font-medium text-gray-700">
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint text-gray-400 text-xs">
                    Support for a single PDF file upload.
                  </p>
                </Dragger>
              </motion.div>
            </div>
          )}

          {analyzing && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
              <p className="mt-4 text-gray-500 font-medium">Analyzing document...</p>
            </div>
          )}

          {file && !analyzing && (
            <div className="flex-1 flex flex-col h-full">
              {/* PDF Info Bar */}
              <div className="h-14 border-b border-gray-100 flex items-center px-6 bg-gray-50/50 justify-between">
                <div className="flex items-center gap-3">
                  <FilePdfOutlined className="text-red-500 text-lg" />
                  <span className="font-semibold text-gray-700 truncate max-w-xs">{file.name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <Avatar
                        icon={msg.sender === "user" ? <UserOutlined /> : <RobotOutlined />}
                        className={`${
                          msg.sender === "user" ? "bg-blue-600" : "bg-emerald-600"
                        } flex-shrink-0`}
                      />
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100"
                            : "bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <Avatar icon={<RobotOutlined />} className="bg-emerald-600 flex-shrink-0" />
                      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        <span
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <span
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask something about your document..."
                    size="large"
                    className="pr-12 rounded-xl border-gray-200 hover:border-blue-400 focus:border-blue-500 focus:shadow-none"
                    disabled={isTyping}
                  />
                  <Button
                    type="text"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  />
                </div>
                <div className="text-center mt-2">
                  <span className="text-[10px] text-gray-400">
                    AI can make mistakes. Please verify important information.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ChatWithPdf
