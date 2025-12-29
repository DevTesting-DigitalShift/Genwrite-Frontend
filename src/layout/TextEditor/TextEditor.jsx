import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, Reorder } from "framer-motion"
import {
  Copy,
  Eye,
  Edit3,
  RefreshCw,
  Plus,
  Trash2,
  Info,
  Check,
  Image as ImageIcon,
} from "lucide-react"
import { useSelector } from "react-redux"
import { Modal, Tooltip, message, Button, Input, Popover } from "antd"

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

// Generate unique custom ID for sections
function generateSectionId() {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `sec-${timestamp}-${randomStr}`
}

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

// Helper function to convert markdown to HTML
function convertMarkdownToHtml(text) {
  if (!text) return text

  const converter = new showdown.Converter({
    tables: true,
    tasklists: true,
    simpleLineBreaks: true,
    openLinksInNewWindow: true,
    emoji: true,
  })

  return converter.makeHtml(text)
}

// Helper function to clean mixed markdown/HTML content
function cleanMixedContent(content) {
  if (!content) return content

  // Check if content has markdown syntax (**, !, [], etc.)
  const hasMarkdown = /\*\*|__|\!\[|\]\(|^\s*#{1,6}\s/m.test(content)

  if (hasMarkdown) {
    // Convert markdown to HTML
    return convertMarkdownToHtml(content)
  }

  return content
}

// Parse HTML article content into sections based on blog HTML class structure
function parseHtmlIntoSections(htmlString) {
  if (!htmlString)
    return {
      title: "",
      description: "",
      thumbnail: null,
      sections: [],
      sectionImages: [],
      faq: null,
      cta: null,
      quickSummary: null,
    }

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, "text/html")

  let title = ""
  let description = ""
  let thumbnail = null
  const sections = []
  const sectionImages = []
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
    description = cleanMixedContent(descEl.innerHTML || "")
  }

  // Extract Main Image (Figure) - DO NOT add to sections, handle separately
  const mainImageEl = doc.querySelector("figure.section-thumbnail, figure.thumbnail-main")
  if (mainImageEl) {
    // Extract image data
    const imgEl = mainImageEl.querySelector("img")
    if (imgEl) {
      thumbnail = {
        url: imgEl.getAttribute("src") || "",
        alt: imgEl.getAttribute("alt") || "",
        html: mainImageEl.outerHTML,
      }
    }
    // Remove the thumbnail from the document so it doesn't get parsed into sections
    mainImageEl.remove()
  }

  // Extract content sections (.blog-section but not .faq-section)
  const sectionEls = doc.querySelectorAll(".blog-section:not(.faq-section)")
  sectionEls.forEach((secEl, index) => {
    // Get section title from h2.section-title or h3.section-title
    const sectionTitle =
      secEl.querySelector(".section-title")?.textContent?.trim() || `Section ${index + 1}`
    // Get section content from .section-content
    const rawContent = secEl.querySelector(".section-content")?.innerHTML || ""
    const sectionContent = cleanMixedContent(rawContent)

    // PRESERVE existing section ID from HTML, only generate new ID if not present
    const existingId = secEl.getAttribute("id")
    const sectionId = existingId || generateSectionId()

    // Extract section images from .section-images-wrapper
    const imagesWrapper = secEl.querySelector(".section-images-wrapper")
    if (imagesWrapper) {
      const imageElements = imagesWrapper.querySelectorAll(".section-image img")
      imageElements.forEach(imgEl => {
        const figcaption = imgEl.closest("figure")?.querySelector("figcaption")
        const attributionLink = figcaption?.querySelector("a")

        sectionImages.push({
          sectionId: sectionId,
          role: "section",
          url: imgEl.getAttribute("src") || "",
          altText: imgEl.getAttribute("alt") || "",
          attribution: attributionLink
            ? {
                name: attributionLink.textContent?.trim() || "",
                profile: attributionLink.getAttribute("href") || "",
              }
            : null,
        })
      })
    }

    sections.push({
      id: sectionId,
      title: sectionTitle,
      content: sectionContent,
      originalContent: sectionContent,
    })
  })

  // Extract FAQ section (Structured)
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

  // Fallback: Check if FAQ is embedded in the last section (common AI issue)
  if (!faq && sections.length > 0) {
    const lastSec = sections[sections.length - 1]
    // Check for FAQ header
    const faqMatch = lastSec.content.match(
      /(<h[2-4][^>]*>\s*(?:FAQ|Frequently Asked Questions)\s*<\/h[2-4]>)/i
    )

    if (faqMatch) {
      const splitIndex = faqMatch.index
      const contentBefore = lastSec.content.substring(0, splitIndex)
      const faqContentRaw = lastSec.content.substring(splitIndex)

      // Update last section to remove FAQ part
      lastSec.content = contentBefore
      lastSec.originalContent = contentBefore // Assume this is "correcting" the parse

      // Try to structure it, or just add as a new section
      // For simplicity and robustness, add as a new Text Section for now, so user can edit it separate
      // The structured FAQ editor requires parsing QA pairs which might fail on raw HTML
      sections.push({
        id: generateSectionId(),
        title: "FAQ",
        content: faqContentRaw,
        originalContent: faqContentRaw,
      })
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

  return { title, description, thumbnail, sections, sectionImages, faq, cta, quickSummary }
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
        id: generateSectionId(),
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
      id: generateSectionId(),
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
  const [blogThumbnail, setBlogThumbnail] = useState(null)

  // Track original values for change detection - use refs to store the snapshot
  const [originalBlogTitle, setOriginalBlogTitle] = useState("")
  const [originalBlogDescription, setOriginalBlogDescription] = useState("")
  const [originalSections, setOriginalSections] = useState([])

  // Track if originals have been initialized
  const originalsInitialized = useRef(false)

  // Track the blog ID to detect when we're loading a different blog
  const lastBlogIdRef = useRef(null)

  // Editing states for title/description
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)

  // Thumbnail edit modal state
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [thumbnailAlt, setThumbnailAlt] = useState("")

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

  // Helper to normalize content for comparison (strip formatting, whitespace)
  const normalizeContent = useCallback(content => {
    if (!content) return ""
    // Strip HTML tags and normalize whitespace
    const text = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
    return text
  }, [])

  // Check if there are actual content changes
  const hasContentChanges = useMemo(() => {
    // Don't check for changes until originals are initialized
    if (!originalsInitialized.current) {
      return false
    }

    // Compare titles (normalize for comparison)
    const currentTitle = normalizeContent(blogTitle)
    const originalTitle = normalizeContent(originalBlogTitle)
    if (currentTitle !== originalTitle) {
      return true
    }

    // Compare descriptions
    const currentDesc = normalizeContent(blogDescription)
    const originalDesc = normalizeContent(originalBlogDescription)
    if (currentDesc !== originalDesc) {
      return true
    }

    // Compare number of sections
    if (sections.length !== originalSections.length) {
      return true
    }

    // Compare each section's content
    for (let i = 0; i < sections.length; i++) {
      const current = sections[i]
      const original = originalSections.find(s => s.id === current.id)

      if (!original) {
        // New section added
        return true
      }

      // Compare section titles
      const currentSectionTitle = normalizeContent(current.title)
      const originalSectionTitle = normalizeContent(original.title)
      if (currentSectionTitle !== originalSectionTitle) {
        return true
      }

      // Compare section content (this is the key part)
      const currentContent = normalizeContent(current.content)
      const originalContent = normalizeContent(original.originalContent)

      if (currentContent !== originalContent) {
        return true
      }
    }

    return false
  }, [
    blogTitle,
    blogDescription,
    sections,
    originalBlogTitle,
    originalBlogDescription,
    originalSections,
    normalizeContent,
  ])

  // Update unsaved changes based on actual content changes
  useEffect(() => {
    setUnsavedChanges(hasContentChanges)
  }, [hasContentChanges, setUnsavedChanges])

  // Parse blog content into sections - PRIORITIZE content field over contentJSON
  useEffect(() => {
    if (blog) {
      // Check if we're loading a different blog
      if (lastBlogIdRef.current !== blog._id) {
        // Reset initialization flag for new blog
        originalsInitialized.current = false
        lastBlogIdRef.current = blog._id
      }

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
            id: generateSectionId(),
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

      // Set current state
      setBlogTitle(parsedData.title)
      setBlogDescription(parsedData.description)
      setBlogThumbnail(parsedData.thumbnail)
      setSections(parsedData.sections)
      setFaq(parsedData.faq)

      // Merge section images from parsed HTML with existing blog images
      if (parsedData.sectionImages && parsedData.sectionImages.length > 0) {
        setSectionImages(prev => {
          // Keep existing images that are not section images, or are for different sections
          const nonSectionImages = prev.filter(img => img.role !== "section")
          // Combine with newly parsed section images
          return [...nonSectionImages, ...parsedData.sectionImages]
        })
      }

      // Initialize originals ONLY if not already initialized for this blog
      if (!originalsInitialized.current) {
        // Use setTimeout to ensure state has settled
        setTimeout(() => {
          setOriginalBlogTitle(parsedData.title)
          setOriginalBlogDescription(parsedData.description)
          // Deep copy sections with originalContent preserved
          setOriginalSections(
            parsedData.sections.map(s => ({
              id: s.id,
              title: s.title,
              content: s.content,
              originalContent: s.originalContent || s.content,
            }))
          )
          originalsInitialized.current = true
        }, 150)
      }
    }
  }, [blog])

  // Reset original values when blog is saved (updatedAt changes)
  useEffect(() => {
    if (blog?.updatedAt && originalsInitialized.current) {
      // Update originals to current state to clear "unsaved changes" after save
      setOriginalBlogTitle(blogTitle)
      setOriginalBlogDescription(blogDescription)
      setOriginalSections(
        sections.map(s => ({
          id: s.id,
          title: s.title,
          content: s.content,
          originalContent: s.content, // Set originalContent to current content after save
        }))
      )
    }
  }, [blog?.updatedAt])

  // Sync sections to HTML content for saving (with proper blog structure and classes)
  const syncSectionsToHTML = useCallback(() => {
    let html = '<article class="blog-article">\n'

    // Add title
    if (blogTitle) {
      html += `  <h1 class="blog-title heading-1">${blogTitle}</h1>\n`
    }

    // Add description
    if (blogDescription) {
      html += `  <div class="blog-description meta-description">${blogDescription}</div>\n`
    }

    // Add sections
    sections.forEach(sec => {
      html += `  <section class="blog-section" id="${sec.id}">\n`
      html += `    <h2 class="section-title">${sec.title}</h2>\n`

      // Add section images if they exist
      const secImages = sectionImages.filter(
        img => img.sectionId === sec.id && img.role === "section"
      )
      if (secImages.length > 0) {
        html += `    <div class="section-images-wrapper">\n`
        secImages.forEach((img, idx) => {
          html += `      <figure class="section-image image-${idx}">\n`
          html += `        <img src="${img.url}" alt="${
            img.altText || ""
          }" class="content-image" loading="lazy" />\n`
          if (img.attribution && img.attribution.name) {
            html += `        <figcaption class="image-attribution">\n`
            html += `          <p>Photo by <a href="${img.attribution.profile}">${img.attribution.name}</a></p>\n`
            html += `        </figcaption>\n`
          }
          html += `      </figure>\n`
        })
        html += `    </div>\n`
      }

      html += `    <div class="section-content">${sec.content}</div>\n`
      html += `  </section>\n`
    })

    // Add FAQ if exists
    if (faq && faq.qa && faq.qa.length > 0) {
      html += `  <section class="blog-section faq-section">\n`
      html += `    <h2 class="faq-heading">${faq.heading}</h2>\n`
      faq.qa.forEach(item => {
        html += `    <div class="faq-qa-pair">\n`
        html += `      <h3 class="faq-question">${item.question}</h3>\n`
        html += `      <p class="faq-answer">${item.answer}</p>\n`
        html += `    </div>\n`
      })
      html += `  </section>\n`
    }

    html += "</article>"
    return html
  }, [sections, faq, blogTitle, blogDescription, sectionImages])

  // Update parent content when sections change
  useEffect(() => {
    const newContent = syncSectionsToHTML()
    if (setContent) {
      setContent(newContent)
    }
  }, [sections, syncSectionsToHTML, setContent])

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
    setSections(prev =>
      prev.map((s, i) => {
        if (i === index) {
          // Preserve originalContent when updating section
          return {
            ...s,
            ...updatedSection,
            originalContent: s.originalContent, // Keep the original reference
          }
        }
        return s
      })
    )
  }

  // Handle section title change
  const handleSectionTitleChange = (index, newTitle) => {
    setSections(prev =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              title: newTitle,
              originalContent: s.originalContent, // Preserve original
            }
          : s
      )
    )
  }

  // Handle add section below
  const handleAddSection = afterIndex => {
    const newSection = {
      id: generateSectionId(),
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

  // Handle add first section when sections are empty
  const handleAddFirstSection = () => {
    const newSection = {
      id: generateSectionId(),
      title: "New Section",
      content: "<p>Start writing here...</p>",
      originalContent: "",
    }
    setSections([newSection])
    message.success("Section added")
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

  // Sync sections to Markdown for export/copy (kept for export functionality)
  const syncSectionsToMarkdown = useCallback(() => {
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

  // Copy all content as Markdown
  const copyContent = async () => {
    try {
      const markdown = syncSectionsToMarkdown()
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
      blogId: blog?._id,
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
      blog?._id,
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

  function toPlainText(input = "") {
    return (
      input
        // remove everything from markdown image start till end
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
        // remove HTML tags (even broken ones)
        .replace(/<[^>]*>/g, " ")
        // remove markdown links but keep text
        .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")
        // remove markdown bold / italic
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/_(.*?)_/g, "$1")
        // normalize spaces
        .replace(/\s+/g, " ")
        .trim()
    )
  }

  // Render FAQ section - editable
  const [editingFaqIndex, setEditingFaqIndex] = useState(null)
  const [editingFaqHeading, setEditingFaqHeading] = useState(false)

  const renderFAQ = () => {
    if (!faq) return null

    return (
      <motion.div
        className="border rounded-xl p-5 shadow-sm bg-white my-6"
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
        <Popover
          content={
            <div className="max-w-md">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Editor Guidelines
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-gray-900 mb-1">📝 Heading Structure:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      <strong>H1:</strong> Blog title only (automatically set)
                    </li>
                    <li>
                      <strong>H2:</strong> Section titles (automatically set)
                    </li>
                    <li>
                      <strong>H3:</strong> Use for major subsections within content
                    </li>
                    <li>
                      <strong>H4:</strong> Use for minor subsections and details
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-1">✨ Content Tips:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      Use <strong>H3</strong> for main points in your section
                    </li>
                    <li>
                      Use <strong>H4</strong> for supporting details
                    </li>
                    <li>Add lists for better readability</li>
                    <li>Insert tables for structured data</li>
                    <li>Embed YouTube videos for rich content</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-1">🎯 Best Practices:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Keep heading hierarchy logical (H3 → H4)</li>
                    <li>Don't skip heading levels</li>
                    <li>Use formatting (bold, italic) for emphasis</li>
                    <li>Add alt text to images for SEO</li>
                  </ul>
                </div>
              </div>
            </div>
          }
          title={null}
          trigger="click"
          placement="bottomRight"
        >
          <button
            className="px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center text-xs sm:text-sm"
            aria-label="Editor Guidelines"
          >
            <Info className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </Popover>
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

        {/* Thumbnail Image - Display if exists */}
        {blogThumbnail && (
          <div className="mb-8 relative group">
            <div
              className="cursor-pointer relative"
              onClick={() => {
                setThumbnailUrl(blogThumbnail.url)
                setThumbnailAlt(blogThumbnail.alt || "")
                setThumbnailModalOpen(true)
              }}
            >
              <img
                src={blogThumbnail.url}
                alt={blogThumbnail.alt || blogTitle}
                className="w-full max-h-[500px] object-cover rounded-lg shadow-md transition-all group-hover:brightness-95"
              />
              {/* Overlay hint on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 shadow-lg">
                  Click to edit thumbnail
                </span>
              </div>
            </div>
          </div>
        )}

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
              <div className="text-gray-600 flex-1">
                {toPlainText(blogDescription || "Click to add description...")}
              </div>

              <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
          )}
        </div>

        {/* Sections - Drag and Drop enabled */}
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Start Building Your Blog</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Add your first section to begin writing. Each section can have its own title and
              content.
            </p>
            <button
              onClick={handleAddFirstSection}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Add Section
            </button>
          </div>
        ) : (
          <>
            <EditorProvider value={editorContextValue}>
              <Reorder.Group
                axis="y"
                values={sections}
                onReorder={setSections}
                className="space-y-6"
              >
                {sections.map((section, index) => (
                  <SectionCard key={section.id || index} section={section} index={index} />
                ))}
              </Reorder.Group>
            </EditorProvider>

            {/* Add Section button at bottom */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => handleAddSection(sections.length - 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Add Section
              </button>
            </div>
          </>
        )}
        {renderFAQ()}

        {/* Thumbnail Edit Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <span>Edit Thumbnail Image</span>
            </div>
          }
          open={thumbnailModalOpen}
          onCancel={() => setThumbnailModalOpen(false)}
          footer={
            <div className="flex items-center justify-between w-full">
              {/* Left: Destructive action */}
              <Button
                danger
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => {
                  setBlogThumbnail(null)
                  setThumbnailModalOpen(false)
                  message.success("Thumbnail removed")
                }}
              >
                Delete Thumbnail
              </Button>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <Button onClick={() => setThumbnailModalOpen(false)}>Cancel</Button>
                <Button
                  type="primary"
                  icon={<Check className="w-4 h-4" />}
                  onClick={() => {
                    if (blogThumbnail) {
                      setBlogThumbnail({
                        ...blogThumbnail,
                        url: thumbnailUrl,
                        alt: thumbnailAlt,
                      })
                      message.success("Thumbnail updated")
                    }
                    setThumbnailModalOpen(false)
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          }
          width={700}
          centered
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Image Preview */}
            <div className="border rounded-lg bg-gray-50 p-2 flex items-center justify-center">
              <img
                src={thumbnailUrl}
                alt={thumbnailAlt || "Thumbnail preview"}
                className="max-w-full rounded-lg object-contain"
                style={{ maxHeight: "300px" }}
                onError={e => {
                  e.currentTarget.src = blogThumbnail?.url
                }}
              />
            </div>

            {/* Right: Image Details */}
            <div className="space-y-4">
              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <Input
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a URL to replace the thumbnail</p>
              </div>

              {/* Alt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <Input.TextArea
                  value={thumbnailAlt}
                  onChange={e => setThumbnailAlt(e.target.value)}
                  placeholder="Describe the image for accessibility and SEO"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Helps with SEO and screen readers. Be descriptive and specific.
                </p>
              </div>
            </div>
          </div>
        </Modal>
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
          <h1 className="text-2xl font-semibold mb-4 text-gray-900">{toPlainText(blogTitle)}</h1>

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
            <div
              className="text-gray-600 mb-6 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: blogDescription }}
            />
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
                      {toPlainText(sec.title)}
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
                <h2 className="text-xl font-semibold text-gray-900">{toPlainText(sec.title)}</h2>

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
        <div className="sticky top-0 bg-white shadow-sm z-10">{renderToolbar()}</div>
        <div className="flex-1 overflow-auto">{renderContentArea()}</div>
      </div>
    </motion.div>
  )
}

export default TextEditor
