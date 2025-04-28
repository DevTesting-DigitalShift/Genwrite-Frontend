import React, { useState } from "react";
import { motion } from "framer-motion";
import ImageGenerationModal from "./ImageGenerationModal.jsx";
import ChatBox from "../generateBlog/ChatBox";

const SmallBottomBox = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-2  transform -translate-x-1/2 bg-white flex flex-wrap items-center justify-center gap-4 p-2 w-full max-w-[40rem] rounded-xl shadow-lg"
      >
        {["Copy", "Regenerate", "Generate Images", "Chat Box"].map(
          (text, index) => (
            <motion.button
              key={index}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onClick={() => {
                if (text === "Generate Images") {
                  openModal();
                } else if (text === "Chat Box") {
                  setIsChatOpen(true);
                }
              }}
            >
              {text}
            </motion.button>
          )
        )}
      </motion.div>

      {isModalOpen && <ImageGenerationModal onClose={closeModal} />}
      <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default SmallBottomBox;
