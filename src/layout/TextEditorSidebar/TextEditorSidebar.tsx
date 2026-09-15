import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw,
  TrendingUp,
  Send,
  X,
  Lightbulb,
  ChevronLeft,
  Wand2,
  Crown,
  Info,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { useNavigate } from "react-router-dom"
import { exportBlog } from "@api/blogApi"
import { asApiError } from "@/types/api"
import { useQueryClient } from "@tanstack/react-query"
import OverviewPanel from "./sidebars/OverviewPanel"
import SeoPanel from "./sidebars/SeoPanel"
import BlogInfoPanel from "./sidebars/BlogInfoPanel"
import BrandVoicePanel from "./sidebars/BrandVoicePanel"
import InsightsPanel from "./sidebars/InsightsPanel"
import SectionToolsPanel from "./sidebars/SectionToolsPanel"
import PostingPanel from "./sidebars/PostingPanel"
import PlatformCategoriesField from "./sidebars/PlatformCategoriesField"
import { PLATFORM_LABELS } from "./constants"
import {
  useAnalyzeBlogMutation,
  useApplyInsightMutation,
  useConfirmInsightMutation,
  useBlogInsightQuery,
} from "@api/queries/blogQueries"
import useWorkspaceStore from "@store/useWorkspaceStore"
import RegenerateModal from "@components/RegenerateModal"
import CategoriesModal from "../Editor/CategoriesModal"
import useAiReviewStore from "@/store/useAiReviewStore"
import useEditorStore from "@/store/useEditorStore"
import useAuthStore from "@store/useAuthStore"
import useIntegrationStore from "@store/useIntegrationStore"
import useAnalysisStore from "@store/useAnalysisStore"
import { generateQuery } from "@api/Generate/Generate.query"
import { integrationQuery } from "@api/Integration/Integration.query"
import { runCompetitiveAnalysis } from "@api/analysisApi"
import { useReadOnlyGuard } from "@/hooks/useReadOnlyGuard"

import { COSTS } from "@/data/blogData"

import { marked } from "marked"

const renderer = {
  heading({ text, depth: level }: { text: string; depth: number }) {
    const slug = String(text)
      .toLowerCase()
      .replace(/[^\w]+/g, "-")
      .replace(/^-+|-+$/g, "")
    return `<h${level} id="${slug}">${text}</h${level}>`
  },
}

marked.use({ renderer })

interface TextEditorSidebarProps {
  blog?: any
  onPost?: (...args: any[]) => void
  handleSubmit?: (...args: any[]) => void
  setIsHumanizing: (value: boolean) => void
  setHumanizedContent: (content: any) => void
  setIsHumanizeModalOpen: (open: boolean) => void
  setIsSidebarOpen?: (open: boolean) => void
  activeEditorVersion?: any
  isPublicMode?: boolean
}

