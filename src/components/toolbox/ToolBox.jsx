import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "../../api"
import { createManualBlog, fetchBlogById, updateBlogById } from "../../store/slices/blogSlice"
import TextEditor from "../generateBlog/TextEditor"
import TextEditorSidebar from "../generateBlog/TextEditorSidebar"
import { Loader2, FileText, Eye, Save, RefreshCw } from "lucide-react"
import { Helmet } from "react-helmet"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Button, message, Modal, Typography } from "antd"
import { htmlToText } from "html-to-text"
import { sendRetryLines } from "@api/blogApi"
import TemplateModal from "@components/generateBlog/ManualBlogEditor.jsx/TemplateModal"

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
  const [showTemplateModal, setShowTemplateModal] = useState(!id)
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const navigate = useNavigate()
  const location = useLocation()
  const pathDetect = location.pathname === `/blog-editor/${blog?._id}`
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [templateFormData, setTemplateFormData] = useState({
    title: "",
    topic: "",
    tone: "Informative",
    focusKeywords: [],
    keywords: [],
    userDefinedLength: 1200,
    focusKeywordInput: "",
    keywordInput: "",
    template: "",
  })
  const [errors, setErrors] = useState({
    title: false,
    topic: false,
    tone: false,
    focusKeywords: false,
    keywords: false,
    userDefinedLength: false,
    template: false,
  })

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
        title: blog.title || "",
      })
    }
  }, [blog])

  const handleReplace = (original, change) => {
    if (typeof original !== "string" || typeof change !== "string") {
      message.error("Invalid suggestion format.")
      return
    }
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    setEditorContent((prev) => prev.replace(regex, change))
    setProofreadingResults((prev) => prev.filter((s) => s.original !== original))
  }

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
      const requestData = {
        blogId: blog._id,
        title: editorTitle,
        content: editorContent,
        categories: postData.categories,
        includeTableOfContents: postData.includeTableOfContents,
      }

      const response = isPosted
        ? await axiosInstance.put("/wordpress", requestData)
        : await axiosInstance.post("/wordpress", requestData)

      setIsPosted(response?.data)
      message.success(`Blog ${isPosted ? "updated" : "posted"} successfully!`)
    } catch (error) {
      message.error(error.response?.data?.message || `Failed to ${isPosted ? "update" : "post to"} WordPress.`)
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

  const handleSave = async () => {
    if (userPlan === "free" || userPlan === "basic") {
      showUpgradePopup()
      return
    }

    if (!editorTitle.trim()) {
      message.error("Blog title is required.")
      return
    }

    setIsSaving(true)
    try {
      const response = await dispatch(
        updateBlogById({
          id: blog._id,
          title: editorTitle,
          content: editorContent,
          published: blog?.published,
          focusKeywords: blog?.focusKeywords,
          keywords,
        })
      ).unwrap()

      message.success("Blog updated successfully")

      setIsLoading(true)
      setTimeout(() => {
        dispatch(fetchBlogById(id))
          .unwrap()
          .finally(() => setIsLoading(false))
      }, 2000)

      return response
    } catch (error) {
      console.error("Error updating the blog:", error)
      message.error("Failed to save blog.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleOptimizeSave = async () => {
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
        message.success("Review the suggested content.")
      } else {
        message.error("No content received from retry.")
      }
    } catch (error) {
      console.error("Error updating the blog:", error)
      message.error("Failed to save blog.")
    } finally {
      setIsSaving(false)
    }
  }

  const { Title } = Typography

  const handleAcceptSave = () => {
    if (saveContent) {
      setEditorContent(saveContent)
      message.success("Content updated successfully!")
    }
    setSaveModalOpen(false)
    setSaveContent(null)
  }

  const handleRejectSave = () => {
    setSaveModalOpen(false)
    setSaveContent(null)
    message.info("Changes discarded.")
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const handleTemplateModalClose = () => {
    const isEmpty =
      !templateFormData.title?.trim() ||
      !templateFormData.topic?.trim() ||
      !templateFormData.tone?.trim() ||
      !templateFormData.template ||
      !templateFormData.userDefinedLength ||
      templateFormData.userDefinedLength <= 0 ||
      !templateFormData.focusKeywords ||
      templateFormData.focusKeywords.length === 0 ||
      !templateFormData.keywords ||
      templateFormData.keywords.length === 0

    if (isEmpty && !id) navigate("/blogs")
    setShowTemplateModal(false)
  }

  const handleSubmit = async () => {
    const blogData = {
      title: templateFormData.title?.trim(),
      topic: templateFormData.topic?.trim(),
      tone: templateFormData.tone?.trim(),
      focusKeywords: templateFormData.focusKeywords,
      keywords: templateFormData.keywords,
      userDefinedLength: Number(templateFormData.userDefinedLength),
      template: templateFormData.template,
    }

    const newErrors = {}
    if (!blogData.title) newErrors.title = true
    if (!blogData.topic) newErrors.topic = true
    if (!blogData.tone) newErrors.tone = true
    if (!blogData.template) newErrors.template = true
    if (!blogData.userDefinedLength || blogData.userDefinedLength <= 0)
      newErrors.userDefinedLength = true
    if (!blogData.focusKeywords || blogData.focusKeywords.length === 0)
      newErrors.focusKeywords = true
    if (!blogData.keywords || blogData.keywords.length === 0) newErrors.keywords = true

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }))
      message.error("Please fill all required fields correctly.")
      return
    }

    try {
      const res = await dispatch(createManualBlog(blogData)).unwrap()
      setShowTemplateModal(false)
      navigate(`/blog-editor/${res._id}`)
    } catch (err) {
      console.error("Failed to create blog:", err)
      message.error(err?.message || "Failed to create blog")
    }
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    if (getWordCount(newTitle) <= 60) {
      setEditorTitle(newTitle)
      setFormData((prev) => ({ ...prev, title: newTitle }))
    } else {
      message.error("Title exceeds 60 words.")
    }
  }

  const handlePreview = () => {
    if (!editorContent.trim()) {
      message.error("Please write some content to preview.")
      return
    }
    setIsPreviewOpen(true)
  }

  const handlePreviewClose = () => setIsPreviewOpen(false)

  const generatePreviewContent = () => {
    if (!editorContent.trim())
      return `<h1>${editorTitle || "Preview Title"}</h1><p>No content available for preview.</p>`
    return `<div class="prose prose-lg"><h1>${
      editorTitle || topic || "Your Blog Title"
    }</h1>${editorContent}</div>`
  }

  return (
    <>
      <Helmet>
        <title>Blog Editor | GenWrite</title>
      </Helmet>
      <div className={`h-screen flex flex-col ${showTemplateModal ? "blur-sm" : ""}`}>
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

        <Modal
          title="Blog Preview"
          open={isPreviewOpen}
          onCancel={handlePreviewClose}
          footer={[
            <button
              key="close"
              onClick={handlePreviewClose}
              className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:bg-gray-500"
              aria-label="Close preview"
            >
              Close
            </button>,
          ]}
          width={800}
          centered
        >
          <div
            className="prose prose-lg max-w-none p-4"
            dangerouslySetInnerHTML={{ __html: generatePreviewContent() }}
          />
        </Modal>

        <div className="flex mt-5 pb-5">
          <div className="flex-1 flex flex-col">
            <header className="bg-white shadow-lg border rounded-tl-lg border-gray-200 p-6">
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
                  {pathDetect && (
                    <button
                      onClick={handlePreview}
                      className="px-4 py-2 bg-gradient-to-r from-[#1B6FC9] to-[#4C9FE8] text-white rounded-lg hover:from-[#1B6FC9]/90 hover:to-[#4C9FE8]/90 flex items-center"
                      aria-label="Preview blog"
                    >
                      <Eye size={16} className="mr-2" />
                      Preview
                    </button>
                  )}
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
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Blog
                      </>
                    )}
                  </button>
                </div>
              </div>
              {pathDetect && (
                <div className="mt-4">
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <input
                      type="text"
                      value={editorTitle}
                      onChange={handleTitleChange}
                      placeholder="Enter your blog title..."
                      className={`flex-1 text-2xl sm:text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none ${
                        getWordCount(editorTitle) > 60 ? "text-red-600" : ""
                      }`}
                      aria-label="Blog title"
                    />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {getWordCount(editorTitle)}/60 words (optimal for SEO)
                    {getWordCount(editorTitle) > 60 && (
                      <span className="text-red-600 ml-2">Title exceeds 60 words</span>
                    )}
                  </div>
                </div>
              )}
            </header>
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
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <TextEditorSidebar
            blog={blog}
            keywords={keywords}
            setKeywords={setKeywords}
            onPost={handlePostToWordPress}
            activeTab={activeTab}
            handleReplace={handleReplace}
            proofreadingResults={proofreadingResults}
            setProofreadingResults={setProofreadingResults}
            handleSave={handleOptimizeSave}
            posted={isPosted}
            isPosting={isPosting}
            formData={formData}
            title={editorTitle}
            editorContent={editorContent} 
          />
        </div>
      </div>

      <TemplateModal
        closeFnc={handleTemplateModalClose}
        isOpen={showTemplateModal}
        handleSubmit={handleSubmit}
        errors={errors}
        setErrors={setErrors}
        formData={templateFormData}
        setFormData={setTemplateFormData}
      />
    </>
  )
}

export default ToolBox
