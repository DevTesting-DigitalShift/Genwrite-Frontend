import { Navigate, Outlet } from "react-router-dom"
import LayoutWithSidebarAndHeader from "@components/SideBar_Header"
import ChatBox from "@components/generateBlog/ChatBox"
import { useState } from "react"
import { RiChatAiLine } from "react-icons/ri"
import { Tooltip } from "antd"

const PrivateRoutesLayout = () => {
  const token = localStorage.getItem("token")
  const [chatOpen, setChatOpen] = useState(false)

  // Check if token exists
  return token ? (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Header and Sidebar */}
        <LayoutWithSidebarAndHeader />
        {/* Main content area */}
        <div className="flex-1 ml-0 md:ml-16 pt-16 sm:pt-20">
          <Tooltip
            title="Chatbot"
            overlayStyle={{
              fontSize: "12px",
              padding: "6px 10px",
              borderRadius: "6px",
              maxWidth: "150px",
            }}
          >
            <div
              onClick={() => setChatOpen(true)}
              className="rounded-full bg-blue-500 fixed z-40 bottom-4 sm:bottom-6 right-4 sm:right-6 transition ease-linear duration-300 cursor-pointer hover:shadow-lg shadow-md hover:translate-y-0.5"
            >
              <RiChatAiLine className="p-2 sm:p-3 size-10 sm:size-12 text-white" />
            </div>
          </Tooltip>
          <main className="min-h-screen">
            <Outlet />
          </main>
          <ChatBox isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        </div>
      </div>
      <style>
        {`
          .ant-tooltip-inner {
            font-size: 12px !important;
            padding: 6px 10px !important;
            border-radius: 6px !important;
          }
          @media (max-width: 640px) {
            .ant-tooltip-inner {
              font-size: 10px !important;
              max-width: 120px !important;
            }
          }
        `}
      </style>
    </>
  ) : (
    <Navigate to="/login" replace />
  )
}

export default PrivateRoutesLayout
