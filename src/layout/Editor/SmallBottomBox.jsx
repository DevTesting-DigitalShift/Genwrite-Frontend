import React, { useState } from "react"
import { Button, Dropdown, message } from "antd"
import { MenuOutlined, ReloadOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import useAuthStore from "@store/useAuthStore"
import { useRetryBlogMutation } from "@api/queries/blogQueries"

import ImageGenerationModal from "../generateBlog/Editor/ImageGenerationModal"
// import ChatBox from "../generateBlog/ChatBox"

const SmallBottomBox = ({ id }) => {
  const [isModalOpen, setModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { handlePopup } = useConfirmPopup()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const userPlan = user?.plan ?? user?.subscription?.plan

  const { mutateAsync: retryBlog, isLoading: isRetrying } = useRetryBlogMutation()

  const closeModal = () => setModalOpen(false)
  const closeChat = () => setIsChatOpen(false)

  const handleRetry = async () => {
    try {
      const response = await retryBlog({ id: id._id, payload: { createNew: true } })
      message.success(response?.message || "Blog regenerated successfully!")
      navigate("/blogs")
    } catch (error) {
      console.error("Error regenerating blog:", error)
    }
  }

  const handleRegenerate = () => {
    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
    } else {
      handlePopup({
        title: "Regenerate Blog",
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
      disabled: isRetrying,
    },
  ]

  return (
    <>
      <div className="mt-1 ml-auto flex items-end">
        <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
          <Button
            type="default"
            icon={<MenuOutlined />}
            loading={isRetrying}
            className="text-gray-700 border-gray-300 hover:bg-gray-100"
          />
        </Dropdown>
      </div>

      {/* Modals */}
      {isModalOpen && <ImageGenerationModal onClose={closeModal} />}
      {/* <ChatBox isOpen={isChatOpen} onClose={closeChat} /> */}
    </>
  )
}

export default SmallBottomBox
