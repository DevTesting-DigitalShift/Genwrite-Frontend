import React, { useState } from "react"
import { Button, Space, Tooltip } from "antd"
import { CopyOutlined, ReloadOutlined, PictureOutlined, CloseOutlined } from "@ant-design/icons"
import { motion, AnimatePresence } from "framer-motion"

import ImageGenerationModal from "./ImageGenerationModal"
import ChatBox from "../generateBlog/ChatBox"
import { Menu } from "lucide-react"
import { toast } from "react-toastify"
import axiosInstance from "@api/index"

const SmallBottomBox = (id) => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isModalOpen, setModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const closeModal = () => setModalOpen(false)
  const closeChat = () => setIsChatOpen(false)

  const handleRetry = async ({ id }) => {
    const payload = {
      create_new: true,
    }
    try {
      const response = await axiosInstance.post(`blogs/${id}/retry`, payload)
      if (response.status === 200) {
        toast.success(response?.data?.message || "Blog regenerated successfully!")
        setMenuOpen(false)
      } else {
        toast.error("Failed to regenerated blog.")
      }
    } catch (error) {
      console.log("in catch", error)
      toast.error(error.response.data.message || "Failed to regenerated blog.")
      console.error("Error regenerating blog:", error)
    }
  }

  const menuOptions = [
    {
      label: "Copy",
      icon: <CopyOutlined />,
      onClick: () => {
        navigator.clipboard.writeText("Copied content") // Replace with actual content
        setMenuOpen(false)
      },
    },
    {
      label: "Regenerate",
      icon: <ReloadOutlined />,
      onClick: () => {
        handleRetry(id)
      },
    },
    {
      label: "Generate Images",
      icon: <PictureOutlined />,
      onClick: () => {
        setModalOpen(true)
        setMenuOpen(false)
      },
    },
  ]

  return (
    <>
      <div className="relative mt-1 ml-auto flex flex-col items-end">
        {/* Action List */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-12 right-0 z-50 min-w-[200px] rounded-lg shadow-lg border bg-white backdrop-blur-md p-2 space-y-1"
            >
              {menuOptions.map(({ label, icon, onClick }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Tooltip title={label} placement="left">
                    <button
                      onClick={() => {
                        onClick()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  </Tooltip>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="default"
            icon={isMenuOpen ? <CloseOutlined /> : <Menu />}
            onClick={toggleMenu}
            className="pt-1"
          />
        </motion.div>
      </div>

      {/* Modals */}
      {isModalOpen && <ImageGenerationModal onClose={closeModal} />}
      <ChatBox isOpen={isChatOpen} onClose={closeChat} />
    </>
  )
}

export default SmallBottomBox
