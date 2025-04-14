import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { fetchBlogById } from "../../store/slices/blogSlice";
import TextEditor from "../generateBlog/TextEditor";
import TextEditorSidebar from "../generateBlog/TextEditorSidebar";
import SmallBottomBox from "./SmallBottomBox";

const ToolBox = () => {
  const location = useLocation();
  const [blogId, setBlogId] = useState(null);
  const dispatch = useDispatch();
  const blog = useSelector((state) => state.blog.selectedBlog);
  const [activeTab, setActiveTab] = useState("normal");
  const [isLoading, setIsLoading] = useState(true);
  const [keywords, setKeywords] = useState([]);

  const blogFromLocation = location.state?.blog;

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("blogId");
    setBlogId(id);
  }, [location.search]);

  useEffect(() => {
    if (blogId && !blogFromLocation) {
      setIsLoading(true);
      dispatch(fetchBlogById(blogId)).then(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [blogId, dispatch, blogFromLocation]);

  const blogToDisplay = blogFromLocation || blog;

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-7 ml-20 mt-12 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Blog Editor</h1>
            <div className="flex space-x-2">
              {["normal", "markdown", "html"].map((tab) => (
                <motion.button
                  key={tab}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="flex flex-grow">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={tabVariants}
                transition={{ duration: 0.3 }}
                className="flex-grow"
              >
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <motion.div
                      className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                ) : (
                  <TextEditor
                    keywords={keywords}
                    setKeywords={setKeywords}
                    blog={blogToDisplay}
                    activeTab={activeTab}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            <TextEditorSidebar
              blog={blogToDisplay}
              keywords={keywords}
              setKeywords={setKeywords}
            />
          </div>
        </div>
        <SmallBottomBox />
      </div>
    </div>
  );
};

export default ToolBox;
