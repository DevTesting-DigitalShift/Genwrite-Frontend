import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Copy, Eye, Edit3, RefreshCw, Plus, Trash2 } from "lucide-react"
import { useSelector } from "react-redux"
import { Modal, Tooltip, message, Button, Input } from "antd"

const { TextArea } = Input
import TurndownService from "turndown"
import { useBlocker, useLocation, useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import "./editor.css"
import LoadingScreen from "@components/UI/LoadingScreen"
import showdown from "showdown"
import SectionCard from "./SectionCard"
import { EditorProvider } from "./EditorContext"
import InlineEditor from "./InlineEditor"
import RegenerateModal from "../TextEditorSidebar/RegenerateModal"

// Configure showdown for better image handling
showdown.setOption("tables", true)
showdown.setOption("tasklists", true)
showdown.setOption("simpleLineBreaks", true)
showdown.setOption("openLinksInNewWindow", true)
showdown.setOption("emoji", true)

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

  const titleEl = doc.querySelector(".blog-title")
  if (titleEl) {
    title = titleEl.textContent?.trim() || ""
  }

  const descEl = doc.querySelector(".blog-description, .meta-description")
  if (descEl) {
    description = descEl.textContent?.trim() || ""
  }

  const sectionEls = doc.querySelectorAll(".blog-section")
  sectionEls.forEach((secEl, index) => {
    const sectionTitle =
      secEl.querySelector(".section-title")?.textContent?.trim() || `Section ${index + 1}`
    const sectionContent = secEl.querySelector(".section-content")?.innerHTML || ""

    sections.push({
      id: secEl.id || `section-${index}`,
      title: sectionTitle,
      content: sectionContent,
      originalContent: sectionContent,
    })
  })

  return { title, description, sections, faq: null }
}

