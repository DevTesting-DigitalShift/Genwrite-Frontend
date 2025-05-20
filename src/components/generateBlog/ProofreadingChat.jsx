import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, X } from "lucide-react";
import axiosInstance from "../../api";
import { toast } from "react-toastify";

const ProofreadingChat = ({ blog, onClose }) => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const result = await axiosInstance.post("/blogs/proofread", {
        content: blog.content,
        message: message,
      });
      setResponse(result.data.suggestions);
      setMessage("");
    } catch (error) {
      console.error("Error getting proofreading suggestions:", error);
      toast.error("Failed to get proofreading suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute -bottom-20  left-0 right-0 bg-white rounded-lg shadow-lg z-10 mt-4  "
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Proofreading Assistant</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 max-h-48 min-h-40 overflow-y-auto">
          {response && (
            <div className="bg-gray-50 p-3 rounded-md mb-2">
              <p className="text-sm text-gray-700">{response}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask for proofreading suggestions..."
            className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white p-2 rounded-md disabled:opacity-50"
            disabled={isLoading}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default ProofreadingChat; 