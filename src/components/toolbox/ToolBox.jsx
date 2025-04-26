import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../api";
import { toast } from "react-toastify";
import { fetchBlogById } from "../../store/slices/blogSlice";
import TextEditor from "../generateBlog/TextEditor";
import TextEditorSidebar from "../generateBlog/TextEditorSidebar";
import SmallBottomBox from "./SmallBottomBox";
import { Loader2 } from "lucide-react";

const ToolBox = () => {
  const location = useLocation();
  const [blogId, setBlogId] = useState(null);
  const dispatch = useDispatch();
  const blog = useSelector((state) => state.blog.selectedBlog);
  const [activeTab, setActiveTab] = useState("normal");
  const [isLoading, setIsLoading] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [editorContent, setEditorContent] = useState("");

  const blogFromLocation = location.state?.blog;

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("blogId");
    setBlogId(id);
  }, [location.search]);

  useEffect(() => {
    setKeywords([]);
    setIsLoading(true);
    console.log(`Effect(load): blogId=${blogId}, blogFromLocation exists=${!!blogFromLocation}`);

    if (blogId && !blogFromLocation) {
      dispatch(fetchBlogById(blogId))
        .then((action) => {
          let fetchedContent = "";
          let fetchedKeywords = [];
          if (action.payload) {
            fetchedContent = action.payload.content || "";
            fetchedKeywords = action.payload.keywords || [];
            console.log("Effect(load): Fetched content length:", fetchedContent.length);
          } else {
             console.log("Effect(load): Fetch payload was empty.");
          }
          setEditorContent(fetchedContent);
          setKeywords(fetchedKeywords);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Effect(load): Failed to fetch blog:", error);
          setEditorContent("");
          setKeywords([]);
          toast.error("Failed to load blog content.");
          setIsLoading(false);
        });
    } else if (blogFromLocation) {
      const initialContent = blogFromLocation.content || "";
      console.log("Effect(load): Using location state content length:", initialContent.length);
      setEditorContent(initialContent);
      setKeywords(blogFromLocation.keywords || []);
      setIsLoading(false);
    } else {
      console.log("Effect(load): No blogId/location. Setting content empty.");
      setEditorContent("");
      setKeywords([]);
      setIsLoading(false);
    }
  }, [blogId, dispatch, blogFromLocation]);

  useEffect(() => {
    console.log("Effect(log state): editorContent state updated. Length:", editorContent?.length ?? 'null/undefined', "Value:", editorContent);
  }, [editorContent]);

  const blogToDisplay = blogFromLocation || blog;

  const handleContentChange = (markdownContent) => {
    console.log("handleContentChange (markdown) called. New length:", markdownContent?.length ?? 'undefined');
    setEditorContent(markdownContent);
  };

  const handlePostToWordPress = async () => {
    console.log("handlePost: Attempting post. Current editorContent:", editorContent);

    if (!blogToDisplay?.title) {
      toast.error("Blog title is missing.");
      return;
    }

    if (!editorContent || editorContent.trim() === "") {
      toast.error("Editor content is empty.");
      return;
    }

    const postData = {
      title: blogToDisplay.title,
      content: editorContent,
    };

    console.log("handlePost: Posting Markdown via backend:", postData);
    const postingToastId = toast.info("Posting to WordPress...", { autoClose: false });

    try {
      const response = await axiosInstance.post("/wordpress/post", postData);
      toast.update(postingToastId, {
        render: response.data?.message || "Successfully posted to WordPress!",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
      console.log("handlePost: Backend WP Response:", response.data);
    } catch (error) {
      console.error("handlePost: Error posting via backend:", error.response?.data || error.message);
      if (error.response?.status === 504) {
         console.warn("handlePost: Backend timed out. Treating as success for UI.");
         toast.update(postingToastId, {
           render: "Post submitted successfully! (Check WordPress)",
           type: "success",
           isLoading: false,
           autoClose: 5000,
         });
      } else {
         let errorDetail = "Unknown error";
         if (error.response?.data?.error) {
            errorDetail = error.response.data.error;
         } else if (error.message) {
            errorDetail = error.message;
         }
         toast.update(postingToastId, {
           render: `WordPress posting failed: ${errorDetail}`,
           type: "error",
           isLoading: false,
           autoClose: 5000,
         });
      }
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-7 ml-20 mt-12 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex flex-col h-full ">
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
                  <div className="flex justify-center items-center h-full min-h-[calc(100vh-200px)]">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                  </div>
                ) : (
                  <TextEditor
                    keywords={keywords}
                    setKeywords={setKeywords}
                    blog={blogToDisplay}
                    activeTab={activeTab}
                    content={editorContent}
                    onContentChange={handleContentChange}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            <TextEditorSidebar
              blog={blogToDisplay}
              keywords={keywords}
              setKeywords={setKeywords}
              onPost={handlePostToWordPress}
            />
          </div>
        </div>
        <SmallBottomBox />
      </div>
    </div>
  );
};

export default ToolBox;