// Parse markdown into sections with proper image handling
function parseMarkdownIntoSections(markdown) {
  if (!markdown) return []

  const converter = new showdown.Converter({
    tables: true,
    tasklists: true,
    simpleLineBreaks: true,
    openLinksInNewWindow: true,
  })

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
    const htmlContent = converter.makeHtml(markdown)
    return [
      {
        id: "section-0",
        title: "Content",
        content: htmlContent,
        originalContent: htmlContent,
      },
    ]
  }

  if (matches[0].index > 0) {
    introContent = markdown.substring(0, matches[0].index).trim()
  }

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
  const [openPreview, setOpenPreview] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [isRegenerateSidebarOpen, setIsRegenerateSidebarOpen] = useState(false)

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

  // Section images state
  const [sectionImages, setSectionImages] = useState([])

  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const user = useSelector(state => state.auth.user)
  const userPlan = user?.subscription?.plan
  const hasShownToast = useRef(false)
  const location = useLocation()
  const pathDetect = location.pathname === `/blog-editor/${blog?._id}`

  // Initialize section images from blog
  useEffect(() => {
    if (blog?.images && Array.isArray(blog.images)) {
      setSectionImages(blog.images)
    }
  }, [blog?.images])

  // Get section image by sectionId
  const getSectionImage = useCallback(
    sectionId => {
      if (!sectionImages || !Array.isArray(sectionImages)) return null
      return sectionImages.find(img => img.sectionId === sectionId && img.role === "section")
    },
    [sectionImages]
  )

  // Update section image
  const handleUpdateSectionImage = useCallback((sectionId, updatedImage) => {
    setSectionImages(prev =>
      prev.map(img =>
        img.sectionId === sectionId && img.role === "section" ? { ...img, ...updatedImage } : img
      )
    )
  }, [])

  // Delete section image
  const handleDeleteSectionImage = useCallback(sectionId => {
    setSectionImages(prev =>
      prev.filter(img => !(img.sectionId === sectionId && img.role === "section"))
    )
  }, [])

  // Check if there are actual content changes
  const hasContentChanges = useMemo(() => {
    if (blogTitle !== originalBlogTitle) return true
    if (blogDescription !== originalBlogDescription) return true
    if (sections.length !== originalSections.length) return true

    for (let i = 0; i < sections.length; i++) {
      const current = sections[i]
      const original = originalSections.find(s => s.id === current.id)
      if (!original) return true
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
          const converter = new showdown.Converter({
            tables: true,
            tasklists: true,
            simpleLineBreaks: true,
          })

          parsedData.sections = data.sections.map((sec, i) => {
            // Check if content is already HTML or needs conversion from markdown
            const htmlContent = sec.content?.includes("<")
              ? sec.content
              : converter.makeHtml(sec.content || "")
            return {
              ...sec,
              id: sec.id || `section-${i}`,
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
        parsedData.sections = parseMarkdownIntoSections(blog.content)
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

  // Sync sections back to markdown content for parent
  const syncSectionsToContent = useCallback(() => {
    let markdown = ""

    sections.forEach(sec => {
      markdown += `## ${sec.title}\n\n`
      markdown += htmlToMarkdownSection(sec.content) + "\n\n"
    })

    if (faq) {
      markdown += `## ${faq.heading}\n\n`
      faq.qa.forEach(item => {
        markdown += `### ${item.question}\n\n${item.answer}\n\n`
      })
    }

    return markdown.trim()
  }, [sections, faq])

  // Update parent content when sections change
  useEffect(() => {
    const newContent = syncSectionsToContent()
    if (setContent) {
      setContent(newContent)
    }
  }, [sections, syncSectionsToContent, setContent])

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

  // Handle add section below
  const handleAddSection = afterIndex => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      content: "<p>Start writing here...</p>",
      originalContent: "",
    }
    setSections(prev => {
      const newSections = [...prev]
      newSections.splice(afterIndex + 1, 0, newSection)
      return newSections
    })
    message.success("New section added")
  }

  // Handle move section up or down
  const handleMoveSection = (index, direction) => {
    setSections(prev => {
      const newSections = [...prev]
      const targetIndex = direction === "up" ? index - 1 : index + 1

      if (targetIndex < 0 || targetIndex >= newSections.length) return prev

      // Swap sections
      const temp = newSections[index]
      newSections[index] = newSections[targetIndex]
      newSections[targetIndex] = temp

      return newSections
    })
  }

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

  // Editor context value for child components
  const editorContextValue = useMemo(
    () => ({
      userPlan,
      editingIndex,
      setEditingIndex,
      handleDelete,
      handleSectionChange,
      handleSectionTitleChange,
      handleAddSection,
      handleMoveSection,
      sectionsCount: sections.length,
      navigateToPricing: () => navigate("/pricing"),
      getSectionImage,
      proofreadingResults: proofreadingResults || [],
      onUpdateSectionImage: handleUpdateSectionImage,
      onDeleteSectionImage: handleDeleteSectionImage,
    }),
    [
      userPlan,
      editingIndex,
      handleDelete,
      handleSectionChange,
      handleSectionTitleChange,
      handleAddSection,
      handleMoveSection,
      sections.length,
      navigate,
      getSectionImage,
      proofreadingResults,
      handleUpdateSectionImage,
      handleDeleteSectionImage,
    ]
  )

  // Handle FAQ edit
  const handleFaqEdit = (index, field, value) => {
    setFaq(prev => {
      if (!prev) return prev
      const newQa = [...prev.qa]
      newQa[index] = { ...newQa[index], [field]: value }
      return { ...prev, qa: newQa }
    })
  }

  // Handle FAQ heading edit
  const handleFaqHeadingEdit = value => {
    setFaq(prev => (prev ? { ...prev, heading: value } : prev))
  }

  // Handle add FAQ item
  const handleAddFaqItem = () => {
    setFaq(prev => {
      if (!prev) return prev
      return {
        ...prev,
        qa: [...prev.qa, { question: "New Question", answer: "New Answer" }],
      }
    })
  }

  // Handle delete FAQ item
  const handleDeleteFaqItem = index => {
    setFaq(prev => {
      if (!prev) return prev
      return {
        ...prev,
        qa: prev.qa.filter((_, i) => i !== index),
      }
    })
  }

  // Render FAQ section - editable
  const [editingFaqIndex, setEditingFaqIndex] = useState(null)
  const [editingFaqHeading, setEditingFaqHeading] = useState(false)

  const renderFAQ = () => {
    if (!faq) return null

    return (
      <motion.div
        className="border rounded-xl p-5 shadow-sm bg-white mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Editable Heading - using InlineEditor */}
        <div className="flex items-center justify-between mb-4">
          {editingFaqHeading ? (
            <InlineEditor
              value={faq.heading}
              onChange={handleFaqHeadingEdit}
              placeholder="FAQ Heading..."
              onBlur={() => setEditingFaqHeading(false)}
              autoFocus
              singleLine
              editorClassName="text-2xl font-bold"
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => setEditingFaqHeading(true)}
            >
              <h2 className="text-2xl font-bold">{faq.heading}</h2>
              <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <button
            onClick={handleAddFaqItem}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>

        <div className="space-y-4">
          {faq.qa.map((item, i) => (
            <div
              key={i}
              className="relative group p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDeleteFaqItem(i)}
                className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Question - editable with InlineEditor */}
              {editingFaqIndex === `q-${i}` ? (
                <div className="mb-2">
                  <InlineEditor
                    value={item.question}
                    onChange={val => handleFaqEdit(i, "question", val)}
                    placeholder="Enter question..."
                    onBlur={() => setEditingFaqIndex(null)}
                    autoFocus
                    singleLine
                    editorClassName="font-semibold text-lg"
                  />
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 cursor-pointer mb-2"
                  onClick={() => setEditingFaqIndex(`q-${i}`)}
                >
                  <h3 className="font-semibold text-lg">{item.question}</h3>
                  <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {/* Answer - editable with InlineEditor */}
              {editingFaqIndex === `a-${i}` ? (
                <InlineEditor
                  value={item.answer}
                  onChange={val => handleFaqEdit(i, "answer", val)}
                  placeholder="Enter answer..."
                  onBlur={() => setEditingFaqIndex(null)}
                  autoFocus
                  editorClassName="text-gray-600"
                />
              ) : (
                <div className="cursor-pointer" onClick={() => setEditingFaqIndex(`a-${i}`)}>
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              )}
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
          <span className="font-semibold">{sections.length}</span> sections
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

        <Tooltip title="Regenerate Blog">
          <button
            onClick={() => setIsRegenerateSidebarOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </Tooltip>
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
        {/* Blog title - editable with rich text bubble menu */}
        <div className="mb-4">
          {isEditingTitle ? (
            <InlineEditor
              value={blogTitle}
              onChange={setBlogTitle}
              placeholder="Enter blog title..."
              onBlur={() => setIsEditingTitle(false)}
              autoFocus
              singleLine
              editorClassName="text-3xl font-bold text-gray-900"
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => setIsEditingTitle(true)}
            >
              <div
                className="text-3xl font-bold text-gray-900"
                dangerouslySetInnerHTML={{ __html: blogTitle || "Untitled Blog" }}
              />
              <Edit3 className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Blog description - editable with rich text bubble menu */}
        <div className="mb-8">
          {isEditingDescription ? (
            <InlineEditor
              value={blogDescription}
              onChange={setBlogDescription}
              placeholder="Enter blog description..."
              onBlur={() => setIsEditingDescription(false)}
              autoFocus
              editorClassName="text-gray-600"
            />
          ) : (
            <div
              className="flex items-start gap-2 group cursor-pointer"
              onClick={() => setIsEditingDescription(true)}
            >
              <div
                className="text-gray-600 flex-1"
                dangerouslySetInnerHTML={{
                  __html: blogDescription || "Click to add description...",
                }}
              />
              <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
          )}
        </div>

        {/* Sections */}
        <EditorProvider value={editorContextValue}>
          <div className="space-y-6">
            {sections.map((section, index) => (
              <SectionCard key={section.id || index} section={section} index={index} />
            ))}
          </div>
        </EditorProvider>
        {renderFAQ()}
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
      {isSavingKeyword && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <LoadingScreen />
        </div>
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

          {sections.map((sec, i) => {
            const sectionImg = getSectionImage(sec.id)
            return (
              <div key={i} className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{sec.title}</h2>
                {/* Section Image */}
                {sectionImg && (
                  <div className="mb-4">
                    <img
                      src={sectionImg.url}
                      alt={sectionImg.altText || sec.title}
                      className="w-full max-h-96 object-cover rounded-lg shadow-md"
                    />
                    {sectionImg.attribution?.name && (
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Photo by{" "}
                        <a
                          href={sectionImg.attribution.profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {sectionImg.attribution.name}
                        </a>
                      </p>
                    )}
                  </div>
                )}
                <div
                  className="prose max-w-none blog-content"
                  dangerouslySetInnerHTML={{ __html: sec.content }}
                />
              </div>
            )
          })}

          {faq && (
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

          {sections.length === 0 && (
            <div className="text-center py-10 text-gray-500">No sections available.</div>
          )}
        </div>
      </Modal>

      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-50 bg-white shadow-sm">{renderToolbar()}</div>
        <div className="flex-1 overflow-auto">{renderContentArea()}</div>
      </div>

      {/* Regenerate Modal */}
      <RegenerateModal
        blog={blog}
        isOpen={isRegenerateSidebarOpen}
        onClose={() => setIsRegenerateSidebarOpen(false)}
      />
    </motion.div>
  )
}

export default TextEditor
