import { useCallback, useEffect, useState, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "../api"
import {
  createManualBlog,
  fetchBlogById,
  updateBlogById,
  clearSelectedBlog,
} from "../store/slices/blogSlice"
import { Loader2, FileText, Eye, Save, RefreshCw, PanelRightOpen, X, Info } from "lucide-react"
import { Helmet } from "react-helmet"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Button, message, Modal, Typography, Popover } from "antd"
import { htmlToText } from "html-to-text"
import { sendRetryLines } from "@api/blogApi"
import TemplateModal from "@components/generateBlog/TemplateModal"
import { OpenAIFilled } from "@ant-design/icons"
import TextEditorSidebar from "@/layout/TextEditorSidebar/TextEditorSidebar"
import TextEditor from "@/layout/TextEditor/TextEditor"
import "../layout/TextEditor/editor.css"
import LoadingScreen from "@components/UI/LoadingScreen"

const MainEditorPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const blog = useSelector(state => state.blog.selectedBlog)
  const { metadata } = useSelector(state => state.wordpress)
  const [activeTab, setActiveTab] = useState("Normal")
  const [isLoading, setIsLoading] = useState(!!id)
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
  const [isHumanizeModalOpen, setIsHumanizeModalOpen] = useState(false)
  const [humanizedContent, setHumanizedContent] = useState("")
  const [isHumanizing, setIsHumanizing] = useState(false)
  const [humanizePrompt, setHumanizePrompt] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev)
  const user = useSelector(state => state.auth.user)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const navigate = useNavigate()
  const location = useLocation()
  const pathDetect = location.pathname === `/blog-editor/${blog?._id}`
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const { Title } = Typography
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
    const handleBeforeUnload = event => {
      if (unsavedChanges) {
        event.preventDefault()
        event.returnValue = "You have unsaved changes. Are you sure you want to leave?"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [unsavedChanges])

  useEffect(() => {
    if (id) {
      setIsLoading(true)
      dispatch(fetchBlogById(id))
        .unwrap()
        .catch(() => message.error("Failed to load blog."))
        .finally(() => setIsLoading(false))
    } else {
      // Clear selected blog when creating a new blog
      dispatch(clearSelectedBlog())
      // Clear editor state to prevent showing previous blog content
      setEditorContent("")
      setEditorTitle("")
      setKeywords([])
      setIsPosted(null)
      setFormData({ category: "", includeTableOfContents: false })
    }
  }, [id, dispatch])

  useEffect(() => {
    if (blog && id) {
      setKeywords(blog.keywords || [])
      setEditorTitle(blog.title || "")
      setEditorContent(blog.content ?? "")
      setIsPosted(blog.posting?.items || {})
      setFormData({
        category: blog.category || "",
        includeTableOfContents: blog.includeTableOfContents || false,
        title: blog.title || "",
      })
      setUnsavedChanges(false) // Reset unsavedChanges when blog is loaded
    }
  }, [blog, id])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Store the section-aware replace function from TextEditor
  const sectionReplaceRef = useRef(null)
  const handleReplaceReady = useCallback(replaceFn => {
    sectionReplaceRef.current = replaceFn
  }, [])

  const handleReplace = useCallback((original, change) => {
    if (typeof original !== "string" || typeof change !== "string") {
      message.error("Invalid suggestion format.")
      return
    }

    // Use section-aware replace if available (updates both sections and content)
    if (sectionReplaceRef.current) {
      sectionReplaceRef.current(original, change)
    } else {
      // Fallback to basic content replace
      const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
      setEditorContent(prev => prev.replace(regex, change))
    }

    // Remove suggestion from list
    setProofreadingResults(prev => prev.filter(s => s.original !== original))
  }, [])

  const handlePostToWordPress = async postData => {
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
      // 🔄 changed from categories → category
      message.error("Please select a category.")
      setIsPosting(false)
      return
    }

    const selectedCategory = postData.categories || formData.categories
    if (!selectedCategory) {
      message.error("Please select a category.")
      setIsPosting(false)
      return
    }

    try {
      const requestData = {
        type: postData.type.platform,
        blogId: blog._id,
        includeTableOfContents: postData.includeTableOfContents ?? false,
        category: selectedCategory,
        removeWaterMark: postData.removeWaterMark ?? true,
      }

      const response = isPosted
        ? await axiosInstance.put("/integrations/post", requestData)
        : await axiosInstance.post("/integrations/post", requestData)

      const postedData = response?.data?.posting?.items?.[postData.type.platform] || null
      setIsPosted(prev => ({ ...prev, [postData.type.platform]: postedData }))
      message.success(
        `Blog ${isPosted?.[postData.type.platform] ? "updated" : "posted"} successfully!`
      )
    } catch (error) {
      message.error(
        error.response?.data?.message || `Failed to ${isPosted ? "update" : "post to"} WordPress.`
      )
    } finally {
      setIsPosting(false)
    }
  }

  const getWordCount = text => {
    if (!text) return 0
    // Strip HTML tags first
    const strippedText = text.replace(/<[^>]*>/g, " ")
    // Count words
    return strippedText
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length
  }

  const handleSave = async ({ metadata }) => {
    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
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
          seoMetadata: metadata
            ? { title: metadata.title, description: metadata.description }
            : blog?.seoMetadata || { title: "", description: "" },
        })
      ).unwrap()

      message.success("Blog updated successfully")
      setUnsavedChanges(false) // Reset unsavedChanges after save

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
          seoMetadata: metadata
            ? { title: metadata.title, description: metadata.description }
            : blog?.seoMetadata || { title: "", description: "" },
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
      setUnsavedChanges(false) // Reset unsavedChanges after save
    } catch (error) {
      console.error("Error updating the blog:", error)
      message.error("Failed to save blog.")
    } finally {
      setIsSaving(false)
    }
  }

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

    if (isEmpty && !id) navigate("/toolbox")
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
      aiModel: "gemini",
      isCheckedGeneratedImages: false,
      isUnsplashActive: false,
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
      setErrors(prev => ({ ...prev, ...newErrors }))
      message.error("Please fill all required fields correctly.")
      return
    }

    try {
      const res = await dispatch(createManualBlog({ blogData, user })).unwrap()
      setShowTemplateModal(false)
      navigate(`/blog-editor/${res._id}`)
    } catch (err) {
      console.error("Failed to create blog:", err)
      message.error(err?.message || "Failed to create blog")
    }
  }

  const handleTitleChange = e => {
    const newTitle = e.target.value
    if (getWordCount(newTitle) <= 60) {
      setEditorTitle(newTitle)
      setFormData(prev => ({ ...prev, title: newTitle }))
    } else {
      message.error("Title exceeds 60 words.")
    }
  }

  const generatePreviewContent = () => {
    if (!editorContent.trim())
      return `<h1>${editorTitle || "Preview Title"}</h1><p>No content available for preview.</p>`
    return `<div class="prose prose-lg"><h1>${
      editorTitle || templateFormData.topic || "Your Blog Title"
    }</h1>${editorContent}</div>`
  }

  const handleAcceptHumanizedContent = useCallback(() => {
    setEditorContent(humanizedContent)
    setIsHumanizeModalOpen(false)
    setActiveTab("Normal")
    message.success("Humanized content applied successfully!")
  }, [humanizedContent, setEditorContent, setIsHumanizeModalOpen, setActiveTab])

  const handleAcceptOriginalContent = useCallback(() => {
    setIsHumanizeModalOpen(false)
    setActiveTab("Normal")
    message.info("Retained original content.")
  }, [setIsHumanizeModalOpen, setActiveTab])

  if (isLoading || isPosting) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm">
        <LoadingScreen />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Blog Editor | GenWrite</title>
      </Helmet>
      <div
        className={`flex flex-col max-h-screen overflow-y-hidden ${
          showTemplateModal ? "blur-sm" : ""
        }`}
      >
        <Modal
          open={saveModalOpen}
          centered
          footer={[
            <div className="flex justify-end gap-3 w-full" key="footer">
              <Button
                key="reject"
                onClick={handleRejectSave}
                className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md"
              >
                Reject
              </Button>
              <Button
                key="accept"
                type="primary"
                onClick={handleAcceptSave}
                className="px-3 sm:px-4 py-2 rounded-md"
              >
                Accept
              </Button>
            </div>,
          ]}
          onCancel={handleRejectSave}
          width="100%"
          className="rounded-lg max-w-[600px] sm:max-w-[700px] md:max-w-[800px]"
        >
          <div className="flex flex-col gap-4">
            <Title level={3} className="text-lg ml-5 sm:text-xl !mb-0 text-gray-800">
              Suggested Content
            </Title>

            <div className="p-5 custom-scroll border border-gray-200 rounded-lg shadow-inner max-h-[70vh] overflow-y-auto prose prose-sm sm:prose-base leading-relaxed text-gray-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-medium hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                  ),
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {saveContent}
              </ReactMarkdown>
            </div>
          </div>
        </Modal>

        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <header className="bg-white shadow-lg border rounded-tl-lg border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 mt-5 lg:mt-0 w-full">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                      {id ? "Edit Blog" : "Create New Blog"}
                    </h2>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Write and optimize your content
                    </p>
                  </div>
                  <button onClick={toggleSidebar} className="md:hidden ml-auto">
                    {!isSidebarOpen && <PanelRightOpen />}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleSave({ metadata })}
                    className={`px-3 sm:px-4 py-2 min-w-[130px] rounded-lg font-semibold flex items-center gap-2 justify-center transition-all duration-300 ${
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
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 sm:w-5 h-4 sm:h-5" />
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
                      className={`flex-1 text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none w-full ${
                        getWordCount(editorTitle) > 60 ? "text-red-600" : ""
                      }`}
                      aria-label="Blog title"
                    />
                  </div>
                  <div className="mt-2 text-xs sm:text-sm text-gray-500">
                    {getWordCount(editorTitle)}/60 words (optimal for SEO)
                    {getWordCount(editorTitle) > 60 && (
                      <span className="text-red-600 ml-2">Title exceeds 60 words</span>
                    )}
                  </div>
                </div>
              )}
            </header>
            <div key={activeTab} className="flex-grow overflow-auto max-h-[800px] custom-scroll">
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
                  handleSubmit={handleSave}
                  className="w-full"
                  humanizedContent={humanizedContent}
                  showDiff={isHumanizeModalOpen}
                  handleAcceptHumanizedContent={handleAcceptHumanizedContent}
                  handleAcceptOriginalContent={handleAcceptOriginalContent}
                  editorContent={editorContent}
                  unsavedChanges={unsavedChanges}
                  setUnsavedChanges={setUnsavedChanges}
                  wordpressMetadata={metadata}
                  onReplaceReady={handleReplaceReady}
                />
              )}
            </div>
          </div>
          <div className="hidden md:block border-l border-gray-200 overflow-y-auto custom-scroll max-h-[900px]">
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
              handleSubmit={handleSave}
              posted={isPosted}
              isPosting={isPosting}
              formData={formData}
              title={editorTitle}
              setEditorContent={setEditorContent}
              editorContent={editorContent}
              humanizePrompt={humanizePrompt}
              setHumanizePrompt={setHumanizePrompt}
              setIsHumanizing={setIsHumanizing}
              isHumanizing={isHumanizing}
              setHumanizedContent={setHumanizedContent}
              setIsHumanizeModalOpen={setIsHumanizeModalOpen}
              unsavedChanges={unsavedChanges}
              wordpressMetadata={metadata}
            />
          </div>

          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3 }}
                className="fixed inset-y-0 right-0 w-4/5 max-w-xs bg-white shadow-lg z-50 overflow-y-auto md:hidden"
              >
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
                  handleSubmit={handleSave}
                  posted={isPosted}
                  isPosting={isPosting}
                  formData={formData}
                  title={editorTitle}
                  setEditorContent={setEditorContent}
                  editorContent={editorContent}
                  humanizePrompt={humanizePrompt}
                  setHumanizePrompt={setHumanizePrompt}
                  setIsHumanizing={setIsHumanizing}
                  isHumanizing={isHumanizing}
                  setHumanizedContent={setHumanizedContent}
                  setIsHumanizeModalOpen={setIsHumanizeModalOpen}
                  setIsSidebarOpen={setIsSidebarOpen}
                  unsavedChanges={unsavedChanges}
                  wordpressMetadata={metadata}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <TemplateModal
          closeFnc={handleTemplateModalClose}
          isOpen={showTemplateModal}
          handleSubmit={handleSubmit}
          errors={errors}
          setErrors={setErrors}
          formData={templateFormData}
          setFormData={setTemplateFormData}
          className="w-full max-w-lg"
        />
      </div>
    </>
  )
}

export default MainEditorPage
