import React, { useState } from "react"
import { Button, Dropdown, Tooltip, message } from "antd"
import { MenuOutlined, CopyOutlined, ReloadOutlined, CloseOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useDispatch, useSelector } from "react-redux"
import { retryBlog } from "@store/slices/blogSlice"

import ImageGenerationModal from "./ImageGenerationModal"
import ChatBox from "../generateBlog/ChatBox"

const SmallBottomBox = ({ id }) => {
  const [isModalOpen, setModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { handlePopup } = useConfirmPopup()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan

  const closeModal = () => setModalOpen(false)
  const closeChat = () => setIsChatOpen(false)

  const handleRetry = async () => {
    try {
      const resultAction = await dispatch(retryBlog({ id: id._id, payload: { createNew: true } }))

      if (retryBlog.fulfilled.match(resultAction)) {
        message.success(resultAction.payload?.message || "Blog regenerated successfully!")
        navigate("/blogs")
      } else {
        message.error(resultAction.payload || "Failed to regenerate blog.")
      }
    } catch (error) {
      message.error(error.message || "Failed to regenerate blog.")
      console.error("Error regenerating blog:", error)
    }
  }

  const handleRegenerate = () => {
    if (userPlan === "free" || userPlan === "basic") {
      handlePopup({
        title: "Upgrade Required",
        description: "Rewrite is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/pricing"),
      })
    } else {
      handlePopup({
        title: "Retry Blog Generation",
        description: `Are you sure you want to retry generating this blog?\nIt will be of 10 credits`,
        onConfirm: handleRetry,
      })
    }
  }

  const menuItems = [
    {
      key: "regenerate",
      label: (
        <span className="flex items-center gap-2">
          <ReloadOutlined />
          Regenerate
        </span>
      ),
      onClick: handleRegenerate,
    },
  ]

  return (
    <>
      <div className="mt-1 ml-auto flex items-end">
        <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
          <Button
            type="default"
            icon={<MenuOutlined />}
            className="text-gray-700 border-gray-300 hover:bg-gray-100"
          />
        </Dropdown>
      </div>

      {/* Modals */}
      {isModalOpen && <ImageGenerationModal onClose={closeModal} />}
      <ChatBox isOpen={isChatOpen} onClose={closeChat} />
    </>
  )
}

export default SmallBottomBox
