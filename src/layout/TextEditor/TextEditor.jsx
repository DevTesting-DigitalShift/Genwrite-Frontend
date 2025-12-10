import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { RotateCcw, Copy, Eye, Edit3 } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { Modal, Tooltip, message, Button, Input } from "antd"
import TurndownService from "turndown"
import { useBlocker, useLocation, useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { sendRetryLines } from "@api/blogApi"
import { retryBlog } from "@store/slices/blogSlice"
import { useQueryClient } from "@tanstack/react-query"
import "./editor.css"
import LoadingScreen from "@components/UI/LoadingScreen"
import rehypeRaw from "rehype-raw"
import showdown from "showdown"
import SectionCard from "./SectionCard"

const { TextArea } = Input

// Convert HTML → Markdown for saving
function htmlToMarkdownSection(html) {
  if (!html) return ""
  const turndownService = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
  })
  turndownService.keep(["p", "div", "iframe", "table", "tr", "th", "td", "img"])
  return turndownService.turndown(html)
}

// Parse HTML article content into sections
function parseHtmlIntoSections(htmlString) {
  if (!htmlString) return { title: "", description: "", sections: [], faq: null }

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, "text/html")

  let title = ""
  let description = ""
  const sections = []

  // Get title from h1.blog-title
  const titleEl = doc.querySelector(".blog-title")
  if (titleEl) {
    title = titleEl.textContent?.trim() || ""
  }

  // Get description from p.blog-description
  const descEl = doc.querySelector(".blog-description, .meta-description")
  if (descEl) {
    description = descEl.textContent?.trim() || ""
  }

  // Get all blog sections
  const sectionEls = doc.querySelectorAll(".blog-section")
  sectionEls.forEach((secEl, index) => {
    const sectionTitle =
      secEl.querySelector(".section-title")?.textContent?.trim() || `Section ${index + 1}`
    const sectionContent = secEl.querySelector(".section-content")?.innerHTML || ""

    sections.push({
      id: secEl.id || `section-${index}`,
      title: sectionTitle,
      content: sectionContent,
      keywords: [],
      summary: "",
      revealed: false,
      originalContent: sectionContent, // Store for change detection
    })
  })

  return { title, description, sections, faq: null }
}

// Parse markdown into sections (fallback)
function parseMarkdownIntoSections(markdown, keywords = []) {
  if (!markdown) return []

  const headingRegex = /^##\s+(.+)$/gm
  let match
  let introContent = ""

  const matches = []
  while ((match = headingRegex.exec(markdown)) !== null) {
    matches.push({
      title: match[1].trim(),
      index: match.index,
      fullMatch: match[0],
    })
  }

  if (matches.length === 0) {
    const converter = new showdown.Converter()
    const htmlContent = converter.makeHtml(markdown)
    return [
      {
        id: "section-0",
        title: "Content",
        content: htmlContent,
        keywords: keywords,
        summary: "",
        revealed: true,
        originalContent: htmlContent,
      },
    ]
  }

  if (matches[0].index > 0) {
    introContent = markdown.substring(0, matches[0].index).trim()
  }

  const converter = new showdown.Converter()
  const sections = matches.map((m, i) => {
    const startPos = m.index + m.fullMatch.length
    const endPos = i < matches.length - 1 ? matches[i + 1].index : markdown.length
    const sectionContent = markdown.substring(startPos, endPos).trim()

    const fullContent =
      i === 0 && introContent ? introContent + "\n\n" + sectionContent : sectionContent
    const htmlContent = converter.makeHtml(fullContent)

    return {
      id: `section-${i}`,
      title: m.title,
      content: htmlContent,
      keywords: keywords,
      summary: "",
      revealed: false,
      originalContent: htmlContent,
    }
  })

  return sections
}

