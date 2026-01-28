/**
 * TextEditorSidebar - Main Controller
 *
 * Refactored modular sidebar with:
 * - Dynamic panel switching
 * - Clean separation of concerns
 * - TypeScript type safety
 * - Framer Motion animations
 * - SessionStorage persistence
 *
 * Architecture:
 * - Each panel in `sidebars/` folder
 * - Shared types in `types.ts`
 * - Animation hook respects `prefers-reduced-motion`
 * - All business logic handled here, panels are presentation-only
 */

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { message, Modal } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import * as Cheerio from "cheerio"

// Redux actions
import { fetchProofreadingSuggestions, fetchBlogPrompt } from "@store/slices/blogSlice"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import {
  generateMetadataThunk,
  getIntegrationsThunk,
  getCategoriesThunk,
  resetCategories,
} from "@store/slices/otherSlice"

// API
import {
  retryBlogById,
  exportBlogAsPdf,
  getBlogPostings,
  exportBlog,
  updateBlog,
} from "@api/blogApi"

// Utils
import { getEstimatedCost, creditCostsWithGemini } from "@utils/getEstimatedCost"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { validateRegenerateBlogData } from "@/types/forms.schemas"

// Data
import { TONES, IMAGE_SOURCE, DEFAULT_IMAGE_SOURCE } from "@/data/blogData"
import { computeCost } from "@/data/pricingConfig"

// Components
import RegenerateModal from "@components/RegenerateModal"
import CategoriesModal from "../Editor/CategoriesModal"

// Local modules
import { BASE_NAV_ITEMS, POSTING_NAV_ITEM, REGENERATE_NAV_ITEM, BRAND_NAV_ITEM } from "./constants"
import OverviewPanel from "./sidebars/OverviewPanel"
import SeoPanel from "./sidebars/SeoPanel"
import BlogInfoPanel from "./sidebars/BlogInfoPanel"
import BrandVoicePanel from "./sidebars/BrandVoicePanel"
import PostingPanel from "./sidebars/PostingPanel"
import RegeneratePanel from "./sidebars/RegeneratePanel"
import type { Blog, BlogPosting, Metadata, RegenerateForm } from "./types"

// AI Models config
const AI_MODELS = [
  { id: "gemini", label: "Gemini", logo: "/Images/gemini.webp", restrictedPlans: [] },
  { id: "openai", label: "ChatGPT", logo: "/Images/chatgpt.webp", restrictedPlans: ["free"] },
  {
    id: "claude",
    label: "Claude",
    logo: "/Images/claude.webp",
    restrictedPlans: ["free", "basic"],
  },
]

interface TextEditorSidebarProps {
  blog: Blog
  keywords: string[]
  setKeywords: (keywords: string[]) => void
  onPost: (data: any) => void
  handleReplace: (content: string) => void
  setProofreadingResults: (results: any) => void
  proofreadingResults: any
  handleSave: () => void
  posted: boolean
  isPosting: boolean
  formData: any
  editorContent: string
  handleSubmit: () => void
  setIsHumanizing: (value: boolean) => void
  isHumanizing: boolean
  setHumanizedContent: (content: string) => void
  setIsHumanizeModalOpen: (open: boolean) => void
  setIsSidebarOpen?: (open: boolean) => void
  unsavedChanges: boolean
}

