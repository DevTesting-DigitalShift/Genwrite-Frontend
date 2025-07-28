import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "../../api"
import { fetchBlogById, updateBlogById } from "../../store/slices/blogSlice"
import TextEditor from "../generateBlog/TextEditor"
import TextEditorSidebar from "../generateBlog/TextEditorSidebar"
import { Loader2, FileText, Eye, Save, CheckCircle, RefreshCw } from "lucide-react"
import { Helmet } from "react-helmet"
import { sendRetryLines } from "@api/blogApi"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Button, message, Modal, Typography } from "antd"
import { htmlToText } from "html-to-text"

/**
 * ToolBox component for editing and managing blog content.
 */
const ToolBox = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const blog = useSelector((state) => state.blog.selectedBlog)
  const [activeTab, setActiveTab] = useState("Normal")
  const [isLoading, setIsLoading] = useState(true)
  const [keywords, setKeywords] = useState([])
  const [editorContent, setEditorContent] = useState("")
  const [editorTitle, setEditorTitle] = useState("")
  const [proofreadingResults, setProofreadingResults] = useState([])
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveContent, setSaveContent] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPosted, setIsPosted] = useState(null)
  const [isPosting, setIsPosting] = useState(false)
  const [formData, setFormData] = useState({ category: "", includeTableOfContents: false })
  const [showPreview, setShowPreview] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (id) {
      setIsLoading(true)
      dispatch(fetchBlogById(id))
        .unwrap()
        .catch(() => message.error("Failed to load blog."))
        .finally(() => setIsLoading(false))
    }
  }, [id, dispatch])

  useEffect(() => {
    if (blog) {
      setKeywords(blog.keywords || [])
      setEditorTitle(blog.title || "")
      setEditorContent(
        blog.content
          ? htmlToText(blog.content, {
              wordwrap: false,
              selectors: [
                { selector: "a", options: { baseUrl: "" } },
                { selector: "img", format: "skip" },
              ],
            })
          : ""
      )
      setIsPosted(blog.wordpress || null)
      setFormData({
        category: blog.category || "",
        includeTableOfContents: blog.includeTableOfContents || false,
      })
    }
  }, [blog])

  /**
   * Handles replacing text in the editor based on proofreading suggestions.
   * @param {string} original - The original text to replace.
   * @param {string} change - The suggested replacement text.
   */
  const handleReplace = (original, change) => {
    if (typeof original !== "string" || typeof change !== "string") {
      message.error("Invalid suggestion format.")
      return
    }
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    setEditorContent((prev) => prev.replace(regex, change))
    setProofreadingResults((prev) => prev.filter((s) => s.original !== original))
  }

  /**
   * Posts the blog to WordPress.
   * @param {object} postData - Data for posting (categories, includeTableOfContents).
   */
  const handlePostToWordPress = async (postData) => {
    setIsPosting(true)
    if (!editorTitle) {
      message.error("Blog title is missing.")
      setIsPosting(false)
      return
    }
    if (!editorContent.trim()) {
      message.error("Blog content is empty.")
      setIsPosting(false)
      return
    }
    if (!postData.categories) {
      message.error("Please select a category.")
      setIsPosting(false)
      return
    }
    try {
      const response = await axiosInstance.post("/wordpress/post", {
        blogId: blog._id,
        title: editorTitle,
        content: editorContent,
        categories: postData.categories,
        includeTableOfContents: postData.includeTableOfContents,
      })
      setIsPosted(response?.data)
      message.success("Blog posted successfully!")
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to post to WordPress.")
    } finally {
      setIsPosting(false)
    }
  }

  const getWordCount = (text) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  /**
   * Saves the blog content and optionally fetches retry suggestions.
   */
  const handleSave = async () => {
    if (!editorTitle.trim() || !editorContent.trim()) {
      message.error("Title and content cannot be empty.")
      return
    }
    if (getWordCount(editorTitle) > 60) {
      message.error("Title exceeds 60 words.")
      return
    }
    setIsSaving(true)
    try {
      await dispatch(
        updateBlogById({
          id: blog._id,
          title: editorTitle,
          content: editorContent,
          published: blog?.published,
          focusKeywords: blog?.focusKeywords,
          keywords,
        })
      ).unwrap()
      const res = await sendRetryLines(blog._id)
      if (res.data) {
        setSaveContent(res.data)
        setSaveModalOpen(true)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      message.success("Blog saved successfully!")
    } catch (error) {
      message.error("Failed to save blog.")
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handles preview toggle.
   */
  const handlePreview = () => {
    setShowPreview((prev) => !prev)
  }

  const { Title } = Typography

  /**
   * Accepts suggested content from retry.
   */
  const handleAcceptSave = () => {
    if (saveContent) {
      setEditorContent(saveContent)
      message.success("Content updated successfully!")
    }
    setSaveModalOpen(false)
    setSaveContent(null)
  }

  /**
   * Rejects suggested content from retry.
   */
  const handleRejectSave = () => {
    setSaveModalOpen(false)
    setSaveContent(null)
    message.info("Changes discarded.")
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <>
      <Helmet>
        <title>Blog Editor | GenWrite</title>
      </Helmet>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-lg border-b mt-5 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {id ? "Edit Blog" : "Create New Blog"}
                </h2>
                <p className="text-gray-600 text-sm">Write and optimize your content</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                className="px-4 py-2 bg-gradient-to-r from-[#1B6FC9] to-[#4C9FE8] text-white rounded-lg hover:from-[#1B6FC9]/90 hover:to-[#4C9FE8]/90 flex items-center"
                aria-label="Preview blog"
              >
                <Eye size={16} className="mr-2" />
                Preview
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300 ${
                  isSaving ||
                  !editorTitle.trim() ||
                  !editorContent.trim() ||
                  getWordCount(editorTitle) > 60
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105"
                }`}
                disabled={
                  isSaving ||
                  !editorTitle.trim() ||
                  !editorContent.trim() ||
                  getWordCount(editorTitle) > 60
                }
                aria-label="Save blog"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Blog
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Save Response Modal */}
        <Modal
          open={saveModalOpen}
          centered
          footer={[
            <Button
              key="reject"
              onClick={handleRejectSave}
              style={{ background: "#f5f5f5", color: "#595959" }}
            >
              Reject
            </Button>,
            <Button key="accept" type="primary" onClick={handleAcceptSave}>
              Accept
            </Button>,
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
                    style={{ color: "#1890ff" }}
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
        </Modal>

        <div className="flex flex-grow ">
          <AnimatePresence>
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
                <div className="flex justify-center items-center h-[calc(100vh-120px)]">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                </div>
              ) : (
                <TextEditor
                  keywords={keywords}
                  setKeywords={setKeywords}
                  blog={blog}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  proofreadingResults={proofreadingResults}
                  handleReplace={handleReplace}
                  content={editorContent}
                  setContent={setEditorContent}
                  title={editorTitle}
                  setTitle={setEditorTitle}
                  isSavingKeyword={isSaving}
                  showPreview={showPreview}
                />
              )}
            </motion.div>
          </AnimatePresence>
          <TextEditorSidebar
            blog={blog}
            keywords={keywords}
            setKeywords={setKeywords}
            onPost={handlePostToWordPress}
            activeTab={activeTab}
            handleReplace={handleReplace}
            proofreadingResults={proofreadingResults}
            setProofreadingResults={setProofreadingResults}
            handleSave={handleSave}
            posted={isPosted}
            isPosting={isPosting}
            formData={formData}
            title={editorTitle}
          />
        </div>
      </div>
    </>
  )
}

export default ToolBox
