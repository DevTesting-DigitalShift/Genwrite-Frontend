import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, Reorder } from "framer-motion"
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

// Strip HTML tags from text for clean display
function stripHtml(html) {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent || ""
}

// Parse HTML article content into sections based on blog HTML class structure
function parseHtmlIntoSections(htmlString) {
  if (!htmlString)
    return { title: "", description: "", sections: [], faq: null, cta: null, quickSummary: null }

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, "text/html")

  let title = ""
  let description = ""
  const sections = []
  let faq = null
  let cta = null
  let quickSummary = null

  // Extract title from .blog-title or h1.heading-1
  const titleEl = doc.querySelector(".blog-title, h1.heading-1")
  if (titleEl) {
    title = titleEl.textContent?.trim() || ""
  }

  // Extract description from .blog-description or .meta-description
  const descEl = doc.querySelector(".blog-description, .meta-description")
  if (descEl) {
    description = descEl.textContent?.trim() || ""
  }

  // Extract content sections (.blog-section but not .faq-section)
  const sectionEls = doc.querySelectorAll(".blog-section:not(.faq-section)")
  sectionEls.forEach((secEl, index) => {
    // Get section title from h2.section-title or h3.section-title
    const sectionTitle =
      secEl.querySelector(".section-title")?.textContent?.trim() || `Section ${index + 1}`
    // Get section content from .section-content
    const sectionContent = secEl.querySelector(".section-content")?.innerHTML || ""

    sections.push({
      id: secEl.id || `section-${index}`,
      title: sectionTitle,
      content: sectionContent,
      originalContent: sectionContent,
    })
  })

  // Extract FAQ section
  const faqSection = doc.querySelector(".faq-section")
  if (faqSection) {
    const faqHeading = faqSection.querySelector(".faq-heading")?.textContent?.trim() || "FAQ"
    const faqPairs = faqSection.querySelectorAll(".faq-qa-pair")
    const qa = []
    faqPairs.forEach(pair => {
      const question = pair.querySelector(".faq-question")?.textContent?.trim() || ""
      const answerEl = pair.querySelector(".faq-answer")
      const answer = answerEl?.textContent?.trim() || ""
      if (question) {
        qa.push({ question, answer })
      }
    })
    if (qa.length > 0) {
      faq = { heading: faqHeading, qa }
    }
  }

  // Extract CTA
  const ctaEl = doc.querySelector(".blog-brand-cta, .cta-wrapper")
  if (ctaEl) {
    cta = ctaEl.innerHTML
  }

  // Extract Quick Summary
  const summaryEl = doc.querySelector(".blog-quick-summary, .summary-wrapper")
  if (summaryEl) {
    quickSummary = summaryEl.innerHTML
  }

  return { title, description, sections, faq, cta, quickSummary }
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
  onReplaceReady, // New: callback to expose handleReplaceWithSections to parent
}) => {
  const [isEditorLoading, setIsEditorLoading] = useState(true)
  const [openPreview, setOpenPreview] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)

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

  // Table of contents toggle - initialized from blog options
  const [showTableOfContents, setShowTableOfContents] = useState(false)

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

  // Initialize table of contents toggle from blog options
  useEffect(() => {
    if (blog?.options?.includeTableOfContents !== undefined) {
      setShowTableOfContents(blog.options.includeTableOfContents)
    }
  }, [blog?.options?.includeTableOfContents])

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

  // Parse blog content into sections - PRIORITIZE content field over contentJSON
  useEffect(() => {
    if (blog) {
      let parsedData = {
        title: "",
        description: "",
        sections: [],
        faq: null,
        cta: null,
        quickSummary: null,
      }

      // PRIORITY 1: Use content field - check if content is HTML (article structure with classes)
      if (
        blog.content &&
        (blog.content.includes("<article") ||
          blog.content.includes("<section") ||
          blog.content.includes("blog-section") ||
          blog.content.includes("section-content"))
      ) {
        parsedData = parseHtmlIntoSections(blog.content)
        // Use blog.title as fallback
        if (!parsedData.title && blog.title) {
          parsedData.title = blog.title
        }
      }
      // PRIORITY 2: Content field with markdown (starts with ## or has markdown syntax)
      else if (blog.content && (blog.content.includes("## ") || blog.content.includes("**"))) {
        parsedData.title = blog.title || ""
        parsedData.sections = parseMarkdownIntoSections(blog.content)
      }
      // PRIORITY 3: Plain content - treat as single section
      else if (blog.content) {
        const converter = new showdown.Converter({
          tables: true,
          tasklists: true,
          simpleLineBreaks: true,
        })
        const htmlContent = blog.content.includes("<")
          ? blog.content
          : converter.makeHtml(blog.content)
        parsedData.title = blog.title || ""
        parsedData.sections = [
          {
            id: "section-0",
            title: "Content",
            content: htmlContent,
            originalContent: htmlContent,
          },
        ]
      }
      // FALLBACK: Empty blog, create default structure
      else {
        parsedData.title = blog.title || "Untitled Blog"
        parsedData.sections = []
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

  // Handle find and replace text in sections (for proofreading)
  const handleReplaceInSections = useCallback((original, change) => {
    if (!original || !change) return

    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")

    setSections(prev =>
      prev.map(section => {
        if (section.content && section.content.includes(original)) {
          return {
            ...section,
            content: section.content.replace(regex, change),
          }
        }
        return section
      })
    )
  }, [])

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

  // Wrapped handleReplace that updates both content and local sections
  const handleReplaceWithSections = useCallback(
    (original, change) => {
      if (!original || !change) return

      const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")

      // Update sections locally
      handleReplaceInSections(original, change)

      // Update parent content directly (don't call handleReplace to avoid circular loop)
      if (setContent) {
        setContent(prev => prev.replace(regex, change))
      }
    },
    [handleReplaceInSections, setContent]
  )

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
      handleReplace: handleReplaceWithSections, // Use wrapped version that updates sections
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
      handleReplaceWithSections,
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
        <Tooltip title="Preview">
          <button
            onClick={() => setOpenPreview(true)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
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

        {/* Sections - Drag and Drop enabled */}
        <EditorProvider value={editorContextValue}>
          <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-6">
            {sections.map((section, index) => (
              <SectionCard key={section.id || index} section={section} index={index} />
            ))}
          </Reorder.Group>
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
        width={950}
        centered
        title={
          <div className="flex justify-between items-center w-full pr-4">
            <span className="text-lg font-semibold text-gray-800">Blog Preview</span>
            <div className="flex items-center gap-3">
              {/* Table of Contents Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTableOfContents}
                  onChange={e => setShowTableOfContents(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Table of Contents</span>
              </label>
              <Button
                type="primary"
                onClick={copyContent}
                className="!bg-gradient-to-r !from-indigo-500 !to-purple-600 !shadow-sm hover:!shadow-md mr-5"
              >
                Copy All
              </Button>
            </div>
          </div>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto px-4 pb-6 custom-scroll">
          {/* Blog Title - H1 */}
          <h1 className="text-3xl font-bold mb-4 text-gray-900">{stripHtml(blogTitle)}</h1>

          {/* Featured Image - First section image or main thumbnail */}
          {(() => {
            const mainImage = sectionImages?.find(
              img => img.role === "thumbnail" || img.role === "main"
            )
            const firstSectionImage = sections.length > 0 ? getSectionImage(sections[0]?.id) : null
            const featuredImage = mainImage || firstSectionImage
            if (featuredImage) {
              return (
                <div className="mb-6">
                  <img
                    src={featuredImage.url}
                    alt={featuredImage.altText || blogTitle}
                    className="w-full max-h-[400px] object-cover"
                  />
                  {featuredImage.attribution?.name && (
                    <p className="text-xs text-gray-500 mt-2">
                      Photo by{" "}
                      <a
                        href={featuredImage.attribution.profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {featuredImage.attribution.name}
                      </a>
                    </p>
                  )}
                </div>
              )
            }
            return null
          })()}

          {/* Description */}
          {blogDescription && (
            <p className="text-gray-600 mb-6 leading-relaxed">{blogDescription}</p>
          )}

          {/* Table of Contents - shown when toggle is on */}
          {showTableOfContents && sections.length > 0 && (
            <nav className="mb-8 p-4 bg-gray-50 border border-gray-200">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Table of Contents</h2>
              <ul className="space-y-2">
                {sections.map((sec, i) => (
                  <li key={i}>
                    <a
                      href={`#preview-section-${i}`}
                      className="text-blue-600 hover:underline"
                      onClick={e => {
                        e.preventDefault()
                        document
                          .getElementById(`preview-section-${i}`)
                          ?.scrollIntoView({ behavior: "smooth" })
                      }}
                    >
                      {stripHtml(sec.title)}
                    </a>
                  </li>
                ))}
                {faq && (
                  <li>
                    <a
                      href="#preview-faq"
                      className="text-blue-600 hover:underline"
                      onClick={e => {
                        e.preventDefault()
                        document
                          .getElementById("preview-faq")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }}
                    >
                      {faq.heading}
                    </a>
                  </li>
                )}
              </ul>
            </nav>
          )}

          {/* Blog Sections - Clean layout */}
          {sections.map((sec, i) => {
            const sectionImg = getSectionImage(sec.id)
            return (
              <div key={i} id={`preview-section-${i}`} className="mb-8">
                {/* Section Heading - H2 */}
                <h2 className="text-xl font-semibold mb-3 text-gray-900">{stripHtml(sec.title)}</h2>

                {/* Section Image - only show if not the featured image */}
                {sectionImg && i > 0 && (
                  <div className="mb-4">
                    <img
                      src={sectionImg.url}
                      alt={sectionImg.altText || sec.title}
                      className="w-full max-h-[350px] object-cover"
                    />
                    {sectionImg.attribution?.name && (
                      <p className="text-xs text-gray-500 mt-2">
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

                {/* Section Content - No additional styling, uses blog-content class */}
                <div className="blog-content" dangerouslySetInnerHTML={{ __html: sec.content }} />
              </div>
            )
          })}

          {/* FAQ Section */}
          {faq && (
            <div id="preview-faq" className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">{faq.heading}</h2>
              <div className="space-y-4">
                {faq.qa.map((item, i) => (
                  <div key={i}>
                    <h3 className="font-medium text-gray-900">{item.question}</h3>
                    <p className="text-gray-600 mt-1">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!sections.length && (
            <div className="text-center py-12 text-gray-500">No sections available.</div>
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