const TextEditorSidebar: React.FC<TextEditorSidebarProps> = ({
  blog,
  keywords,
  setKeywords,
  onPost,
  handleReplace,
  setProofreadingResults,
  proofreadingResults,
  handleSave,
  posted,
  isPosting,
  formData,
  editorContent,
  handleSubmit,
  setIsHumanizing,
  isHumanizing,
  setHumanizedContent,
  setIsHumanizeModalOpen,
  setIsSidebarOpen,
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showPopup } = useConfirmPopup()

  // Redux state
  const { data: integrations } = useSelector((state: any) => state.wordpress)
  const { categories, error: wordpressError } = useSelector((state: any) => state.wordpress)
  const { user } = useSelector((state: any) => state.auth)
  const { analysisResults, isAnalyzing } = useSelector((state: any) => state.analysis)

  // User plan detection
  const userPlan = user?.subscriptionType || "free"
  const isPro = userPlan !== "free"

  // Sidebar state
  const [activePanel, setActivePanel] = useState("overview")
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false)
  const [generatedMetadataModal, setGeneratedMetadataModal] = useState(false)
  const [generatedMetadata, setGeneratedMetadata] = useState<Metadata | null>(null)

  // Blog postings
  const [blogPostings, setBlogPostings] = useState<BlogPosting[]>([])
  const [isLoadingPostings, setIsLoadingPostings] = useState(false)

  // Slug editing
  const [blogSlug, setBlogSlug] = useState(blog?.slug || "")
  const [isEditingSlug, setIsEditingSlug] = useState(false)

  // Posting state
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedIntegration, setSelectedIntegration] = useState<{
    platform: string
    rawPlatform: string
    url: string
  } | null>(null)
  const [includeTableOfContents, setIncludeTableOfContents] = useState(false)
  const [isCategoryLocked, setIsCategoryLocked] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  const [platformError, setPlatformError] = useState(false)
  const [errors, setErrors] = useState({ category: "", platform: "" })

  // SEO metadata
  const [metadata, setMetadata] = useState<Metadata>({
    title: blog?.seoMetadata?.title || "",
    description: blog?.seoMetadata?.description || "",
  })
  const [includeImagesInExport, setIncludeImagesInExport] = useState(false)
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false)

  // Regenerate form
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenForm, setRegenForm] = useState<RegenerateForm>({
    topic: "",
    title: "",
    focusKeywords: [],
    keywords: [],
    tone: "Professional",
    userDefinedLength: 1000,
    aiModel: "gemini",
    isCheckedGeneratedImages: false,
    imageSource: DEFAULT_IMAGE_SOURCE,
    numberOfImages: 0,
    useBrandVoice: false,
    brandId: "",
    addCTA: false,
    costCutter: false,
    options: {
      includeFaqs: false,
      includeInterlinks: false,
      includeCompetitorResearch: false,
      addOutBoundLinks: false,
      performKeywordResearch: false,
    },
    easyToUnderstand: false,
    embedYouTubeVideos: false,
    isCheckedQuick: false,
    wordpressPostStatus: false,
    postingType: null,
    includeTableOfContents: false,
  })

  /**
   * Navigation items with conditional brand panel
   */
  const NAV_ITEMS = [
    ...BASE_NAV_ITEMS,
    ...(blog?.brandId || blog?.nameOfVoice ? [BRAND_NAV_ITEM] : []),
    POSTING_NAV_ITEM,
    REGENERATE_NAV_ITEM,
  ]

  /**
   * Fetch integrations on mount
   */
  useEffect(() => {
    dispatch(getIntegrationsThunk() as any)
  }, [dispatch])

  /**
   * Load blog postings
   */
  useEffect(() => {
    if (!blog?._id) return

    const loadPostings = async () => {
      setIsLoadingPostings(true)
      try {
        const response: any = await getBlogPostings(blog._id)
        setBlogPostings(response?.data?.data || [])
      } catch (error) {
        console.error("Failed to load postings:", error)
      } finally {
        setIsLoadingPostings(false)
      }
    }

    loadPostings()
  }, [blog?._id])

  /**
   * Update slug when blog changes
   */
  useEffect(() => {
    setBlogSlug(blog?.slug || "")
  }, [blog?.slug])

  /**
   * Initialize regenerate form from blog data
   */
  useEffect(() => {
    if (!blog) return

    setRegenForm({
      topic: blog.topic || "",
      title: blog.title || "",
      focusKeywords: blog.focusKeywords || [],
      keywords: blog.keywords || [],
      tone: blog.tone || "Professional",
      userDefinedLength: blog.userDefinedLength || 1000,
      aiModel: blog.aiModel || "gemini",
      isCheckedGeneratedImages: blog.isCheckedGeneratedImages || false,
      imageSource: blog.imageSource || DEFAULT_IMAGE_SOURCE,
      numberOfImages: blog.numberOfImages || 0,
      useBrandVoice: !!blog.brandId,
      brandId:
        typeof blog.brandId === "object" && blog.brandId?._id
          ? blog.brandId._id
          : typeof blog.brandId === "string"
            ? blog.brandId
            : "",
      addCTA: blog.options?.addCTA || false,
      costCutter: blog.costCutter || false,
      options: {
        includeFaqs: blog.options?.includeFaqs || false,
        includeInterlinks: blog.options?.includeInterlinks || false,
        includeCompetitorResearch: blog.options?.includeCompetitorResearch || false,
        addOutBoundLinks: blog.options?.addOutBoundLinks || false,
        performKeywordResearch: blog.options?.performKeywordResearch || false,
      },
      easyToUnderstand: blog.easyToUnderstand || false,
      embedYouTubeVideos: blog.embedYouTubeVideos || false,
      isCheckedQuick: blog.isCheckedQuick || false,
      wordpressPostStatus: blog.wordpressPostStatus || false,
      postingType: blog.postingDefaultType || null,
      includeTableOfContents: blog.options?.includeTableOfContents || false,
    })
  }, [blog])

  /**
   * Handle competitive analysis
   */
  const handleAnalyze = useCallback(async () => {
    if (isAnalyzing) return

    // Check credits
    if (!isPro && user?.usage?.competitiveAnalysis <= 0) {
      showPopup({ featureName: "Competitive Analysis", navigate, onCancel: () => {} })
      return
    }

    try {
      const thunkAction: any = fetchCompetitiveAnalysisThunk as any
      const result: any = await dispatch(thunkAction({ blogId: blog._id, editorContent })).unwrap()

      if (result?.success) {
        message.success("Analysis complete!")
        // Update automatically from Redux
      }
    } catch (error: any) {
      message.error(error.message || "Analysis failed")
    }
  }, [isAnalyzing, isPro, user, blog._id, editorContent, dispatch, navigate, showPopup])

  /**
   * Handle metadata generation
   */
  const handleMetadataGenerate = useCallback(async () => {
    setIsGeneratingMetadata(true)
    try {
      const thunkAction: any = generateMetadataThunk as any
      const result: any = await dispatch(
        thunkAction({ blogId: blog._id, content: editorContent })
      ).unwrap()

      if (result?.success) {
        setGeneratedMetadata(result?.data)
        setGeneratedMetadataModal(true)
      }
    } catch (error: any) {
      message.error(error.message || "Failed to generate metadata")
    } finally {
      setIsGeneratingMetadata(false)
    }
  }, [blog._id, editorContent, dispatch])

  /**
   * Handle metadata save
   */
  const handleMetadataSave = useCallback(async () => {
    try {
      await updateBlog(blog._id, { seoMetadata: metadata })
      message.success("Metadata saved successfully")
      queryClient.invalidateQueries({ queryKey: ["blog", blog._id] })
    } catch (error) {
      message.error("Failed to save metadata")
    }
  }, [blog._id, metadata, queryClient])

  /**
   * Handle slug save
   */
  const handleSlugSave = useCallback(
    async (newSlug: string) => {
      try {
        await updateBlog(blog._id, { slug: newSlug })
        message.success("Slug updated")
        queryClient.invalidateQueries({ queryKey: ["blog", blog._id] })
      } catch (error) {
        message.error("Failed to update slug")
        throw error
      }
    },
    [blog._id, queryClient]
  )

  /**
   * Handle export functions
   */
  const handleExportMarkdown = useCallback(async () => {
    try {
      await (exportBlog as any)(blog._id, { type: "markdown", withImages: includeImagesInExport })
      message.success("Exported as Markdown")
    } catch (error) {
      message.error("Export failed")
    }
  }, [blog._id, includeImagesInExport])

  const handleExportHTML = useCallback(async () => {
    try {
      await (exportBlog as any)(blog._id, { type: "html", withImages: includeImagesInExport })
      message.success("Exported as HTML")
    } catch (error) {
      message.error("Export failed")
    }
  }, [blog._id, includeImagesInExport])

  const handleExportPDF = useCallback(async () => {
    try {
      await exportBlogAsPdf(blog._id)
      message.success("Exported as PDF")
    } catch (error) {
      message.error("Export failed")
    }
  }, [blog._id])

  /**
   * Handle regenerate submission
   */
  const handleRegenerateSubmit = useCallback(
    async (formData: any) => {
      setIsRegenerating(true)
      try {
        await retryBlogById(blog._id, formData)
        message.success("Blog regeneration started!")
        setIsRegenerateModalOpen(false)
        queryClient.invalidateQueries({ queryKey: ["blog", blog._id] })
      } catch (error: any) {
        message.error(error.message || "Regeneration failed")
      } finally {
        setIsRegenerating(false)
      }
    },
    [blog._id, queryClient]
  )

  /**
   * Update regenerate form field
   */
  const updateRegenField = useCallback((field: string, value: any) => {
    setRegenForm(prev => ({ ...prev, [field]: value }))
  }, [])

  /**
   * Render active panel
   */
  const renderActivePanel = () => {
    const commonProps = { blog, user, userPlan, isPro }

    switch (activePanel) {
      case "overview":
        return (
          <OverviewPanel
            {...commonProps}
            editorContent={editorContent}
            keywords={keywords}
            setIsSidebarOpen={setIsSidebarOpen}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            seoScore={analysisResults?.insights?.seoScore || blog?.seoScore || 0}
            contentScore={analysisResults?.insights?.blogScore || blog?.blogScore || 0}
          />
        )

      case "seo":
        return (
          <SeoPanel
            {...commonProps}
            metadata={metadata}
            setMetadata={setMetadata}
            onMetadataGenerate={handleMetadataGenerate}
            onMetadataSave={handleMetadataSave}
            isGeneratingMetadata={isGeneratingMetadata}
            analysisResult={analysisResults}
            editorContent={editorContent}
            includeImagesInExport={includeImagesInExport}
            setIncludeImagesInExport={setIncludeImagesInExport}
            onExportMarkdown={handleExportMarkdown}
            onExportHTML={handleExportHTML}
            onExportPDF={handleExportPDF}
          />
        )

      case "bloginfo":
        return (
          <BlogInfoPanel
            {...commonProps}
            blogSlug={blogSlug}
            setBlogSlug={setBlogSlug}
            isEditingSlug={isEditingSlug}
            setIsEditingSlug={setIsEditingSlug}
            hasPublishedLinks={blogPostings.length > 0}
            onSlugSave={handleSlugSave}
          />
        )

      case "brand":
        return (
          <BrandVoicePanel
            {...commonProps}
            onRegenerateWithBrand={() => setIsRegenerateModalOpen(true)}
          />
        )

      case "posting":
        return (
          <PostingPanel
            {...commonProps}
            integrations={integrations}
            blogPostings={blogPostings}
            isLoadingPostings={isLoadingPostings}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedIntegration={selectedIntegration}
            setSelectedIntegration={setSelectedIntegration}
            includeTableOfContents={includeTableOfContents}
            setIncludeTableOfContents={setIncludeTableOfContents}
            isCategoryLocked={isCategoryLocked}
            categoryError={categoryError}
            platformError={platformError}
            errors={errors}
            onPost={onPost}
            isPosting={isPosting}
            formData={formData}
            hasAnyIntegration={
              integrations?.integrations && Object.keys(integrations.integrations).length > 0
            }
          />
        )

      case "regenerate":
        return (
          <RegeneratePanel {...commonProps} onRegenerate={() => setIsRegenerateModalOpen(true)} />
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Main Sidebar */}
      <div className={`flex h-full transition-all ${isCollapsed ? "w-16" : "w-full"}`}>
        {/* Panel Content */}
        <div className="flex-1 min-w-0 bg-white border-r">
          <AnimatePresence mode="wait">
            <motion.div key={activePanel} className="h-full">
              {renderActivePanel()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Bar */}
        <div className="w-16 bg-gray-900 flex flex-col items-center py-4 gap-2">
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors mb-2"
          >
            {isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>

          {/* Nav Items */}
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activePanel === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  transition-all group relative
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }
                `}
                title={item.label}
              >
                <Icon size={18} />
                {/* Tooltip */}
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      <RegenerateModal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        onSubmit={handleRegenerateSubmit}
        isRegenerating={isRegenerating}
        regenForm={regenForm}
        updateRegenField={updateRegenField}
        userPlan={userPlan}
        integrations={integrations}
      />

      <CategoriesModal
        isCategoryModalOpen={isCategoryModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        onSubmit={onPost}
        initialIncludeTableOfContents={includeTableOfContents}
        integrations={integrations}
        blogData={blog}
        posted={posted}
      />

      {/* Generated Metadata Modal */}
      <Modal
        title="Generated Metadata"
        open={generatedMetadataModal}
        onCancel={() => setGeneratedMetadataModal(false)}
        onOk={() => {
          if (generatedMetadata) {
            setMetadata(generatedMetadata)
            message.success("Metadata applied")
          }
          setGeneratedMetadataModal(false)
        }}
        okText="Apply"
      >
        {generatedMetadata && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Title</label>
              <p className="text-sm">{generatedMetadata.title}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Description</label>
              <p className="text-sm">{generatedMetadata.description}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default TextEditorSidebar
