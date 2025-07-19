import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../../api";
import { fetchBlogById, updateBlogById } from "../../store/slices/blogSlice";
import TextEditor from "../generateBlog/TextEditor";
import TextEditorSidebar from "../generateBlog/TextEditorSidebar";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";
import { sendRetryLines } from "@api/blogApi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Button, message, Modal, Typography } from "antd";

const ToolBox = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const blog = useSelector((state) => state.blog.selectedBlog);
  const [activeTab, setActiveTab] = useState("normal");
  const [isLoading, setIsLoading] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [editorContent, setEditorContent] = useState("");
  const [proofreadingResults, setProofreadingResults] = useState([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveContent, setSaveContent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosted, setIsPosted] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [formData, setFormData] = useState({ category: "", includeTableOfContents: false });

  useEffect(() => {
    if (id) {
      dispatch(fetchBlogById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (blog?.keywords) {
      setKeywords(blog.keywords);
    }
  }, [blog?.keywords]);

  useEffect(() => {
    setIsLoading(true);
    if (blog) {
      setEditorContent(blog.content ?? "");
      setIsPosted(blog?.wordpress || null);
      setIsLoading(false);
    } else {
      setEditorContent("");
      setIsLoading(false);
    }
  }, [blog]);

  const blogToDisplay = blog;

  const handleReplace = (original, change) => {
    if (typeof original !== "string" || typeof change !== "string") {
      console.error("Invalid types passed to handleReplace:", { original, change });
      message.error("Something went wrong while applying suggestion.");
      return;
    }

    let updatedContent = editorContent;
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    updatedContent = updatedContent.replace(regex, change);
    setEditorContent(updatedContent);

    setProofreadingResults((prev) => prev.filter((s) => s.original !== original));
  };

  const handlePostToWordPress = async (postData) => {
    setIsPosting(true);
    console.log("Attempting to post to WordPress:", {
      blogId: blogToDisplay?._id,
      title: blogToDisplay?.title,
      content: editorContent,
      category: postData.categories,
      includeTableOfContents: postData.includeTableOfContents,
    });

    if (!blogToDisplay?.title) {
      message.error("Blog title is missing.");
      setIsPosting(false);
      return;
    }

    if (!editorContent || editorContent.trim() === "" || editorContent === "<p></p>" || editorContent === "<p><br></p>") {
      message.error("Editor content is empty. Please add some content before posting.");
      setIsPosting(false);
      return;
    }

    if (!postData.categories) {
      message.error("Please select a category.");
      setIsPosting(false);
      return;
    }

    const key = "wordpress-posting";

    try {
      const response = await axiosInstance.post("/wordpress/post", {
        blogId: blogToDisplay._id,
        title: blogToDisplay.title,
        content: editorContent,
        categories: postData.categories, // Single string
        includeTableOfContents: postData.includeTableOfContents,
      });

      console.log("Post response:", response.data);
      setIsPosted(response?.data);
      message.success({
        content: "Blog posted successfully!",
        key,
        duration: 3,
      });
    } catch (error) {
      console.error("Failed to post to WordPress:", {
        error: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });
      let errorMessage = "Failed to post to WordPress";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      message.error({
        content: errorMessage,
        key,
        duration: 5,
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dispatch(
        updateBlogById({
          id: blog._id,
          title: blog?.title,
          content: editorContent,
          published: blog?.published,
          focusKeywords: blog?.focusKeywords,
          keywords,
        })
      );
      const res = await sendRetryLines(blog._id);
      if (res.data) {
        setSaveContent(res.data);
        setSaveModalOpen(true);
        message.success("Review the suggested content.");
      } else {
        message.error("No content received from retry.");
      }
    } catch (error) {
      console.error("Error updating the blog:", error);
      message.error("Failed to save blog.");
    } finally {
      setIsSaving(false);
    }
  };

  const { Title } = Typography;

  const handleAcceptSave = () => {
    if (saveContent) {
      setEditorContent(saveContent);
      message.success("Content updated successfully!");
    }
    setSaveModalOpen(false);
    setSaveContent(null);
  };

  const handleRejectSave = () => {
    setSaveModalOpen(false);
    setSaveContent(null);
    message.info("Changes discarded.");
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <Helmet>
        <title>Blog Editor | GenWrite</title>
      </Helmet>
      <div className="h-full">
        <div className="max-w-8xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Save Response Modal */}
          <Modal
            open={saveModalOpen}
            centered
            footer={[
              <>
                <Button
                  onClick={handleRejectSave}
                  style={{ background: "#f5f5f5", color: "#595959" }}
                >
                  Reject
                </Button>
                <Button type="primary" onClick={handleAcceptSave}>
                  Accept
                </Button>
              </>,
            ]}
            onCancel={handleRejectSave}
            width={700}
            className="rounded-lg"
          >
            <Title level={3} style={{ marginBottom: "16px" }}>
              Suggested Content
            </Title>
            <div
              style={{
                padding: "16px",
                background: "#f5f5f5",
                borderRadius: "4px",
                marginBottom: "16px",
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                className="prose"
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1890ff", textDecoration: "underline" }}
                      onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                    >
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: "bold" }}>{children}</strong>
                  ),
                }}
              >
                {saveContent}
              </ReactMarkdown>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}></div>
          </Modal>

          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b text-center space-y-4">
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

            <div className="flex flex-grow h-[80vh]">
              <AnimatePresence>
                <motion.div
                  key={activeTab}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={tabVariants}
                  transition={{ duration: 0.3 }}
                  className="flex-grow w-1/2"
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
                      proofreadingResults={proofreadingResults}
                      handleReplace={handleReplace}
                      content={editorContent}
                      setContent={setEditorContent}
                      isSavingKeyword={isSaving}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              <TextEditorSidebar
                blog={blogToDisplay}
                keywords={keywords}
                setKeywords={setKeywords}
                onPost={handlePostToWordPress}
                activeTab={activeTab}
                handleReplace={handleReplace}
                proofreadingResults={proofreadingResults}
                setProofreadingResults={setProofreadingResults}
                content={editorContent}
                handleSave={handleSave}
                posted={isPosted}
                isPosting={isPosting}
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ToolBox;