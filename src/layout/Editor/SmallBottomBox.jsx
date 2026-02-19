import React, { useState } from "react"
import { Menu, RotateCw } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import useAuthStore from "@store/useAuthStore"
import { useRetryBlogMutation } from "@api/queries/blogQueries"
import toast from "@utils/toast"

import ImageGenerationModal from "../generateBlog/Editor/ImageGenerationModal"
// import ChatBox from "../generateBlog/ChatBox"

const SmallBottomBox = ({ id }) => {
  const [isModalOpen, setModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { handlePopup } = useConfirmPopup()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const userPlan = user?.plan ?? user?.subscription?.plan

  const { mutateAsync: retryBlog, isPending: isRetrying } = useRetryBlogMutation()

  const closeModal = () => setModalOpen(false)
  const closeChat = () => setIsChatOpen(false)

  const handleRetry = async () => {
    try {
      const response = await retryBlog({ id: id._id, payload: { createNew: true } })
      toast.success(response?.message || "Blog regenerated successfully!")
      navigate("/blogs")
    } catch (error) {
      console.error("Error regenerating blog:", error)
      toast.error("Failed to regenerate blog")
    }
  }

  const handleRegenerate = () => {
    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
    } else {
      handlePopup({
        title: "Regenerate Blog",
        description: `Are you sure you want to retry generating this blog?\nIt will be of 10 credits`,
        confirmText: "Regenerate",
        onConfirm: handleRetry,
      })
    }
  }

  return (
    <>
      <div className="mt-1 ml-auto flex items-end">
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className={`btn btn-sm btn-ghost border border-gray-300 hover:bg-gray-100 ${isRetrying ? "loading" : ""}`}
          >
            {!isRetrying && <Menu size={16} />}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <button
                onClick={handleRegenerate}
                disabled={isRetrying}
                className="flex items-center gap-2"
              >
                <RotateCw size={14} />
                Regenerate
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && <ImageGenerationModal onClose={closeModal} />}
      {/* <ChatBox isOpen={isChatOpen} onClose={closeChat} /> */}
    </>
  )
}

export default SmallBottomBox
