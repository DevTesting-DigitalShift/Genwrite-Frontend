import { Navigate, Outlet } from "react-router-dom"
import LayoutWithSidebarAndHeader from "@components/Layout"
import LoadingOverlay from "@components/LoadingOverlay"
import ChatBox from "@components/generateBlog/ChatBox"
import { useState } from "react"
import { RiChatAiLine } from "react-icons/ri"
import { Tooltip } from "antd"

const PrivateRoutesLayout = () => {
  // Retrieve token from local storage
  const token = localStorage.getItem("token")
  const [chatOpen, setChatOpen] = useState(false)
  // Check if token exists
  return token ? (
    <>
      <LoadingOverlay />
      <div className="flex">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header at the top */}
          <LayoutWithSidebarAndHeader />
          <div className="flex-1 ml-20 mt-20">
            <Tooltip title="Chatbot">
              <div
                onClick={() => setChatOpen(true)}
                className="rounded-full bg-blue-500 fixed z-40 bottom-6 right-8 transition ease-linear duration-500 cursor-pointer hover:translate-y-0.5"
              >
                <RiChatAiLine className="p-2 size-10 text-white" />
              </div>
            </Tooltip>
            <Outlet />
            <ChatBox isOpen={chatOpen} onClose={() => setChatOpen(false)} />
          </div>
        </div>
      </div>
    </>
  ) : (
    <Navigate to="/login" replace />
  )
}

export default PrivateRoutesLayout
