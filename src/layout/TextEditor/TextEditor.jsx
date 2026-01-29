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
  Sparkles,
  MessageSquare,
} from "lucide-react"
import { useSelector } from "react-redux"
import { Modal, Tooltip, message, Button, Input, Popover, Select } from "antd"
import ImageGalleryPicker from "@components/ImageGalleryPicker"
import { generateAltText, enhanceImage, generateImage } from "@api/imageGalleryApi"
import { COSTS } from "@/data/blogData"
import { fetchUserThunk } from "@store/slices/authSlice"

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
import SectionEditor from "./SectionEditor"

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
  const turndownService = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" })
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
    const contentEl = ctaEl.querySelector(".cta-content")
    cta = contentEl ? contentEl.innerHTML : ctaEl.innerHTML
  }

  // Extract Quick Summary
  const summaryEl = doc.querySelector(".blog-quick-summary, .summary-wrapper")
  if (summaryEl) {
    const headingEl = summaryEl.querySelector(".quick-summary-heading")
    const contentEl = summaryEl.querySelector(".summary-content")
    quickSummary = {
      heading: headingEl?.innerHTML || "Quick Summary",
      content: contentEl?.innerHTML || summaryEl.innerHTML,
    }
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
    matches.push({ title: match[1].trim(), index: match.index, fullMatch: match[0] })
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
  const [cta, setCta] = useState(null)
  const [quickSummary, setQuickSummary] = useState(null)

  // Track original values for change detection - use refs to store the snapshot
  const [originalBlogTitle, setOriginalBlogTitle] = useState("")
  const [originalBlogDescription, setOriginalBlogDescription] = useState("")
  const [originalSections, setOriginalSections] = useState([])
  const [originalCta, setOriginalCta] = useState(null)
  const [originalQuickSummary, setOriginalQuickSummary] = useState(null)

  // Track if originals have been initialized
  const originalsInitialized = useRef(false)

  // Track the blog ID to detect when we're loading a different blog
  const lastBlogIdRef = useRef(null)

  // Editing states for title/description
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)

  // Thumbnail edit modal state
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false)
  const [thumbnailModalView, setThumbnailModalView] = useState("main") // new
  const [generatedImageTemp, setGeneratedImageTemp] = useState(null) // new
  const [showGalleryPicker, setShowGalleryPicker] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [thumbnailAlt, setThumbnailAlt] = useState("")
  // Enhancement state
  const [isEnhanceMode, setIsEnhanceMode] = useState(false)
  const [enhanceForm, setEnhanceForm] = useState({ prompt: "", style: "photorealistic" })

  // Generation state
  const [isGenerateMode, setIsGenerateMode] = useState(false)
  const [genForm, setGenForm] = useState({
    prompt: "",
    style: "photorealistic",
    aspectRatio: "1:1",
    imageSize: "1k",
  })

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

    // Compare CTA
    if (normalizeContent(cta) !== normalizeContent(originalCta)) {
      return true
    }

    // Compare Quick Summary
    if (
      normalizeContent(quickSummary?.heading) !== normalizeContent(originalQuickSummary?.heading) ||
      normalizeContent(quickSummary?.content) !== normalizeContent(originalQuickSummary?.content)
    ) {
      return true
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
      setCta(parsedData.cta)
      setQuickSummary(parsedData.quickSummary)

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
          setOriginalCta(parsedData.cta)
          setOriginalQuickSummary(parsedData.quickSummary)
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
      setOriginalCta(cta)
      setOriginalQuickSummary(quickSummary)
    }
  }, [blog?.updatedAt])

  // Sync sections to HTML content for saving (with proper blog structure and classes)
  const syncSectionsToHTML = useCallback(() => {
    let html = '<article class="blog-article" id="blog-article">\n'

    // Add Title & Description wrapper
    html += '  <section class="blog-base-meta blog-section-0" id="blog-meta">\n'
    html += '    <div class="meta-wrapper">\n'

    // Add title
    if (blogTitle) {
      html += `      <h1 class="blog-title heading heading-1">${blogTitle}</h1>\n`
    }

    // Add Main Image (Thumbnail)
    if (blogThumbnail) {
      html += '      <figure class="section-thumbnail thumbnail-main">\n'
      html += `        <img src="${blogThumbnail.url}" alt="${
        blogThumbnail.alt || blogTitle
      }" class="thumbnail-image" />\n`
      if (blogThumbnail.attribution) {
        html += '        <figcaption class="thumbnail-attribution">\n'
        html += `          <p style="font-size: 12px; text-align: right;">Photo by <a href="${blogThumbnail.attribution.profile}">${blogThumbnail.attribution.name}</a> on <a href="https://www.pexels.com/">Pexels</a></p>\n`
        html += "        </figcaption>\n"
      }
      html += "      </figure>\n"
    }

    // Add description
    if (blogDescription) {
      html += `      <p class="blog-description meta-description">${blogDescription}</p>\n`
    }

    html += "    </div>\n"
    html += "  </section>\n\n"

    // Sections Wrapper
    html += '  <div class="blog-sections-wrapper" id="sections-wrapper">\n'

    // Add sections
    sections.forEach((sec, index) => {
      html += `    <section class="blog-section blog-section-${index + 1}" id="${
        sec.id
      }" data-section-index="${index}">\n`
      html += '      <div class="section-wrapper">\n'
      html += `        <h2 class="section-title heading heading-2 section-title-${index}">${sec.title}</h2>\n`

      // Add section images if they exist
      const secImages = sectionImages.filter(
        img => img.sectionId === sec.id && img.role === "section"
      )
      if (secImages.length > 0) {
        html += '        <div class="section-images-wrapper">\n'
        secImages.forEach((img, idx) => {
          html += `          <figure class="section-image image-${idx}">\n`
          html += `            <img src="${img.url}" alt="${
            img.altText || ""
          }" class="content-image" loading="lazy" />\n`
          if (img.attribution && img.attribution.name) {
            html += '            <figcaption class="image-attribution">\n'
            html += `              <p>Photo by <a href="${img.attribution.profile}">${img.attribution.name}</a> on <a href="https://www.pexels.com/">Pexels</a></p>\n`
            html += "            </figcaption>\n"
          }
          html += "          </figure>\n"
        })
        html += "        </div>\n"
      }

      html += `        <div class="section-content section-content-${index}">${sec.content}</div>\n`
      html += "      </div>\n"
      html += "    </section>\n\n"
    })

    html += "  </div>\n\n"

    // Add CTA if exists
    if (cta) {
      html += '  <div class="blog-brand-cta cta-wrapper" id="blog-cta">\n'
      html += '    <div class="cta-content">\n'
      html += `      ${cta}\n`
      html += "    </div>\n"
      html += "  </div>\n\n"
    }

    // Add Quick Summary if exists
    if (quickSummary) {
      html += '  <div id="quick-summary-section" class="blog-quick-summary summary-wrapper">\n'
      html += `    <h2 class="quick-summary-heading heading heading-2">${quickSummary.heading}</h2>\n`
      html += '    <div class="summary-content">\n'
      html += `      ${quickSummary.content}\n`
      html += "    </div>\n"
      html += "  </div>\n\n"
    }

    // Add FAQ if exists
    if (faq && faq.qa && faq.qa.length > 0) {
      html += '  <section class="blog-section faq-section" id="faq-section">\n'
      html += '    <div id="faq-section" class="faq-wrapper">\n'
      html += `      <h2 class="faq-heading heading heading-2">${faq.heading}</h2>\n`
      html += '      <div class="faq-qa-pairs-wrapper">\n'
      faq.qa.forEach((item, idx) => {
        html += `        <div class="faq-qa-pair faq-pair-${idx}" id="faq-${idx}" data-faq-index="${idx}">\n`
        html += `          <h3 id="faq-question-${idx}" class="faq-question question question-${idx} heading heading-3">${item.question}</h3>\n`
        html += `          <div id="faq-answer-${idx}" class="faq-answer answer answer-${idx}">\n`
        html += `            <p>${item.answer}</p>\n`
        html += "          </div>\n"
        html += "        </div>\n\n"
      })
      html += "      </div>\n"
      html += "    </div>\n"
      html += "  </section>\n\n"
    }

    html += "</article>"
    return html
  }, [sections, faq, blogTitle, blogDescription, sectionImages, blogThumbnail, cta, quickSummary])

  // Update parent content when sections change
  useEffect(() => {
    const newContent = syncSectionsToHTML()
    if (setContent) {
      setContent(newContent)
    }
  }, [sections, syncSectionsToHTML, setContent, cta, quickSummary])

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
          return { ...section, content: section.content.replace(regex, change) }
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

    if (cta) {
      markdown += `## Brand CTA\n\n${htmlToMarkdownSection(cta)}\n\n`
    }

    if (quickSummary) {
      markdown += `## ${quickSummary.heading}\n\n${htmlToMarkdownSection(quickSummary.content)}\n\n`
    }

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
      blog: blog, // Pass full blog object for access to imageSource etc.
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
      return { ...prev, qa: [...prev.qa, { question: "New Question", answer: "New Answer" }] }
    })
  }

  // Handle delete FAQ item
  const handleDeleteFaqItem = index => {
    setFaq(prev => {
      if (!prev) return prev
      return { ...prev, qa: prev.qa.filter((_, i) => i !== index) }
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

  // Extra Sections Editing State
  const [isEditingCta, setIsEditingCta] = useState(false)
  const [isEditingSummaryHeading, setIsEditingSummaryHeading] = useState(false)
  const [isEditingSummaryContent, setIsEditingSummaryContent] = useState(false)

  const renderCTA = () => {
    if (!cta) return null

    return (
      <motion.div
        className="border rounded-xl p-5 mt-5 hover:shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-xl">Brand CTA Section</h3>
        </div>

        {isEditingCta ? (
          <InlineEditor
            value={cta}
            onChange={setCta}
            placeholder="Enter CTA content..."
            onBlur={() => setIsEditingCta(false)}
            autoFocus
            editorClassName="text-indigo-800"
          />
        ) : (
          <div className="cursor-pointer group relative" onClick={() => setIsEditingCta(true)}>
            <div dangerouslySetInnerHTML={{ __html: cta }} />
            <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm text-gray-500">Click to edit</span>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  const renderQuickSummary = () => {
    if (!quickSummary) return null

    return (
      <motion.div
        className="border rounded-xl p-5 shadow-sm bg-white my-6 border-blue-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 mb-4">
          {isEditingSummaryHeading ? (
            <InlineEditor
              value={quickSummary.heading}
              onChange={val => setQuickSummary(prev => ({ ...prev, heading: val }))}
              placeholder="Summary Heading..."
              onBlur={() => setIsEditingSummaryHeading(false)}
              autoFocus
              singleLine
              editorClassName="text-xl font-bold text-blue-900"
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => setIsEditingSummaryHeading(true)}
            >
              <h3 className="text-xl font-bold">{quickSummary.heading}</h3>
              <Edit3 className="w-4 h-4 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {isEditingSummaryContent ? (
          <SectionEditor
            initialContent={quickSummary.content}
            onChange={val => setQuickSummary(prev => ({ ...prev, content: val }))}
            onBlur={() => setIsEditingSummaryContent(false)}
          />
        ) : (
          <div
            className="cursor-pointer group relative"
            onClick={() => setIsEditingSummaryContent(true)}
          >
            <div
              className="text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: quickSummary.content }}
            />
            <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm text-gray-500">Click to edit</span>
            </div>
            <Edit3 className="absolute top-2 right-2 w-4 h-4 text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </motion.div>
    )
  }

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
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add FAQ</span>
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
          <LoadingScreen message="Loading editor..." />
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
            <div className="relative group">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setIsEditingTitle(true)}
              >
                <div
                  className="text-3xl font-bold text-gray-900"
                  dangerouslySetInnerHTML={{ __html: blogTitle || "Untitled Blog" }}
                />
                <Edit3 className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Add Thumbnail Option - Show on hover if no thumbnail */}
              {!blogThumbnail && (
                <div className="absolute top-full left-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setThumbnailUrl("")
                      setThumbnailAlt("")
                      setShowGalleryPicker(false)
                      setThumbnailModalOpen(true)
                    }}
                    className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Add Thumbnail Image
                  </button>
                </div>
              )}
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
                setShowGalleryPicker(false)
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
            </EditorProvider>
          </>
        )}

        <EditorProvider value={editorContextValue}>
          {renderCTA()}
          {renderQuickSummary()}
          {renderFAQ()}
        </EditorProvider>

        {/* Thumbnail Edit Modal */}
        <Modal
          title={
            <div className="flex items-center justify-between gap-3 pr-8">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-800">
                  {thumbnailModalView === "generate"
                    ? "Generate Image"
                    : thumbnailModalView === "enhance"
                      ? "Enhance Image"
                      : thumbnailModalView === "gallery"
                        ? "Select from Gallery"
                        : "Edit Thumbnail Image"}
                </span>
              </div>
            </div>
          }
          open={thumbnailModalOpen}
          onCancel={() => {
            setThumbnailModalOpen(false)
            setThumbnailModalView("main")
            // Clear prompts
            setGenForm(prev => ({ ...prev, prompt: "" }))
            setEnhanceForm(prev => ({ ...prev, prompt: "" }))
          }}
          footer={null}
          width={thumbnailModalView === "gallery" ? 1000 : 600}
          centered
          className="responsive-image-modal"
          bodyStyle={{ padding: 0, maxHeight: "85vh", overflow: "hidden" }}
        >
          <div className="flex flex-col h-[70vh] bg-gray-50/50 overflow-y-auto custom-scroll">
            {/* VIEW: MAIN */}
            {thumbnailModalView === "main" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Image Preview & Actions */}
                <div className="rounded-xl">
                  <div className="relative group min-h-[200px] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden border border-dashed border-gray-300">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt="Preview"
                        className="w-full h-full max-h-[300px] object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center gap-2">
                        <ImageIcon className="w-10 h-10 opacity-50" />
                        <span className="text-sm">No image selected</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <Button
                      block
                      className="h-auto py-2 flex flex-col items-center justify-center gap-1 hover:border-purple-300 hover:text-purple-600"
                      onClick={() => setThumbnailModalView("gallery")}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs">Gallery</span>
                    </Button>
                    <Button
                      block
                      className="h-auto py-2 flex flex-col items-center justify-center gap-1 hover:border-blue-300 hover:text-blue-600"
                      onClick={() => setThumbnailModalView("generate")}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs">Generate AI</span>
                    </Button>
                    <Button
                      block
                      // disabled={!thumbnailUrl || blog?.imageSource !== "ai"}
                      className="h-auto py-2 flex flex-col items-center justify-center gap-1 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
                      onClick={() => {
                        setEnhanceForm(prev => ({ ...prev, prompt: thumbnailAlt || "" }))
                        setThumbnailModalView("enhance")
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs">Enhance</span>
                    </Button>
                    <Button
                      block
                      danger
                      disabled={!thumbnailUrl}
                      className="h-auto py-2 flex flex-col items-center justify-center gap-1"
                      onClick={() => {
                        setThumbnailUrl("")
                        setThumbnailAlt("")
                        setBlogThumbnail(null)
                        message.success("Image removed")
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs">Remove</span>
                    </Button>
                  </div>
                </div>

                {/* URL & Alt Text Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <Input
                      value={thumbnailUrl}
                      onChange={e => setThumbnailUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      size="large"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Alt Text <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      {thumbnailUrl && (
                        <Button
                          type="text"
                          size="small"
                          className="text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50"
                          onClick={async () => {
                            const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
                            if (credits < COSTS.ALT_TEXT) {
                              message.error(`Insufficient credits. Need ${COSTS.ALT_TEXT}.`)
                              return
                            }
                            const hide = message.loading("Generating alt text...", 0)
                            try {
                              const response = await generateAltText({ imageUrl: thumbnailUrl })
                              const alt = response.altText || response.data?.altText
                              if (alt) {
                                setThumbnailAlt(alt)
                                message.success("Alt text generated!")
                              }
                            } catch (err) {
                              message.error("Failed to generate alt text")
                            } finally {
                              hide()
                            }
                          }}
                        >
                          <Sparkles className="w-3 h-3" /> Auto-Generate
                        </Button>
                      )}
                    </div>
                    <Input.TextArea
                      value={thumbnailAlt}
                      onChange={e => setThumbnailAlt(e.target.value)}
                      placeholder="Describe the image for SEO..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: GALLERY */}
            {thumbnailModalView === "gallery" && (
              <div className="flex-1 overflow-hidden">
                <ImageGalleryPicker
                  onSelect={(url, alt) => {
                    setThumbnailUrl(url)
                    setThumbnailAlt(alt || "")
                    setThumbnailModalView("main")
                  }}
                  selectedImageUrl={thumbnailUrl}
                />
              </div>
            )}

            {/* VIEW: GENERATE FORM */}
            {thumbnailModalView === "generate" && (
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex-1 max-w-lg mx-auto w-full space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Generate New Image</h3>
                    <p className="text-sm text-gray-500">
                      Describe your vision and AI will create it.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                    <Input.TextArea
                      placeholder="e.g. A futuristic city skyline at sunset, cyberpunk style..."
                      value={genForm.prompt}
                      onChange={e => setGenForm({ ...genForm, prompt: e.target.value })}
                      rows={4}
                      size="large"
                      className="text-base"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                      <Select
                        value={genForm.style}
                        onChange={val => setGenForm({ ...genForm, style: val })}
                        className="w-full"
                        size="large"
                        options={[
                          { value: "photorealistic", label: "Photorealistic" },
                          { value: "anime", label: "Anime" },
                          { value: "digital-art", label: "Digital Art" },
                          { value: "oil-painting", label: "Oil Painting" },
                          { value: "cinematic", label: "Cinematic" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aspect Ratio
                      </label>
                      <Select
                        value={genForm.aspectRatio}
                        onChange={val => setGenForm({ ...genForm, aspectRatio: val })}
                        className="w-full"
                        size="large"
                        options={[
                          { value: "1:1", label: "Square (1:1)" },
                          { value: "16:9", label: "Landscape (16:9)" },
                          { value: "9:16", label: "Portrait (9:16)" },
                          { value: "4:3", label: "Standard (4:3)" },
                          { value: "3:2", label: "Classic (3:2)" },
                          { value: "5:4", label: "Traditional (5:4)" },
                          { value: "21:9", label: "Ultrawide (21:9)" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality
                      </label>
                      <Select
                        value={genForm.imageSize}
                        onChange={val => setGenForm({ ...genForm, imageSize: val })}
                        className="w-full"
                        size="large"
                        options={[
                          { value: "1k", label: "Standard (1K)" },
                          { value: "2k", label: "High Res (2K)" },
                          { value: "4k", label: "Ultra (4K)" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: ENHANCE FORM */}
            {thumbnailModalView === "enhance" && (
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex-1 max-w-lg mx-auto w-full space-y-6">
                  {/* Preview of source */}
                  <div className="flex justify-center mb-4">
                    <img
                      src={thumbnailUrl}
                      alt="Source"
                      className="h-full object-contain rounded border bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instruction
                    </label>
                    <Input.TextArea
                      placeholder="e.g. Make it higher resolution, fix lighting..."
                      value={enhanceForm.prompt}
                      onChange={e => setEnhanceForm({ ...enhanceForm, prompt: e.target.value })}
                      rows={3}
                      size="large"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <Select
                      value={enhanceForm.style}
                      onChange={val => setEnhanceForm({ ...enhanceForm, style: val })}
                      className="w-full"
                      size="large"
                      options={[
                        { value: "photorealistic", label: "Photorealistic" },
                        { value: "anime", label: "Anime" },
                        { value: "digital-art", label: "Digital Art" },
                        { value: "oil-painting", label: "Oil Painting" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: LOADING (Transient) */}
            {(thumbnailModalView === "generating" || thumbnailModalView === "enhancing") && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 z-[999]">
                <LoadingScreen
                  message={
                    thumbnailModalView === "generating"
                      ? "Creating your masterpiece..."
                      : "Enhancing image..."
                  }
                />
                <p className="text-gray-500 text-sm max-w-xs text-center animate-pulse">
                  This may take 10-20 seconds. Please wait.
                </p>
              </div>
            )}

            {/* VIEW: PREVIEW RESULT */}
            {(thumbnailModalView === "preview_generate" ||
              thumbnailModalView === "preview_enhance") && (
              <div className="flex-1 p-6 flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative">
                  <img
                    src={generatedImageTemp?.url}
                    alt="Generated Result"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-gray-600 font-medium">{generatedImageTemp?.prompt}</p>
                  <p className="text-xs text-gray-400 mt-1">Generated by AI</p>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-4 border-t bg-white flex items-center justify-between">
            {thumbnailModalView === "main" ? (
              <>
                <Button onClick={() => setThumbnailModalOpen(false)}>Cancel</Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setBlogThumbnail({ url: thumbnailUrl, alt: thumbnailAlt })
                    setThumbnailModalOpen(false)
                    message.success("Thumbnail saved")
                  }}
                >
                  Save Changes
                </Button>
              </>
            ) : thumbnailModalView === "generate" ? (
              <>
                <Button onClick={() => setThumbnailModalView("main")}>Cancel</Button>
                <Button
                  type="primary"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={async () => {
                    // Cost Check
                    const cost = COSTS.GENERATE
                    const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
                    if (user?.usage?.aiImages >= user?.usageLimits?.aiImages) {
                      return message.error("Limit reached")
                    }
                    if (credits < cost) {
                      return message.error(`Need ${cost} credits`)
                    }
                    if (!genForm.prompt.trim()) return message.error("Enter a prompt")

                    setThumbnailModalView("generating")
                    try {
                      const res = await generateImage(genForm)
                      const img = res.image || res.data || res
                      if (img?.url) {
                        // Direct validation success logic
                        setThumbnailUrl(img.url)
                        setThumbnailAlt(genForm.prompt)
                        setGenForm(prev => ({ ...prev, prompt: "" })) // Clear prompt
                        message.success("Image generated successfully!")
                        setThumbnailModalView("main")
                      } else {
                        throw new Error("No image data")
                      }
                    } catch (e) {
                      console.error(e)
                      message.error("Generation failed")
                      setThumbnailModalView("generate")
                    }
                  }}
                >
                  Generate ({COSTS.GENERATE}c)
                </Button>
              </>
            ) : thumbnailModalView === "enhance" ? (
              <>
                <Button onClick={() => setThumbnailModalView("main")}>Cancel</Button>
                <Button
                  type="primary"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 border-none"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={async () => {
                    // Logic for enhance call
                    const cost = COSTS.ENHANCE
                    const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
                    if (user?.usage?.aiImages >= user?.usageLimits?.aiImages) {
                      return message.error("Limit reached")
                    }
                    if (credits < cost) return message.error(`Need ${cost} credits`)
                    if (!enhanceForm.prompt.trim()) return message.error("Enter instruction")

                    setThumbnailModalView("enhancing")
                    try {
                      const formData = new FormData()
                      formData.append("prompt", enhanceForm.prompt)
                      formData.append("style", enhanceForm.style)
                      formData.append("imageUrl", thumbnailUrl)
                      const res = await enhanceImage(formData)
                      const img = res.image || res.data || res
                      if (img?.url) {
                        // Direct validation success logic
                        setThumbnailUrl(img.url)
                        setEnhanceForm(prev => ({ ...prev, prompt: "" })) // Clear prompt
                        message.success("Image enhanced successfully!")
                        setThumbnailModalView("main")
                      } else {
                        throw new Error("No image data")
                      }
                    } catch (e) {
                      message.error("Enhancement failed")
                      setThumbnailModalView("enhance")
                    }
                  }}
                >
                  Enhance ({COSTS.ENHANCE}c)
                </Button>
              </>
            ) : (
              <Button onClick={() => setThumbnailModalView("main")}>Back</Button>
            )}
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
          <LoadingScreen message="Saving keywords..." />
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
                      href="#preview-cta"
                      className="text-blue-600 hover:underline"
                      onClick={e => {
                        e.preventDefault()
                        document
                          .getElementById("preview-cta")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }}
                    >
                      Brand CTA
                    </a>
                  </li>
                )}
                {quickSummary && (
                  <li>
                    <a
                      href="#preview-summary"
                      className="text-blue-600 hover:underline"
                      onClick={e => {
                        e.preventDefault()
                        document
                          .getElementById("preview-summary")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }}
                    >
                      {quickSummary.heading}
                    </a>
                  </li>
                )}
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

          {/* CTA Preview */}
          {cta && (
            <div id="preview-cta" className="mt-8 pt-6 border-t bg-indigo-50/30 p-4 rounded-lg">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: cta }} />
            </div>
          )}

          {/* Quick Summary Preview */}
          {quickSummary && (
            <div id="preview-summary" className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-bold mb-4 text-blue-900">{quickSummary.heading}</h2>
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: quickSummary.content }}
              />
            </div>
          )}

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
