import React, { useState } from "react";
import { Button, Space, Tooltip } from "antd";
import {
  CopyOutlined,
  ReloadOutlined,
  PictureOutlined,
  MessageOutlined,
  PlusOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

import ImageGenerationModal from "./ImageGenerationModal";
import ChatBox from "../generateBlog/ChatBox";

const SmallBottomBox = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeModal = () => setModalOpen(false);
  const closeChat = () => setIsChatOpen(false);

  const menuOptions = [
    {
      label: "Copy",
      icon: <CopyOutlined />,
      onClick: () => {
        navigator.clipboard.writeText("Copied content"); // Replace with actual content
        setMenuOpen(false);
      },
    },
    {
      label: "Regenerate",
      icon: <ReloadOutlined />,
      onClick: () => {
        console.log("Regenerate clicked");
        setMenuOpen(false);
      },
    },
    {
      label: "Generate Images",
      icon: <PictureOutlined />,
      onClick: () => {
        setModalOpen(true);
        setMenuOpen(false);
      },
    },
    {
      label: "Chat Box",
      icon: <MessageOutlined />,
      onClick: () => {
        setIsChatOpen(true);
        setMenuOpen(false);
      },
    },
  ];

  return (
    <>
      <div className="fixed bottom-10 right-28 transform translate-x-12 z-50 flex flex-col items-end">
        {/* Action List */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mb-3 flex flex-col gap-2 items-center p-2 rounded-xl bg-black/20 backdrop-blur-sm"
            >
              {menuOptions.map(({ label, icon, onClick }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Tooltip title={label} placement="left">
                    <Button
                      type="default"
                      shape="round"
                      icon={icon}
                      size="large"
                      onClick={onClick}
                      className="w-48 text-left p-1 shadow-md font-medium"
                    >
                      {label}
                    </Button>
                  </Tooltip>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={isMenuOpen ? <CloseOutlined /> : <PlusOutlined />}
            onClick={toggleMenu}
            className="shadow-xl"
          />
        </motion.div>
      </div>

      {/* Modals */}
      {isModalOpen && <ImageGenerationModal onClose={closeModal} />}
      <ChatBox isOpen={isChatOpen} onClose={closeChat} />
    </>
  );
};

export default SmallBottomBox;
