import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, PlusIcon } from "@heroicons/react/solid";
import { toast } from "react-toastify";

const TextEditorSidebar = ({ blog, keywords, setKeywords, onPost }) => {
  const [newKeyword, setNewKeyword] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    console.log(blog, "blog before");
    if (blog && blog.keywords?.length > 0) {
      console.log(blog, "blog");
      setKeywords(blog.keywords);
    }
  }, [blog]);

  const removeKeyword = (keyword) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const addKeywords = () => {
    const keywordsToAdd = newKeyword
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k && !keywords.includes(k));

    if (keywordsToAdd.length > 0) {
      setKeywords([...keywords, ...keywordsToAdd]);
      setNewKeyword("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeywords();
    }
  };

  const handlePostClick = async () => {
    if (onPost) {
      setIsPosting(true);
      try {
        await onPost();
      } catch (error) {
        console.error("Posting failed from sidebar trigger:", error);
        toast.error("Posting failed. Please try again later.");
      } finally {
        setIsPosting(false);
      }
    } else {
      console.warn("onPost handler is not provided to TextEditorSidebar");
      toast.error("Posting function not available.");
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-80 p-4 border-l bg-gray-50 overflow-y-auto"
    >
      <h2 className="font-semibold text-lg mb-4 text-gray-800">
        Competitor Analysis
      </h2>
      <div className="mb-6">
        <h3 className="font-semibold mb-2 text-gray-700">Keywords</h3>
        <div className="flex flex-wrap mb-2">
          <AnimatePresence>
            {keywords.map((keyword) => (
              <motion.span
                key={keyword}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center bg-blue-600 text-white px-2 py-1 rounded-md mr-2 mb-2"
              >
                {keyword}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeKeyword(keyword)}
                  className="ml-1"
                >
                  <XIcon className="w-4 h-4" />
                </motion.button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add Keywords (comma-separated)"
            className="flex-grow px-2 py-1 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addKeywords}
            className="bg-blue-600 text-white px-2 py-1 rounded-r-md"
          >
            <PlusIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2 text-gray-700">
          Competitor Analysis
        </h3>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-gray-800">Indian Style Pasta</h4>
            <motion.img
              src="./Images/leftarrow.png"
              alt=""
              whileHover={{ x: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            />
          </div>
          <p className="text-gray-600 text-sm mb-2">
            Indian-style pasta, also known as masala pasta or pasta masala,
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-blue-600 font-semibold text-sm"
          >
            Compare
          </motion.button>
        </motion.div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2 text-gray-700">More Tools</h3>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow-md p-4 mb-2"
        >
          <span className="text-2xl font-bold text-gray-400 mb-1 block">
            AA
          </span>
          <h4 className="text-blue-600 font-medium hover:underline cursor-pointer">
            Proofreading my blog
          </h4>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <span className="text-2xl font-bold text-gray-400 mb-1 block">
            AA
          </span>
          <h4 className="text-blue-600 font-medium hover:underline cursor-pointer">
            Headline Analyzer
          </h4>
        </motion.div>
      </div>
      <motion.button
        onClick={handlePostClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isPosting}
        className={`w-full flex items-center justify-center bg-blue-600 text-white py-2 rounded-md shadow-md transition-colors ${
          isPosting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
        }`}
      >
        {isPosting ? "Posting..." : "Post to WordPress"}
      </motion.button>
    </motion.div>
  );
};

export default TextEditorSidebar;