const TextEditorSidebar = ({
  blog,
  onPost,
  handleSubmit,
  setIsSidebarOpen,
  activeEditorVersion,
  isPublicMode = false,
}: TextEditorSidebarProps) => {
  // Shared editor state — see useEditorStore.ts. `keywords`/`formData`/`posted`/
  // `isPosting`/`editorContent` used to be prop-drilled in from MainEditorPage; both
  // now read/write the same store instead. (`unsavedChanges` is read inside
  // PostingPanel directly, since posting is the only thing here that needs it.)
  const keywords = useEditorStore((s) => s.keywords)
  const formData = useEditorStore((s) => s.formData)
  const posted = useEditorStore((s) => s.posted)
  const isPosting = useEditorStore((s) => s.isPosting)
  const editorContent = useEditorStore((s) => s.editorContent)
  const setEditorContent = useEditorStore((s) => s.setEditorContent)
  // Two flavours of view-only. `isPublicMode` (the public blog reader) keeps controls
  // visible but locked, because the reader may still sign in and get them. A read-only
  // *workspace* removes them outright: a collaborator watching someone else's workspace
  // can do nothing to unlock a write from here, so a disabled button is just noise.
  const { isReadOnlyWorkspace } = useReadOnlyGuard()
  const isLocked = isPublicMode || isReadOnlyWorkspace

  const [activePanel, setActivePanel] = useState("overview")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  // Repost Modal State — the repost modal is rendered here (not inside PostingPanel)
  // since it's a page-level overlay, so its state stays local to this component.
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false)
  const [repostSettings, setRepostSettings] = useState({
    platform: "",
    category: "",
    includeTableOfContents: false,
  })

  // 2-step regenerate modal state
  const isRegenerateModalOpen = useEditorStore((s) => s.isRegenerateModalOpen)
  const setIsRegenerateModalOpen = useEditorStore((s) => s.setIsRegenerateModalOpen)

  // Blog postings state
  const blogPostings = useEditorStore((s) => s.blogPostings)
  const fetchPostings = useEditorStore((s) => s.fetchPostings)

  // SEO metadata — shared with SeoPanel and the accept/reject modal below.
  const seoMetadata = useEditorStore((s) => s.seoMetadata)
  const setSeoMetadata = useEditorStore((s) => s.setSeoMetadata)

  // Generated metadata accept/reject modal state
  const [generatedMetadataModal, setGeneratedMetadataModal] = useState(false)
  const [generatedMetadata, setGeneratedMetadata] = useState<any>(null)
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false)

  const availableSections = useEditorStore((s) => s.availableSections)
  const setAvailableSections = useEditorStore((s) => s.setAvailableSections)

  // AI rewrites are reviewed inside the editor, not in a dialog here.
  const openReview = useAiReviewStore((s) => s.openReview)

  // Performance Insights State. Re-running the analysis costs credits, so the
  // last generated insight is fetched once via useBlogInsightQuery and then
  // mirrored into the editor store — leaving the editor and coming back (or a
  // full reload) restores it instead of silently discarding it.
  const persistInsight = useEditorStore((s) => s.persistInsight)
  const setApplyingSuggestionId = useEditorStore((s) => s.setApplyingSuggestionId)
  const analyzeBlogMutation = useAnalyzeBlogMutation()
  const applyInsightMutation = useApplyInsightMutation()
  const confirmInsightMutation = useConfirmInsightMutation()
  const { mutateAsync: generateMetadata } = generateQuery.useGenerateMetadata()
  const { data: fetchedInsight } = useBlogInsightQuery(blog?._id)

  // Sidebar navigation items
  const NAV_ITEMS = [
    { id: "overview", icon: BarChart3, label: "Overview" },
    { id: "seo", icon: TrendingUp, label: "SEO Settings" },
    { id: "bloginfo", icon: Info, label: "Blog Details" },
    ...(blog?.brandId || blog?.brandId?.nameOfVoice
      ? [{ id: "brand", icon: Crown, label: "Brand Voice" }]
      : []),
    { id: "posting", icon: Send, label: "Publish" },
    { id: "insights", icon: Lightbulb, label: "Insights" },
    // Conditionally render AI Section Tools if sections are available AND editor is TipTap (v1)
    ...(availableSections.length > 0 && activeEditorVersion === 1
      ? [{ id: "sectionTools", icon: Wand2, label: "AI Tools" }]
      : []),
    { id: "regenerate", icon: RefreshCw, label: "Regenerate" },
  ]

  // Parse sections from content whenever it changes. This drives both the
  // "AI Tools" nav item above and SectionToolsPanel's section list — section
  // selection itself is local to that panel, which unmounts (clearing it) on
  // tab switch.
  useEffect(() => {
    if (!editorContent) {
      setAvailableSections([])
      return
    }

    try {
      const sections: { id: string; title: string; preview: string }[] = []
      // ... (rest of parsing logic will remain, just inserting the hook before it)

      const parser = new DOMParser()
      const doc = parser.parseFromString(editorContent, "text/html")

      // STRATEGY 1: Structured HTML with <section> tags
      // Target sections inside #sections-wrapper if available to exclude meta/cta/faq
      let htmlSections = Array.from(doc.querySelectorAll("#sections-wrapper section"))

      // Fallback: If no wrapper found, try all valid content sections (excluding meta/cta/faq/summary)
      if (htmlSections.length === 0) {
        const allSections = Array.from(doc.querySelectorAll("section"))
        const excludeSelector =
          "#blog-meta, #blog-cta, #faq-section, .blog-base-meta, .blog-brand-cta, .faq-section, .blog-quick-summary"
        htmlSections = allSections.filter((el) => !el.matches(excludeSelector))
      }

      if (htmlSections.length > 0) {
        // A section is addressed by id alone — both by the sectionTask payload and
        // by getElementById, which resolves only the first match. So a repeated id
        // is not two addressable sections, it is one; listing it twice would render
        // two cards that select together and act on the same element either way.
        const seenIds = new Set()

        htmlSections.forEach((el, i) => {
          const id = el.id

          // Skip if no ID (cannot target)
          if (!id) return
          if (seenIds.has(id)) return
          seenIds.add(id)

          // Try to find a heading inside this section
          const heading = el.querySelector("h1, h2, h3, h4, h5, h6")
          const title = heading ? heading.textContent.trim() : `Section ${i + 1}`

          // Get text preview
          // Prefer content inside .section-content if available, otherwise full section text
          const contentEl = el.querySelector(".section-content") || el

          // Drop every copy of the section's own heading rather than just the first.
          // Content rewritten before the duplicate-id fix can still carry it twice,
          // and a leftover copy runs straight into the body text in the preview.
          const clone = contentEl.cloneNode(true) as Element
          for (const h of Array.from(clone.querySelectorAll("h1, h2, h3, h4, h5, h6"))) {
            if (h.textContent?.trim() === title) h.remove()
          }
          const text = (clone.textContent || "").replace(/\s+/g, " ").trim()

          const preview = text.substring(0, 120) + (text.length > 120 ? "..." : "")

          sections.push({ id, title, preview })
        })
      }

      // STRATEGY 2: Markdown/Flat HTML Headers (Fallback) has been disabled per request.

      setAvailableSections(sections)
    } catch (e) {
      console.error("Failed to parse sections for tools:", e)
    }
  }, [editorContent, setAvailableSections])

  const { user } = useAuthStore()
  const userPlan = user?.subscription?.plan?.toLowerCase() || "free"
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()
  const { showLoading, hideLoading } = useLoading()

  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace)
  const { integrations, setIntegrations } = useIntegrationStore()
  const { data: integrationsData } = integrationQuery.useList()
  const { analysisResult, loading: isAnalyzingCompetitive } = useAnalysisStore()

  const result = analysisResult?.[blog?._id]

  const hasAnyIntegration =
    integrations?.integrations && Object.keys(integrations.integrations).length > 0
  const _isDisabled = isPosting || !hasAnyIntegration
  const isPro = ["free", "basic"].includes(userPlan)

  // Use blog postings from API instead of posted object
  const hasPublishedLinks = blogPostings.length > 0

  // While watching a shared workspace, Search Console belongs to the owner being
  // watched, so the invitee's own `user.gsc` says nothing about access here.
  const hasGscAccess = !!activeWorkspace || !!user?.gsc

  // Fetch blog postings when blog changes. fetchPostings itself is a stable store
  // action (reads the current blog id fresh each call, not from this closure), so
  // blog?._id must be listed explicitly to re-fire this on blog switch.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    fetchPostings()
  }, [blog?._id, fetchPostings])

  // Restore a previously generated insight for this blog, so re-opening the editor
  // (or a full page reload) shows the analysis the user already paid for instead
  // of an empty state.
  useEffect(() => {
    persistInsight(blog?._id ? (fetchedInsight ?? null) : null)
  }, [blog?._id, fetchedInsight, persistInsight])

  // Initialize SEO metadata from the loaded blog. Blog slug editing lives inside
  // BlogInfoPanel, which syncs its own local copy from `blog?.slug` directly.
  useEffect(() => {
    setSeoMetadata({
      title: blog?.seoMetadata?.title || "",
      description: blog?.seoMetadata?.description || "",
    })
  }, [blog?.seoMetadata?.description, blog?.seoMetadata?.title, setSeoMetadata])

  // Bridges the query cache into the shared store — RegenerateModal/PostingPanel read
  // `integrations` off the store passively rather than fetching it themselves.
  useEffect(() => {
    if (integrationsData) setIntegrations(integrationsData)
  }, [integrationsData, setIntegrations])

  const handleAnalyzing = useCallback(async () => {
    if (isPro) return navigate("/pricing")

    const { setLoading, setError, setAnalysisResult } = useAnalysisStore.getState()
    setLoading(true)
    try {
      const result = await runCompetitiveAnalysis({
        blogId: blog._id,
        title: blog.title,
        content: blog.content,
        keywords: keywords || blog?.focusKeywords || [],
      })
      setAnalysisResult(blog._id, result)
      setActivePanel("seo")
    } catch (rawErr) {
      const err = asApiError(rawErr)
      setError(err.message)
      toast.error("Analysis failed")
    } finally {
      setLoading(false)
    }
  }, [isPro, navigate, blog, keywords])

  // Guard shared by both insight actions: archived blogs are read-only, and both
  // calls spend credits, so bail out before the request if the balance is short.
  const guardCreditedAction = useCallback(
    (cost: any) => {
      if (blog?.isArchived) {
        toast.error("This blog is archived. Please restore it to perform this action.")
        return false
      }
      const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
      if (credits < cost) {
        handlePopup({
          title: "Insufficient Credits",
          description: `Need ${cost} credits, have ${credits}.`,
          confirmText: "Buy Credits",
          onConfirm: () => navigate("/pricing"),
        })
        return false
      }
      return true
    },
    [blog?.isArchived, user, handlePopup, navigate]
  )

  const handleAnalyzeInsights = useCallback(async () => {
    if (!blog?._id) return toast.error("Blog ID missing")
    if (!guardCreditedAction(COSTS.BLOG_INSIGHT.ANALYZE)) return

    const loadingId = showLoading("Analyzing performance and generating suggestions...")
    try {
      const result = await analyzeBlogMutation.mutateAsync(blog._id)
      persistInsight(result)
      toast.success(
        result?.suggestions?.length
          ? `${result.suggestions.length} suggestions ready`
          : "Analysis complete"
      )
    } catch {
      // useAnalyzeBlogMutation already surfaces the error toast
    } finally {
      hideLoading(loadingId)
    }
  }, [
    blog?._id,
    guardCreditedAction,
    analyzeBlogMutation,
    persistInsight,
    showLoading,
    hideLoading,
  ])

  // Commits a rewrite the user accepted in the editor's review view. Takes the
  // suggestion and content explicitly rather than reading them back out of
  // state, since the review that triggers it can outlive the render that raised it.
  const handleConfirmSuggestion = useCallback(
    async ({
      suggestionId,
      republish,
      content,
    }: {
      suggestionId?: string
      republish?: boolean
      content?: string
    }) => {
      if (!suggestionId || !blog?._id) return

      const loadingId = showLoading("Applying changes...")
      try {
        const result = await confirmInsightMutation.mutateAsync({
          id: blog._id,
          suggestionId,
          content,
          republish,
        })

        if (typeof setEditorContent === "function") {
          setEditorContent(result?.content ?? content)
        }

        persistInsight((prev: any) =>
          prev
            ? {
                ...prev,
                suggestions: prev.suggestions.map((s: any) =>
                  s._id === suggestionId ? { ...s, status: "applied" } : s
                ),
              }
            : prev
        )

        if (republish || result?.repost) await fetchPostings()
        toast.success(
          result?.repost ? "Applied and republished!" : "Suggestion applied to your content"
        )
      } catch {
        // useConfirmInsightMutation already surfaces the error toast
      } finally {
        hideLoading(loadingId)
      }
    },
    [
      blog?._id,
      confirmInsightMutation,
      setEditorContent,
      persistInsight,
      fetchPostings,
      showLoading,
      hideLoading,
    ]
  )

  const handleApplySuggestion = useCallback(
    async (suggestion: any, { scope, republish }: { scope?: string; republish?: boolean }) => {
      if (!blog?._id) return toast.error("Blog ID missing")
      if (!guardCreditedAction(COSTS.BLOG_INSIGHT.APPLY)) return

      setApplyingSuggestionId(suggestion._id)
      const loadingId = showLoading(
        scope === "whole" ? "Rewriting whole blog..." : "Rewriting section..."
      )
      try {
        // Generates the rewrite only — nothing is persisted yet. The blog's
        // saved content and the suggestion's status stay untouched until the
        // user reviews the diff below and accepts it (handleConfirmSuggestion).
        const result = await applyInsightMutation.mutateAsync({
          id: blog._id,
          suggestionId: suggestion._id,
          scope,
        })

        if (result?.content) {
          let original = editorContent || ""
          let refined = result.content

          if (scope === "section" && suggestion.sectionId) {
            const parser = new DOMParser()
            const oldDoc = parser.parseFromString(editorContent || "", "text/html")
            const oldSectionEl = oldDoc.getElementById(suggestion.sectionId)
            const newDoc = parser.parseFromString(result.content, "text/html")
            const newSectionEl = newDoc.getElementById(suggestion.sectionId)

            if (oldSectionEl && newSectionEl) {
              original = oldSectionEl.outerHTML
              refined = newSectionEl.outerHTML
            }
          }

          openReview({
            title: "Review Insight Rewrite",
            task: "Nothing is saved until you accept",
            original,
            refined,
            acceptLabel: "Accept & Apply",
            rejectLabel: "Keep Original",
            onAccept: () =>
              handleConfirmSuggestion({
                suggestionId: suggestion._id,
                republish,
                content: result.content,
              }),
          })
          setIsSidebarOpen?.(false)
        }
      } catch {
        // useApplyInsightMutation already surfaces the error toast
      } finally {
        setApplyingSuggestionId(null)
        hideLoading(loadingId)
      }
    },
    [
      blog?._id,
      guardCreditedAction,
      applyInsightMutation,
      editorContent,
      showLoading,
      hideLoading,
      openReview,
      handleConfirmSuggestion,
      setIsSidebarOpen,
      setApplyingSuggestionId,
    ]
  )

  // No confirmation popup — at 2 credits this is cheap enough to run on click,
  // and the result still goes through the accept/reject modal before it's kept.
  const handleMetadataGen = useCallback(async () => {
    if (!blog?._id) {
      toast.error("Save the blog before generating metadata.")
      return
    }
    if (blog?.isArchived) {
      toast.error("This blog is archived. Please restore it to perform this action.")
      return
    }
    if (isPro) return navigate("/pricing")

    setIsGeneratingMetadata(true)
    try {
      // The backend reads the blog's content and keywords itself — the id is
      // the whole payload.
      const result = await generateMetadata({ blogId: blog._id })
      // Show the generated metadata in accept/reject modal
      setGeneratedMetadata(result)
      setGeneratedMetadataModal(true)
    } catch {
      toast.error("Generation failed")
    } finally {
      setIsGeneratingMetadata(false)
    }
  }, [isPro, navigate, blog, generateMetadata])

  // Accept generated metadata
  const handleAcceptMetadata = useCallback(async () => {
    if (generatedMetadata) {
      setSeoMetadata({
        title: generatedMetadata.title || generatedMetadata.metaTitle || "",
        description: generatedMetadata.description || generatedMetadata.metaDescription || "",
      })
      setGeneratedMetadataModal(false)
      setGeneratedMetadata(null)
      toast.success("Metadata applied! Click Save to keep changes.")
    }
  }, [generatedMetadata, setSeoMetadata])

  // Reject generated metadata - keep original
  const handleRejectMetadata = useCallback(() => {
    setGeneratedMetadataModal(false)
    setGeneratedMetadata(null)
    toast.info("Metadata discarded")
  }, [])

  const handleMetadataSave = useCallback(async () => {
    if (blog?.isArchived) {
      toast.error("This blog is archived. Please restore it to perform this action.")
      return
    }
    if (!seoMetadata.title && !seoMetadata.description) return toast.error("Enter metadata")
    try {
      await handleSubmit?.({ metadata: seoMetadata })
      toast.success("Saved!")
    } catch {
      toast.error("Save failed")
    }
  }, [handleSubmit, seoMetadata, blog?.isArchived])

  const handlePdfExport = useCallback(
    async (withImages: boolean) => {
      if (!blog?._id) return toast.error("Blog ID missing")
      if (!editorContent?.trim()) return toast.error("No content to export")

      try {
        toast.loading("Exporting PDF...", { id: "pdf-export" })

        const { data: blob } = await exportBlog(blog._id, {
          type: "pdf",
          withImages,
        })

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        // Use .zip extension if images included, otherwise .pdf
        const downloadName = withImages ? `${blog.title || "blog"}.zip` : `${blog.title || "blog"}.pdf`
        a.download = downloadName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        const successMsg = withImages
          ? "PDF with images downloaded as ZIP!"
          : "PDF downloaded successfully!"
        toast.success(successMsg, { id: "pdf-export" })
      } catch (rawError) {
        const error = asApiError(rawError)
        console.error("PDF Export Error:", error)
        toast.error(error.message || "Failed to export PDF", { id: "pdf-export" })
      }
    },
    [blog, editorContent]
  )

  // --- Posting Helpers ---
  const openRepostModal = (posting: any) => {
    // Use metadata from the posting object as the primary source of truth
    const metadata = posting.metadata || {}
    setRepostSettings({
      platform: posting.integrationType || posting.platform || "",
      category: metadata.category || posting.category || "", // Prioritize metadata.category
      includeTableOfContents:
        metadata.includeTableOfContents ?? posting.includeTableOfContents ?? false, // Prioritize metadata.includeTableOfContents
    })
    setIsRepostModalOpen(true)
  }

  const handleRepostSubmit = async () => {
    if (blog?.isArchived) {
      toast.error("This blog is archived. Please restore it to perform this action.")
      return
    }
    if (!repostSettings.platform || !repostSettings.category) {
      return toast.error("Platform and Category are required")
    }

    try {
      await onPost?.({
        ...formData,
        categories: repostSettings.category,
        includeTableOfContents: repostSettings.includeTableOfContents,
        type: { platform: repostSettings.platform },
      })
      setIsRepostModalOpen(false)
      // Refresh postings and other data after repost
      await fetchPostings()
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
    } catch (error) {
      console.error("Repost failed", error)
    }
  }

  const seoScore = result?.insights?.blogScore || blog?.seoScore || 0
  const contentScore = blog?.blogScore || 0

  // Export handlers — `withImages` comes from SeoPanel's own local toggle rather
  // than shared state, since nothing else needs to know about it.
  const handleExportMarkdown = async (withImages: boolean) => {
    if (userPlan === "free") {
      return handlePopup({
        title: "Export Unavailable",
        description: "Free users cannot export blogs. Upgrade to unlock this feature.",
        confirmText: "Upgrade Now",
        onConfirm: () => navigate("/pricing"),
      })
    }

    if (!blog?._id) return toast.error("Blog ID missing")
    if (!editorContent?.trim()) return toast.error("No content to export")

    try {
      toast.loading(withImages ? "Preparing Markdown with images..." : "Generating Markdown...", {
        id: "md-export",
      })

      const { data: blob } = await exportBlog(blog._id, {
        type: "markdown",
        withImages,
      })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      // Use .zip extension if images included, otherwise .md
      const downloadName = withImages ? `${blog.title || "blog"}.zip` : `${blog.title || "blog"}.md`
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      const successMsg = withImages
        ? "Markdown with images downloaded as ZIP!"
        : "Markdown downloaded successfully!"
      toast.success(successMsg, { id: "md-export" })
    } catch (rawError) {
      const error = asApiError(rawError)
      console.error("Markdown export error:", error)
      toast.error(error.message || "Failed to export Markdown", { id: "md-export" })
    }
  }

  const handleExportHTML = async (withImages: boolean) => {
    if (userPlan === "free") {
      return handlePopup({
        title: "Export Unavailable",
        description: "Free users cannot export blogs. Upgrade to unlock this feature.",
        confirmText: "Upgrade Now",
        onConfirm: () => navigate("/pricing"),
      })
    }

    if (!blog?._id) return toast.error("Blog ID missing")
    if (!editorContent?.trim()) return toast.error("No content to export")

    try {
      toast.loading(withImages ? "Preparing HTML with images..." : "Generating HTML...", {
        id: "html-export",
      })

      const { data: blob } = await exportBlog(blog._id, {
        type: "html",
        withImages,
      })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      // Use .zip extension if images included, otherwise .html
      const downloadName = withImages
        ? `${blog.title || "blog"}.zip`
        : `${blog.title || "blog"}.html`
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      const successMsg = withImages
        ? "HTML with images downloaded as ZIP!"
        : "HTML downloaded successfully!"
      toast.success(successMsg, { id: "html-export" })
    } catch (rawError) {
      const error = asApiError(rawError)
      console.error("HTML export error:", error)
      toast.error(error.message || "Failed to export HTML", { id: "html-export" })
    }
  }

  const renderPanel = () => {
    switch (activePanel) {
      case "overview":
        return (
          <OverviewPanel
            blog={blog}
            isPro={isPro}
            isPublicMode={isPublicMode}
            isReadOnlyWorkspace={isReadOnlyWorkspace}
            setIsSidebarOpen={setIsSidebarOpen}
            onAnalyze={handleAnalyzing}
            isAnalyzing={isAnalyzingCompetitive}
            seoScore={seoScore}
            contentScore={contentScore}
          />
        )
      case "seo":
        return (
          <SeoPanel
            blog={blog}
            userPlan={userPlan}
            isPro={isPro}
            isPublicMode={isPublicMode}
            isReadOnlyWorkspace={isReadOnlyWorkspace}
            isLocked={isLocked}
            setIsSidebarOpen={setIsSidebarOpen}
            onMetadataGenerate={handleMetadataGen}
            onMetadataSave={handleMetadataSave}
            isGeneratingMetadata={isGeneratingMetadata}
            analysisResult={result}
            onExportMarkdown={handleExportMarkdown}
            onExportHTML={handleExportHTML}
            onExportPDF={handlePdfExport}
          />
        )
      case "bloginfo":
        return (
          <BlogInfoPanel
            blog={blog}
            hasPublishedLinks={hasPublishedLinks}
            isReadOnlyWorkspace={isReadOnlyWorkspace}
            isPublicMode={isPublicMode}
            setIsSidebarOpen={setIsSidebarOpen}
            onSlugSave={async (slug) => {
              await handleSubmit?.({ slug })
            }}
          />
        )
      case "brand":
        return (
          <BrandVoicePanel
            blog={blog}
            user={user}
            userPlan={userPlan}
            isPro={isPro}
            setIsSidebarOpen={setIsSidebarOpen}
            onRegenerateWithBrand={() => {
              if (blog?.isArchived) {
                toast.error("This blog is archived. Please restore it to perform this action.")
                return
              }
              setIsRegenerateModalOpen(true)
            }}
          />
        )
      case "posting":
        return (
          <PostingPanel
            blog={blog}
            userPlan={userPlan}
            isLocked={isLocked}
            isPublicMode={isPublicMode}
            hasGscAccess={hasGscAccess}
            onPost={onPost}
            handleSubmit={handleSubmit}
            setIsSidebarOpen={setIsSidebarOpen}
            onOpenRepostModal={openRepostModal}
          />
        )
      case "insights":
        return (
          <InsightsPanel
            blog={blog}
            user={user}
            userPlan={userPlan}
            isPro={isPro}
            isAnalyzing={analyzeBlogMutation.isPending}
            onAnalyze={handleAnalyzeInsights}
            onApplySuggestion={handleApplySuggestion}
            hasPublishedLinks={hasPublishedLinks}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        )
      case "sectionTools":
        return (
          <SectionToolsPanel
            blog={blog}
            isLocked={isLocked}
            isPublicMode={isPublicMode}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        )
      default:
        return (
          <OverviewPanel
            blog={blog}
            isPro={isPro}
            isPublicMode={isPublicMode}
            isReadOnlyWorkspace={isReadOnlyWorkspace}
            setIsSidebarOpen={setIsSidebarOpen}
            onAnalyze={handleAnalyzing}
            isAnalyzing={isAnalyzingCompetitive}
            seoScore={seoScore}
            contentScore={contentScore}
          />
        )
    }
  }

  if (isCollapsed) {
    return (
      <div className="w-16 border-l border-gray-200 flex flex-col items-center py-5 shadow-xs bg-gray-50/50 h-full">
        <div className="flex flex-col gap-2">
          <div className="tooltip tooltip-left" data-tip="Expand Sidebar">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all duration-300 group"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
          </div>
          <div className="w-8 h-px bg-gray-300 mx-auto my-2" />
        </div>
        <div className="flex flex-col items-center gap-4 py-6">
          {NAV_ITEMS.filter(
            (item) =>
              !isLocked || !["regenerate", "sectionTools", "posting", "insights"].includes(item.id)
          ).map((item) => {
            const isActive = activePanel === item.id
            const Icon = item.icon
            return (
              <div key={item.id} className="tooltip tooltip-left" data-tip={item.label}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.id === "regenerate") {
                      setIsRegenerateModalOpen(true)
                    } else {
                      if (isActive && !isCollapsed) {
                        setIsCollapsed(true)
                      } else {
                        setActivePanel(item.id)
                        setIsCollapsed(false)
                      }
                    }
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
                    isActive && !isCollapsed
                      ? "bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200"
                      : "text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-md"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isActive && !isCollapsed ? "" : "group-hover:scale-110"
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-full">
        {/* Content Panel */}
        <div className="flex-1 w-80 bg-white border-l border-gray-300 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="h-full flex flex-col"
            >
              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Icon Navigation Bar - Premium Theme */}
        <div className="w-16 border-l border-gray-200 flex flex-col items-center py-5 shadow-xs bg-gray-50/50 h-full">
          <div className="flex flex-col gap-2">
            {/* Mobile close */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setIsSidebarOpen?.(false)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-5">
            {NAV_ITEMS.filter(
              (item) =>
                !isLocked ||
                !["regenerate", "sectionTools", "posting", "insights"].includes(item.id)
            ).map((item) => {
              const Icon = item.icon
              const isActive = activePanel === item.id
              return (
                <div key={item.id} className="tooltip tooltip-left" data-tip={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (blog?.isArchived && item.id === "regenerate") {
                        toast.error(
                          "This blog is archived. Please restore it to perform this action."
                        )
                        return
                      }
                      if (item.id === "regenerate") {
                        if (isLocked) {
                          toast.error("Regeneration is unavailable in read-only mode.")
                          return
                        }
                        // Open the regenerate modal
                        setIsRegenerateModalOpen(true)
                      } else {
                        if (isActive && !isCollapsed) {
                          setIsCollapsed(true)
                        } else {
                          setActivePanel(item.id)
                          setIsCollapsed(false)
                        }
                      }
                    }}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
                      isActive && !isCollapsed
                        ? "text-white"
                        : "text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-md"
                    }`}
                  >
                    {isActive && !isCollapsed && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-linear-to-br from-blue-600 to-indigo-700 rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon
                      className={`w-5 h-5 transition-transform duration-300 relative z-10 ${
                        isActive && !isCollapsed ? "" : "group-hover:scale-110"
                      }`}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Edit & Repost Modal */}
      <div className={`modal ${isRepostModalOpen ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit & Repost</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="repost-platform" className="text-xs font-semibold  mb-1.5 block">
                Platform
              </label>
              <select
                id="repost-platform"
                className="select select-bordered outline-0 w-full"
                value={repostSettings.platform}
                onChange={(e) => setRepostSettings({ ...repostSettings, platform: e.target.value })}
              >
                {Object.entries(integrations?.integrations || {}).map(([k, _v]) => (
                  <option key={k} value={k}>
                    {PLATFORM_LABELS[k] || k}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                Platform cannot be changed for reposting.
              </p>
            </div>

            <div>
              <label htmlFor="repost-category" className="text-xs font-semibold  mb-1.5 block">
                Category
              </label>
              <input
                id="repost-category"
                type="text"
                className="input input-bordered w-full"
                placeholder="Select or type..."
                value={repostSettings.category || ""}
                onChange={(e) => setRepostSettings({ ...repostSettings, category: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-xs font-semibold text-gray-800">Table of Contents</span>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={repostSettings.includeTableOfContents}
                onChange={(e) =>
                  setRepostSettings({ ...repostSettings, includeTableOfContents: e.target.checked })
                }
              />
            </div>

            {repostSettings.platform && (
              <PlatformCategoriesField
                onSelect={(cat: any) => setRepostSettings({ ...repostSettings, category: cat })}
                currentCategory={repostSettings.category}
                platform={repostSettings.platform}
              />
            )}
          </div>
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setIsRepostModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn btn-sm btn-primary text-white ${isPosting ? "loading" : ""}`}
              onClick={handleRepostSubmit}
            >
              Repost Now
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          className="modal-backdrop"
          onClick={() => setIsRepostModalOpen(false)}
        />
      </div>

      {/* Generated Metadata Accept/Reject Modal */}
      <div className={`modal ${generatedMetadataModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Generated SEO Metadata</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Review the AI-generated metadata below. Accept to apply these changes or reject to
              keep your current data.
            </p>

            <div>
              <span className="block text-xs font-medium text-gray-500 mb-1">Generated Title</span>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-800">
                  {generatedMetadata?.title || generatedMetadata?.metaTitle || "No title generated"}
                </p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-500 mb-1">
                Generated Description
              </span>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-800">
                  {generatedMetadata?.description ||
                    generatedMetadata?.metaDescription ||
                    "No description generated"}
                </p>
              </div>
            </div>

            {/* Current values for comparison */}
            <div className="border-t pt-4 mt-4">
              <p className="text-xs font-medium text-gray-400 mb-2">
                Current Values (will be replaced if accepted):
              </p>
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Title:</span> {seoMetadata.title || "Not set"}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Description:</span>{" "}
                  {seoMetadata.description || "Not set"}
                </p>
              </div>
            </div>
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-sm" onClick={handleRejectMetadata}>
              Reject
            </button>
            <button
              type="button"
              onClick={handleAcceptMetadata}
              className="btn btn-sm btn-success text-white bg-linear-to-r from-green-500 to-emerald-600 border-0"
            >
              Accept & Apply
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          className="modal-backdrop"
          onClick={handleRejectMetadata}
        />
      </div>

      {/* Regenerate Modal — owns its own form state, cost calc, submit, and reads
          the open blog from useBlogStore directly instead of taking it as a prop */}
      <RegenerateModal isOpen={isRegenerateModalOpen} onClose={() => setIsRegenerateModalOpen(false)} />

      {/* Categories Modal for Publishing */}
      <CategoriesModal
        isCategoryModalOpen={isCategoryModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        onSubmit={onPost}
        initialIncludeTableOfContents={false}
        integrations={integrations}
        blogData={blog}
        posted={posted}
      />
    </>
  )
}

export default TextEditorSidebar