const TextEditor = ({
  blog,
  activeTab,
  setActiveTab,
  content,
  setContent,
  title,
  proofreadingResults,
  handleReplace,
  isSavingKeyword,
  humanizedContent,
  showDiff,
  handleAcceptHumanizedContent,
  handleAcceptOriginalContent,
  editorContent,
  unsavedChanges,
  setUnsavedChanges,
  wordpressMetadata,
  handleSubmit,
}) => {
  const [isEditorLoading, setIsEditorLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryContent, setRetryContent] = useState(null)
  const [originalContent, setOriginalContent] = useState(null)
  const [retryModalOpen, setRetryModalOpen] = useState(false)
  const [retrySectionIndex, setRetrySectionIndex] = useState(null)
  const [openPreview, setOpenPreview] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [faqRevealed, setFaqRevealed] = useState(false)

  // Sections state
  const [sections, setSections] = useState([])
  const [faq, setFaq] = useState(null)
  const [blogTitle, setBlogTitle] = useState("")
  const [blogDescription, setBlogDescription] = useState("")

  // Track original values for change detection
  const [originalBlogTitle, setOriginalBlogTitle] = useState("")
  const [originalBlogDescription, setOriginalBlogDescription] = useState("")
  const [originalSections, setOriginalSections] = useState([])

  // Editing states for title/description
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)

  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector(state => state.auth.user)
  const userPlan = user?.subscription?.plan
  const hasShownToast = useRef(false)
  const location = useLocation()
  const pathDetect = location.pathname === `/blog-editor/${blog?._id}`
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  // Check if there are actual content changes (not just reveals)
  const hasContentChanges = useMemo(() => {
    // Check title change
    if (blogTitle !== originalBlogTitle) return true

    // Check description change
    if (blogDescription !== originalBlogDescription) return true

    // Check if any sections were deleted
    if (sections.length !== originalSections.length) return true

    // Check if any section content was changed
    for (let i = 0; i < sections.length; i++) {
      const current = sections[i]
      const original = originalSections.find(s => s.id === current.id)
      if (!original) return true // New section
      if (current.content !== original.originalContent) return true
      if (current.title !== original.title) return true
    }

    return false
  }, [
    blogTitle,
    blogDescription,
    sections,
    originalBlogTitle,
    originalBlogDescription,
    originalSections,
  ])

  // Update unsaved changes based on actual content changes
  useEffect(() => {
    setUnsavedChanges(hasContentChanges)
  }, [hasContentChanges, setUnsavedChanges])

  // Parse blog content into sections
  useEffect(() => {
    if (blog) {
      let parsedData = { title: "", description: "", sections: [], faq: null }

      // Check if content is HTML (article structure)
      if (
        (blog.content && blog.content.includes("<article")) ||
        blog.content?.includes("<section")
      ) {
        parsedData = parseHtmlIntoSections(blog.content)
      }
      // Check if blog has contentJSON (section-based structure)
      else if (blog.contentJSON) {
        const data =
          typeof blog.contentJSON === "string" ? JSON.parse(blog.contentJSON) : blog.contentJSON

        parsedData.title = data.title || blog.title || ""
        parsedData.description = data.description || ""

        if (data.sections && Array.isArray(data.sections)) {
          parsedData.sections = data.sections.map((sec, i) => {
            const converter = new showdown.Converter()
            const htmlContent = sec.content?.includes("<")
              ? sec.content
              : converter.makeHtml(sec.content || "")
            return {
              ...sec,
              id: sec.id || `section-${i}`,
              revealed: sec.revealed || false,
              content: htmlContent,
              originalContent: htmlContent,
            }
          })
        }

        if (data.faq) {
          parsedData.faq = data.faq
        }
      }
      // Fallback: Parse as markdown
      else if (blog.content) {
        parsedData.title = blog.title || ""
        parsedData.sections = parseMarkdownIntoSections(blog.content, blog.keywords || [])
      }

      setBlogTitle(parsedData.title)
      setBlogDescription(parsedData.description)
      setSections(parsedData.sections)
      setFaq(parsedData.faq)

      // Store originals for change detection
      setOriginalBlogTitle(parsedData.title)
      setOriginalBlogDescription(parsedData.description)
      setOriginalSections(parsedData.sections.map(s => ({ ...s })))
    }
  }, [blog])

  // Build content for saving (only revealed/edited sections)
  const buildSavePayload = useCallback(() => {
    return {
      title: blogTitle,
      description: blogDescription,
      sections: sections.map(sec => ({
        id: sec.id,
        title: sec.title,
        content: htmlToMarkdownSection(sec.content),
        keywords: sec.keywords || [],
        summary: sec.summary || "",
        revealed: sec.revealed,
      })),
      faq: faq,
    }
  }, [blogTitle, blogDescription, sections, faq])

  // Sync sections back to markdown content for parent
  const syncSectionsToContent = useCallback(() => {
    let markdown = ""

    sections.forEach(sec => {
      markdown += `## ${sec.title}\n\n`
      markdown += htmlToMarkdownSection(sec.content) + "\n\n"
    })

    if (faq && faqRevealed) {
      markdown += `## ${faq.heading}\n\n`
      faq.qa.forEach(item => {
        markdown += `### ${item.question}\n\n${item.answer}\n\n`
      })
    }

    return markdown.trim()
  }, [sections, faq, faqRevealed])

  // Update parent content when sections change
  useEffect(() => {
    const newContent = syncSectionsToContent()
    if (setContent) {
      setContent(newContent)
    }
  }, [sections, faqRevealed, syncSectionsToContent, setContent])

  // Handle reveal section (doesn't count as unsaved change)
  const handleReveal = index => {
    setSections(prev => prev.map((s, i) => (i === index ? { ...s, revealed: true } : s)))
    // Also update originalSections to reflect revealed state
    setOriginalSections(prev => prev.map((s, i) => (i === index ? { ...s, revealed: true } : s)))
  }

  // Handle delete section
  const handleDelete = index => {
    handlePopup({
      title: "Delete Section",
      description: "Are you sure you want to delete this section? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: () => {
        setSections(prev => prev.filter((_, i) => i !== index))
        message.success("Section deleted")
      },
    })
  }

  // Handle section content change
  const handleSectionChange = (index, updatedSection) => {
    setSections(prev => prev.map((s, i) => (i === index ? { ...s, ...updatedSection } : s)))
  }

  // Handle section title change
  const handleSectionTitleChange = (index, newTitle) => {
    setSections(prev => prev.map((s, i) => (i === index ? { ...s, title: newTitle } : s)))
  }

  // Handle regenerate section
  const handleRegenerate = async index => {
    if (!blog?._id) {
      message.error("Blog ID is missing.")
      return
    }

    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
      return
    }

    const section = sections[index]
    setRetrySectionIndex(index)
    setOriginalContent(htmlToMarkdownSection(section.content))

    const payload = {
      contentPart: htmlToMarkdownSection(section.content).trim(),
      sectionIndex: index,
      sectionTitle: section.title,
    }

    handlePopup({
      title: "Regenerate Section",
      description: (
        <>
          Do you want to regenerate this section?{" "}
          <span className="font-bold">This will use your credits.</span>
        </>
      ),
      confirmText: "Yes, Regenerate",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setIsRetrying(true)
          const res = await sendRetryLines(blog._id, payload)
          if (res.data) {
            setRetryContent(res.data)
            setRetryModalOpen(true)
          } else {
            message.error("No content received from regeneration.")
          }
        } catch (error) {
          console.error("Regeneration failed:", error)
          message.error(error.message || "Regeneration failed.")
        } finally {
          setIsRetrying(false)
        }
      },
    })
  }

  // Handle full blog regenerate
  const handleReGenerate = async () => {
    if (!blog?._id) {
      message.error("Blog ID is missing.")
      return
    }

    const payload = { createNew: true }
    try {
      await dispatch(retryBlog({ id: blog._id, payload }))
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      queryClient.invalidateQueries({ queryKey: ["blog", blog._id] })
      setUnsavedChanges(false)
      navigate("/blogs")
    } catch (error) {
      console.error("Retry failed:", error)
      message.error(error.message || "Retry failed.")
    }
  }

  const handleFullRegenerate = async () => {
    if (userPlan === "free" || userPlan === "basic") {
      navigate("/pricing")
      return
    }

    const modelCostMap = { gemini: 10, chatgpt: 30, claude: 50 }
    const credits = modelCostMap[blog?.aiModel?.toLowerCase()] || 10

    handlePopup({
      title: "Regenerate Blog",
      description: (
        <>
          Are you sure you want to regenerate this blog?{" "}
          <span className="font-bold">This will cost {credits} credits</span>
        </>
      ),
      onConfirm: handleReGenerate,
    })
  }

  // Accept regenerated content
  const handleAcceptRetry = () => {
    if (!retryContent || retrySectionIndex === null) return

    const converter = new showdown.Converter()
    const htmlContent = retryContent.includes("<") ? retryContent : converter.makeHtml(retryContent)

    setSections(prev =>
      prev.map((s, i) => (i === retrySectionIndex ? { ...s, content: htmlContent } : s))
    )

    message.success("Section regenerated successfully!")
    setRetryModalOpen(false)
    setRetryContent(null)
    setOriginalContent(null)
    setRetrySectionIndex(null)
  }

  // Reject regenerated content
  const handleRejectRetry = () => {
    setRetryModalOpen(false)
    setRetryContent(null)
    setOriginalContent(null)
    setRetrySectionIndex(null)
    message.info("Regeneration discarded.")
  }

  // Get revealed sections for preview
  const revealedSections = useMemo(() => sections.filter(s => s.revealed), [sections])

  // Copy all content
  const copyContent = async () => {
    try {
      const markdown = syncSectionsToContent()
      await navigator.clipboard.writeText(markdown)
      message.success("Content copied to clipboard!")
    } catch (err) {
      message.error("Failed to copy content.")
    }
  }

  // Navigation blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasContentChanges && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("You have unsaved changes, are you sure you want to leave?")) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  useEffect(() => {
    setIsEditorLoading(true)
    const timer = setTimeout(() => setIsEditorLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (blog?.status === "failed" && !hasShownToast.current) {
      message.error("Your blog generation failed. You can write blog manually.")
      hasShownToast.current = true
    }
  }, [blog?.status])

  // Render section item using SectionCard component
  const renderSectionItem = (section, index) => {
    const locked = userPlan === "free" && index > 1
    const isEditing = editingIndex === index

    return (
      <SectionCard
        key={section.id || index}
        section={section}
        index={index}
        isEditing={isEditing}
        locked={locked}
        onReveal={() => handleReveal(index)}
        onDelete={() => handleDelete(index)}
        onRegenerate={() => handleRegenerate(index)}
        onContentChange={updates => handleSectionChange(index, updates)}
        onTitleChange={newTitle => handleSectionTitleChange(index, newTitle)}
        onStartEditing={() => setEditingIndex(index)}
        onStopEditing={() => setEditingIndex(null)}
        onNavigateToPricing={() => navigate("/pricing")}
      />
    )
  }

  // Render FAQ section
  const renderFAQ = () => {
    if (!faq) return null

    return (
      <motion.div
        className="relative border rounded-xl p-5 shadow-sm bg-white mb-6 cursor-pointer hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setFaqRevealed(true)}
      >
        {!faqRevealed && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Click to Reveal FAQ
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4">{faq.heading}</h2>

        <div className="space-y-6">
          {faq.qa.map((item, i) => (
            <div key={i}>
              <h3 className="font-semibold text-lg">{item.question}</h3>
              <p className="text-gray-600 mt-1">{item.answer}</p>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  // Render toolbar
  const renderToolbar = () => (
    <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-4">
        <span className="text-gray-600 text-sm">
          <span className="font-semibold">{revealedSections.length}</span> / {sections.length}{" "}
          sections revealed
        </span>
        {hasContentChanges && (
          <span className="text-orange-600 text-sm font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Unsaved changes
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Tooltip title="Copy All Content">
          <button
            onClick={copyContent}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copy</span>
          </button>
        </Tooltip>

        <Tooltip title="Preview">
          <button
            onClick={() => setOpenPreview(true)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </Tooltip>

        {!pathDetect && (
          <Tooltip title="Regenerate All">
            <button
              onClick={handleFullRegenerate}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )

  // Render content area
  const renderContentArea = () => {
    if (isEditorLoading || blog?.status === "pending") {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-300px)] bg-white">
          <LoadingScreen />
        </div>
      )
    }

    return (
      <div className="p-4 sm:p-6 bg-white min-h-screen">
        {/* Blog title - editable */}
        <div className="mb-4">
          {isEditingTitle ? (
            <Input
              value={blogTitle}
              onChange={e => setBlogTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onPressEnter={() => setIsEditingTitle(false)}
              autoFocus
              className="text-3xl font-bold w-full"
              placeholder="Enter blog title..."
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => setIsEditingTitle(true)}
            >
              <h1 className="text-3xl font-bold text-gray-900">{blogTitle || "Untitled Blog"}</h1>
              <Edit3 className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Blog description - editable */}
        <div className="mb-8">
          {isEditingDescription ? (
            <TextArea
              value={blogDescription}
              onChange={e => setBlogDescription(e.target.value)}
              onBlur={() => setIsEditingDescription(false)}
              autoFocus
              autoSize={{ minRows: 2, maxRows: 6 }}
              className="text-gray-600"
              placeholder="Enter blog description..."
            />
          ) : (
            <div
              className="flex items-start gap-2 group cursor-pointer"
              onClick={() => setIsEditingDescription(true)}
            >
              <p className="text-gray-600 flex-1">
                {blogDescription || "Click to add description..."}
              </p>
              <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => renderSectionItem(section, index))}
          {renderFAQ()}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(isRetrying || isSavingKeyword) && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <LoadingScreen />
        </div>
      )}

      {/* Retry Modal */}
      {retryModalOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <h3 className="text-lg font-semibold mb-4">Regenerated Content</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Original</h4>
                <div className="p-4 bg-gray-100 rounded-md prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {originalContent || "No content"}
                  </ReactMarkdown>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Regenerated</h4>
                <div className="p-4 bg-green-50 rounded-md prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {retryContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleRejectRetry}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Reject
              </button>
              <button
                onClick={handleAcceptRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Preview Modal */}
      <Modal
        open={openPreview}
        onCancel={() => setOpenPreview(false)}
        footer={null}
        width={900}
        centered
        title={
          <div className="flex justify-between items-center w-full pr-8">
            <span className="text-xl font-bold">Preview</span>
            <Button type="primary" onClick={copyContent}>
              Copy All
            </Button>
          </div>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto px-2">
          <h1 className="text-3xl font-bold mb-2">{blogTitle}</h1>
          {blogDescription && <p className="text-gray-600 mb-6">{blogDescription}</p>}

          {revealedSections.map((sec, i) => (
            <div key={i} className="mb-10">
              <h2 className="text-2xl font-bold mb-4">{sec.title}</h2>
              <div
                className="prose max-w-none blog-content"
                dangerouslySetInnerHTML={{ __html: sec.content }}
              />
            </div>
          ))}

          {faq && faqRevealed && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold mb-4">{faq.heading}</h2>
              {faq.qa.map((item, i) => (
                <div key={i} className="mt-4">
                  <h3 className="font-semibold text-lg">{item.question}</h3>
                  <p className="text-gray-700 mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          )}

          {revealedSections.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No sections revealed yet. Click on sections to reveal their content.
            </div>
          )}
        </div>
      </Modal>

      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-50 bg-white shadow-sm">{renderToolbar()}</div>
        <div className="flex-1 overflow-auto">{renderContentArea()}</div>
      </div>
    </motion.div>
  )
}

export default TextEditor
