import { useCallback, useEffect, useState, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstance from "../api"
import { Loader2, FileText, Eye, Save, RefreshCw, PanelRightOpen, X, Info } from "lucide-react"
import { Helmet } from "react-helmet"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { toast } from "sonner"
import { Sparkles as SparklesIcon } from "lucide-react"
import { htmlToText } from "html-to-text"
import { sendRetryLines } from "@api/blogApi"
import TemplateModal from "@components/generateBlog/TemplateModal"
import TextEditorSidebar from "@/layout/TextEditorSidebar/TextEditorSidebar"
import TipTapEditor from "@/layout/TextEditor/TipTapEditor"
import "../layout/TextEditor/editor.css"
import LoadingScreen from "@components/ui/LoadingScreen"
import useAuthStore from "@store/useAuthStore"
import useBlogStore from "@store/useBlogStore"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getBlogById, createSimpleBlog, updateBlog } from "@api/blogApi"

const MainEditorPage = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()

  // Zustand Stores
  const { user } = useAuthStore()
  const { selectedBlog: blog, setSelectedBlog, clearSelectedBlog: clearBlogUI } = useBlogStore()

  // TanStack Query for fetching blog
  const { data: fetchedBlog, isLoading: isBlogFetching } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => getBlogById(id),
    enabled: !!id,
  })

  const metadata = null // TODO: Migrate wordpress/otherSlice metadata to Zustand if needed
  const [activeTab, setActiveTab] = useState("Normal")
  // isLoading is now derived from isBlogFetching
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

  const navigate = useNavigate()
  const location = useLocation()
  const pathDetect = location.pathname === `/blog-editor/${blog?._id}`
  const [unsavedChanges, setUnsavedChanges] = useState(false)
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
    if (fetchedBlog) {
      setSelectedBlog(fetchedBlog)
    }
  }, [fetchedBlog, setSelectedBlog])

  useEffect(() => {
    if (!id) {
      // Clear selected blog when creating a new blog
      clearBlogUI()
      // Clear editor state to prevent showing previous blog content
      setEditorContent("")
      setEditorTitle("")
      setKeywords([])
      setIsPosted(null)
      setFormData({ category: "", includeTableOfContents: false })
    }
  }, [id, clearBlogUI])

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
      toast.error("Invalid suggestion format.")
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
      toast.error("Blog title is missing.")
      setIsPosting(false)
      return
    }
    if (!editorContent.trim()) {
      toast.error("Blog content is empty.")
      setIsPosting(false)
      return
    }
    if (!postData.categories) {
      // 🔄 changed from categories → category
      toast.error("Please select a category.")
      setIsPosting(false)
      return
    }

    const selectedCategory = postData.categories || formData.categories
    if (!selectedCategory) {
      toast.error("Please select a category.")
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
      setIsPosted(prev => ({ ...(prev || {}), [postData.type.platform]: postedData }))
      toast.success(
        `Blog ${isPosted?.[postData.type.platform] ? "updated" : "posted"} successfully!`
      )
    } catch (error) {
      toast.error(
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

  const handleSave = async (updateData = {}) => {
    const { metadata: seoMetadata, slug, ...rest } = updateData
    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
      return
    }

    if (!editorTitle.trim()) {
      toast.error("Blog title is required.")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: editorTitle,
        content: editorContent,
        published: blog?.published,
        focusKeywords: blog?.focusKeywords,
        keywords,
        slug: slug !== undefined ? slug : blog?.slug,
        seoMetadata: seoMetadata
          ? { title: seoMetadata.title, description: seoMetadata.description }
          : blog?.seoMetadata || { title: "", description: "" },
        ...rest,
      }

      const response = await updateBlog(blog._id, payload)

      toast.success("Blog updated successfully")
      setUnsavedChanges(false) // Reset unsavedChanges after save

      // Refresh query data
      queryClient.invalidateQueries({ queryKey: ["blog", id] })
      queryClient.invalidateQueries({ queryKey: ["blogs"] })

      return response
    } catch (error) {
      console.error("Error updating the blog:", error)
      toast.error("Failed to save blog.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleOptimizeSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        title: editorTitle,
        content: editorContent,
        published: blog?.published,
        focusKeywords: blog?.focusKeywords,
        keywords,
        seoMetadata: metadata
          ? { title: metadata.title, description: metadata.description }
          : blog?.seoMetadata || { title: "", description: "" },
      }
      await updateBlog(blog._id, payload)
      const res = await sendRetryLines(blog._id)
      if (res.data) {
        setSaveContent(res.data)
        setSaveModalOpen(true)
        toast.success("Review the suggested content.")
      } else {
        toast.error("No content received from retry.")
      }
      setUnsavedChanges(false) // Reset unsavedChanges after save
      queryClient.invalidateQueries({ queryKey: ["blog", id] })
    } catch (error) {
      console.error("Error updating the blog:", error)
      toast.error("Failed to save blog.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAcceptSave = () => {
    if (saveContent) {
      setEditorContent(saveContent)
      toast.success("Content updated successfully!")
    }
    setSaveModalOpen(false)
    setSaveContent(null)
  }

  const handleRejectSave = () => {
    setSaveModalOpen(false)
    setSaveContent(null)
    toast.info("Changes discarded.")
  }

  const tabVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

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

    if (isEmpty && !id) navigate("/dashboard")
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
      toast.error("Please fill all required fields correctly.")
      return
    }

    try {
      const res = await createSimpleBlog(blogData)
      setShowTemplateModal(false)
      navigate(`/blog-editor/${res._id}`)
    } catch (err) {
      console.error("Failed to create blog:", err)
      toast.error(err?.message || "Failed to create blog")
    }
  }

  const handleTitleChange = e => {
    const newTitle = e.target.value
    if (getWordCount(newTitle) <= 60) {
      setEditorTitle(newTitle)
      setFormData(prev => ({ ...prev, title: newTitle }))
    } else {
      toast.error("Title exceeds 60 words.")
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
    toast.success("Humanized content applied successfully!")
  }, [humanizedContent, setEditorContent, setIsHumanizeModalOpen])

  const handleAcceptOriginalContent = useCallback(() => {
    setIsHumanizeModalOpen(false)
    toast.info("Retained original content.")
  }, [setIsHumanizeModalOpen])

  if (isBlogFetching || isPosting || blog?.status === "pending") {
    return (
      <div className="fixed inset-0 z-999 flex items-center justify-center bg-white/90 backdrop-blur-sm">
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
        <AnimatePresence>
          {saveModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleRejectSave}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
              >
                <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">AI Suggestions</h3>
                      <p className="text-blue-100 text-sm opacity-80">
                        Optimized content recommendation
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRejectSave}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scroll">
                  <div className="prose prose-slate max-w-none prose-headings:font-black prose-p:text-slate-600 prose-p:leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-bold hover:underline"
                          >
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-black text-slate-900">{children}</strong>
                        ),
                        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                        li: ({ children }) => <li className="mb-2">{children}</li>,
                      }}
                    >
                      {saveContent}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    onClick={handleRejectSave}
                    className="btn btn-ghost h-12 px-6 rounded-2xl font-bold text-slate-400 hover:bg-slate-200 transition-all normal-case"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleAcceptSave}
                    className="btn btn-primary h-12 px-8 rounded-2xl font-black bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white shadow-xl shadow-blue-200 normal-case hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Apply Suggestions
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row grow overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <header className="bg-white shadow-lg border rounded-tl-lg border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 mt-5 lg:mt-0 w-full">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
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
                        : "bg-linear-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105"
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
            <div key={activeTab} className="grow overflow-auto max-h-[800px] custom-scroll">
              {isBlogFetching ? (
                <div className="flex justify-center items-center h-[calc(100vh-120px)]">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                </div>
              ) : (
                <TipTapEditor
                  blog={blog}
                  content={editorContent}
                  setContent={setEditorContent}
                  unsavedChanges={unsavedChanges}
                  setUnsavedChanges={setUnsavedChanges}
                  title={editorTitle}
                  setTitle={setEditorTitle}
                  handleSubmit={handleSave}
                  keywords={keywords}
                  setKeywords={setKeywords}
                  proofreadingResults={proofreadingResults}
                  handleReplace={handleReplace}
                  isSavingKeyword={isSaving}
                  humanizedContent={humanizedContent}
                  showDiff={isHumanizeModalOpen}
                  handleAcceptHumanizedContent={handleAcceptHumanizedContent}
                  handleAcceptOriginalContent={handleAcceptOriginalContent}
                  wordpressMetadata={metadata}
                  onReplaceReady={handleReplaceReady}
                />
              )}
            </div>
          </div>
          <div className="hidden md:block border-l border-gray-200 overflow-y-auto custom-scroll max-h-[900px]">
            <TextEditorSidebar
              activeEditorVersion={1} // Hardcoded to TipTap
              blog={blog}
              keywords={keywords}
              setKeywords={setKeywords}
              onPost={handlePostToWordPress}
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
                  activeEditorVersion={1} // Hardcoded to TipTap
                  blog={blog}
                  keywords={keywords}
                  setKeywords={setKeywords}
                  onPost={handlePostToWordPress}
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
