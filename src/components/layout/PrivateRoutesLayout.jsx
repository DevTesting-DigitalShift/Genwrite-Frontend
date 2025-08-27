import { Navigate, Outlet } from "react-router-dom"
import LayoutWithSidebarAndHeader from "@components/Layout"
import LoadingOverlay from "@components/LoadingOverlay"
import ChatBox from "@components/generateBlog/ChatBox"
import { useState } from "react"
import { RiChatAiLine } from "react-icons/ri"
import { Tooltip } from "antd"

const PrivateRoutesLayout = () => {
  const token = localStorage.getItem("token")
  const [chatOpen, setChatOpen] = useState(false)

  return token ? (
    <>
      <LoadingOverlay />
      <div className="flex flex-col md:flex-row lg:min-h-screen">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header + Sidebar wrapper */}
          <LayoutWithSidebarAndHeader />
          <div
            className="
              flex-1 
              mt-0 lg:mt-0    /* reset for desktop */
              ml-0 md:ml-20   /* sidebar margin only on md+ */
              p-4 md:p-6     
            "
          >
            {/* Floating Chat Button */}
            <Tooltip title="Chatbot">
              <div
                onClick={() => setChatOpen(true)}
                className="rounded-full bg-blue-500 fixed z-40 bottom-6 right-6 md:right-8 shadow-lg cursor-pointer transition-transform hover:translate-y-0.5"
              >
                <RiChatAiLine className="p-2 size-10 text-white" />
              </div>
            </Tooltip>

            {/* Dynamic page content */}
            <Outlet />

            {/* Chatbox Drawer / Popup */}
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
