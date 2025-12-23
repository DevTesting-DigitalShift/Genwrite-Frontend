import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  RefreshCw,
  TrendingUp,
  FileText,
  Sparkles,
  Send,
  ExternalLink,
  Target,
  Plus,
  X,
  TagIcon,
  BarChart3,
  Wand2,
  Settings,
  Zap,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Eye,
  BarChart,
  RefreshCcw,
  Crown,
  Download,
  FileCode,
  Lock,
  Globe,
  Info,
  Calendar,
  User,
} from "lucide-react"
import {
  Button,
  message,
  Input,
  Select,
  Slider,
  Switch,
  InputNumber,
  Tooltip,
  Badge,
  Collapse,
} from "antd"
import { fetchProofreadingSuggestions, fetchBlogPrompt } from "@store/slices/blogSlice"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import { generateMetadataThunk, getIntegrationsThunk } from "@store/slices/otherSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { getEstimatedCost, creditCostsWithGemini } from "@utils/getEstimatedCost"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { Modal } from "antd"
import CategoriesModal from "../Editor/CategoriesModal"
import { TONES } from "@/data/blogData"
import { retryBlogById, exportBlogAsPdf } from "@api/blogApi"
import { validateRegenerateBlogData } from "@/types/forms.schemas"
import { useQueryClient } from "@tanstack/react-query"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import { ScoreCard, StatCard, CompetitorsList, AnalysisInsights } from "./FeatureComponents"

import { IMAGE_SOURCE, DEFAULT_IMAGE_SOURCE } from "@/data/blogData"
import { computeCost } from "@/data/pricingConfig"

const { TextArea } = Input
const { Panel } = Collapse

// AI Models config
const AI_MODELS = [
  { id: "gemini", label: "Gemini", logo: "/Images/gemini.png", restrictedPlans: [] },
  { id: "openai", label: "ChatGPT", logo: "/Images/chatgpt.png", restrictedPlans: ["free"] },
  { id: "claude", label: "Claude", logo: "/Images/claude.png", restrictedPlans: ["free", "basic"] },
]

// Sidebar navigation items
const NAV_ITEMS = [
  { id: "overview", icon: BarChart3, label: "Overview" },
  { id: "seo", icon: TrendingUp, label: "SEO" },
  { id: "bloginfo", icon: Info, label: "Blog Info" },
  { id: "regenerate", icon: RefreshCw, label: "Regenerate" },
]

const TextEditorSidebar = ({
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
  unsavedChanges,
}) => {
  const [activePanel, setActivePanel] = useState("overview")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [choosePlatformOpen, setChoosePlatformOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [keywordInput, setKeywordInput] = useState("")
  const [focusKeywordInput, setFocusKeywordInput] = useState("")

  // 2-step regenerate modal state
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false)
  const [regenerateStep, setRegenerateStep] = useState(1)

  const { data: integrations } = useSelector(state => state.wordpress)
  const [metadata, setMetadata] = useState({
    title: blog?.seoMetadata?.title || "",
    description: blog?.seoMetadata?.description || "",
  })

  // Generated metadata accept/reject modal state
  const [generatedMetadataModal, setGeneratedMetadataModal] = useState(false)
  const [generatedMetadata, setGeneratedMetadata] = useState(null)
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false)

  // Content enhancement editable options state
  const [enhancementOptions, setEnhancementOptions] = useState({})
  const [hasEnhancementChanges, setHasEnhancementChanges] = useState(false)
  const [isSavingEnhancement, setIsSavingEnhancement] = useState(false)

  // Regenerate form data
  const [regenForm, setRegenForm] = useState({
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
    options: {
      includeFaqs: false,
      includeInterlinks: false,
      includeCompetitorResearch: false,
      addOutBoundLinks: false,
    },
  })

  const user = useSelector(state => state.auth.user)
  const userPlan = user?.subscription?.plan?.toLowerCase() || "free"
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()
  const { loading: isAnalyzingCompetitive } = useSelector(state => state.analysis)
  const { analysisResult } = useSelector(state => state.analysis)
  const result = analysisResult?.[blog?._id]

  const hasAnyIntegration =
    integrations?.integrations && Object.keys(integrations.integrations).length > 0
  const isDisabled = isPosting || !hasAnyIntegration
  const isPro = ["free", "basic"].includes(userPlan)

  const PLATFORM_LABELS = {
    WORDPRESS: "WordPress",
    SHOPIFY: "Shopify",
    SERVERENDPOINT: "Server",
    WIX: "Wix",
  }
  const postedLinks = posted
    ? Object.entries(posted)
        .filter(([_, data]) => data?.link)
        .map(([platform, data]) => ({
          platform,
          link: data.link,
          label: PLATFORM_LABELS[platform] || platform,
        }))
    : []

  // Initialize data
  useEffect(() => {
    setMetadata({
      title: blog?.seoMetadata?.title || "",
      description: blog?.seoMetadata?.description || "",
    })
  }, [blog?._id])

  useEffect(() => {
    if (blog) {
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
        useBrandVoice: blog.isCheckedBrand || false,
        brandId: blog.brandId || "",
        addCTA: blog.options?.addCTA || false,
        options: {
          includeFaqs: blog.options?.includeFaqs || false,
          includeInterlinks: blog.options?.includeInterlinks || false,
          includeCompetitorResearch: blog.options?.includeCompetitorResearch || false,
          addOutBoundLinks: blog.options?.addOutBoundLinks || false,
        },
      })
    }
  }, [blog])

  useEffect(() => {
    dispatch(getIntegrationsThunk())
  }, [dispatch])

  // Initialize enhancement options from blog
  useEffect(() => {
    if (blog?.options) {
      setEnhancementOptions(blog.options)
      setHasEnhancementChanges(false)
    }
  }, [blog?.options])

  const getWordCount = text => {
    if (!text) return 0

    // Create a temporary DOM element to properly strip HTML
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = text

    // Get text content (this removes all HTML tags)
    const strippedText = tempDiv.textContent || tempDiv.innerText || ""

    // Remove extra whitespace and count words
    const words = strippedText
      .trim()
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .split(" ")
      .filter(word => word.length > 0)

    return words.length
  }

  // Update regen form field
  const updateRegenField = useCallback((field, value) => {
    setRegenForm(prev => {
      if (field.includes(".")) {
        const [parent, child] = field.split(".")
        return { ...prev, [parent]: { ...prev[parent], [child]: value } }
      }
      return { ...prev, [field]: value }
    })
  }, [])

  // Calculate regenerate cost using pricing config
  const calculateRegenCost = useCallback(() => {
    const features = []

    // Add features based on selections
    if (regenForm.useBrandVoice) features.push("brandVoice")
    if (regenForm.options.includeCompetitorResearch) features.push("competitorResearch")
    if (regenForm.options.includeFaqs) features.push("faqGeneration")
    if (regenForm.options.includeInterlinks) features.push("internalLinking")
    // Note: addOutBoundLinks does not add extra credits

    return computeCost({
      wordCount: regenForm.userDefinedLength || 1000,
      features,
      aiModel: regenForm.aiModel || "gemini",
      includeImages: regenForm.isCheckedGeneratedImages,
      imageSource: regenForm.imageSource,
      numberOfImages: regenForm.numberOfImages || 3,
      isCheckedBrand: regenForm.useBrandVoice,
    })
  }, [regenForm])

  // Handlers
  const handleRegenerate = async () => {
    if (!blog?._id) return message.error("Blog ID missing")

    // Open the 2-step modal
    setRegenerateStep(1)
    setIsRegenerateModalOpen(true)
  }

  // Handle regenerate modal submission
  const handleRegenerateSubmit = async () => {
    const cost = calculateRegenCost()
    const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

    if (credits < cost) {
      setIsRegenerateModalOpen(false)
      return handlePopup({
        title: "Insufficient Credits",
        description: `Need ${cost} credits, have ${credits}.`,
        confirmText: "Buy Credits",
        onConfirm: () => navigate("/pricing"),
      })
    }

    setIsRegenerating(true)
    try {
      // Prepare the payload with createNew: true and blog data
      const payload = {
        createNew: true,
        ...regenForm,
        isCheckedBrand: regenForm.useBrandVoice,
        // If images are disabled, set imageSource to "none"
        imageSource: regenForm.isCheckedGeneratedImages ? regenForm.imageSource : "none",
      }

      // Validate and transform the payload
      const validatedPayload = validateRegenerateBlogData(payload)

      // Call retry API with blog data - backend will update and regenerate
      await retryBlogById(blog._id, validatedPayload)

      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      message.success("Blog regeneration started!")
      setIsRegenerateModalOpen(false)
      navigate("/blogs")
    } catch (error) {
      message.error(error.message || "Failed to regenerate")
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleAnalyzing = useCallback(() => {
    if (isPro) return navigate("/pricing")
    handlePopup({
      title: "SEO Analysis",
      description: (
        <>
          Run competitive analysis? <span className="font-bold">10 credits</span>
        </>
      ),
      confirmText: "Run",
      onConfirm: async () => {
        try {
          await dispatch(
            fetchCompetitiveAnalysisThunk({
              blogId: blog._id,
              title: blog.title,
              content: blog.content,
              keywords: keywords || blog?.focusKeywords || [],
            })
          ).unwrap()
          setActivePanel("seo")
          message.success("Analysis complete!")
        } catch {
          message.error("Analysis failed")
        }
      },
    })
  }, [isPro, navigate, handlePopup, dispatch, blog, keywords])

  const handleMetadataGen = useCallback(() => {
    if (isPro) return navigate("/pricing")
    handlePopup({
      title: "Generate Metadata",
      description: (
        <>
          Generate SEO metadata? <span className="font-bold">2 credits</span>
        </>
      ),
      onConfirm: async () => {
        setIsGeneratingMetadata(true)
        try {
          const result = await dispatch(
            generateMetadataThunk({
              content: editorContent,
              keywords: keywords || [],
              focusKeywords: blog?.focusKeywords || [],
            })
          ).unwrap()
          // Show the generated metadata in accept/reject modal
          setGeneratedMetadata(result)
          setGeneratedMetadataModal(true)
        } catch {
          message.error("Generation failed")
        } finally {
          setIsGeneratingMetadata(false)
        }
      },
    })
  }, [isPro, navigate, handlePopup, dispatch, editorContent, keywords, blog])

  // Accept generated metadata
  const handleAcceptMetadata = useCallback(async () => {
    if (generatedMetadata) {
      setMetadata({
        title: generatedMetadata.title || generatedMetadata.metaTitle || "",
        description: generatedMetadata.description || generatedMetadata.metaDescription || "",
      })
      setGeneratedMetadataModal(false)
      setGeneratedMetadata(null)
      message.success("Metadata applied! Click Save to keep changes.")
    }
  }, [generatedMetadata])

  // Reject generated metadata - keep original
  const handleRejectMetadata = useCallback(() => {
    setGeneratedMetadataModal(false)
    setGeneratedMetadata(null)
    message.info("Metadata discarded")
  }, [])

  // Enhancement option toggle handler
  const handleEnhancementToggle = useCallback((key, value) => {
    setEnhancementOptions(prev => ({ ...prev, [key]: value }))
    setHasEnhancementChanges(true)
  }, [])

  // Save enhancement options
  const handleSaveEnhancement = useCallback(async () => {
    setIsSavingEnhancement(true)
    try {
      await handleSubmit({ options: enhancementOptions })
      setHasEnhancementChanges(false)
      message.success("Enhancement settings saved!")
    } catch {
      message.error("Failed to save settings")
    } finally {
      setIsSavingEnhancement(false)
    }
  }, [enhancementOptions, handleSubmit])

  const handleCustomPromptBlog = useCallback(async () => {
    if (isPro) return navigate("/pricing")
    if (!customPrompt.trim()) return message.error("Enter a prompt")
    handlePopup({
      title: "Apply Custom Prompt",
      description: (
        <>
          Modify content? <span className="font-bold">5 credits</span>
        </>
      ),
      onConfirm: async () => {
        setIsHumanizing(true)
        try {
          const result = await dispatch(
            fetchBlogPrompt({ id: blog._id, prompt: customPrompt })
          ).unwrap()
          setHumanizedContent(result.data)
          setIsHumanizeModalOpen(true)
          setCustomPrompt("")
          message.success("Prompt applied!")
        } catch {
          message.error("Failed")
        } finally {
          setIsHumanizing(false)
        }
      },
    })
  }, [
    isPro,
    navigate,
    handlePopup,
    dispatch,
    blog,
    customPrompt,
    setHumanizedContent,
    setIsHumanizing,
    setIsHumanizeModalOpen,
  ])

  const handleMetadataSave = useCallback(async () => {
    if (!metadata.title && !metadata.description) return message.error("Enter metadata")
    try {
      await handleSubmit({ metadata })
      message.success("Saved!")
    } catch {
      message.error("Save failed")
    }
  }, [handleSubmit, metadata])

  const handlePdfExport = useCallback(async () => {
    if (!blog?._id) return message.error("Blog ID missing")
    if (!editorContent?.trim()) return message.error("No content to export")

    try {
      message.loading({ content: "Generating PDF...", key: "pdf-export" })

      // Use the API function which uses axiosInstance with correct backend URL
      const pdfBlob = await exportBlogAsPdf(blog._id, {
        title: blog.title,
        content: editorContent,
      })

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${blog.title || "blog"}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      message.success({ content: "PDF downloaded successfully!", key: "pdf-export" })
    } catch (error) {
      console.error("PDF Export Error:", error)
      message.error({ content: error.message || "Failed to export PDF", key: "pdf-export" })
    }
  }, [blog, editorContent])

  const handleKeywordRewrite = useCallback(() => {
    handlePopup({
      title: "Rewrite Keywords",
      description: "Rewrite content with keywords? (3 times max)",
      onConfirm: handleSave,
    })
  }, [handlePopup, handleSave])

  const handlePostClick = useCallback(() => {
    // Block free users from posting
    if (userPlan === "free") {
      return handlePopup({
        title: "Posting Unavailable",
        description: "Free users cannot publish blogs. Upgrade to unlock automated posting.",
        confirmText: "Upgrade Now",
        onConfirm: () => navigate("/pricing"),
      })
    }

    if (unsavedChanges) {
      handlePopup({
        title: "Unsaved Changes",
        description: "Save before posting?",
        confirmText: "Save & Post",
        cancelText: "Post Anyway",
        onConfirm: async () => {
          await handleSubmit({ metadata })
          setIsCategoryModalOpen(true)
        },
        onCancel: e => e?.source === "button" && setIsCategoryModalOpen(true),
      })
    } else {
      setIsCategoryModalOpen(true)
    }
  }, [unsavedChanges, handlePopup, handleSubmit, metadata, userPlan, navigate])

  const handleCategorySubmit = useCallback(
    ({ category, includeTableOfContents, type }) => {
      onPost({ ...formData, categories: category, includeTableOfContents, type })
    },
    [formData, onPost]
  )

  const addRegenKeyword = type => {
    const input = type === "focus" ? focusKeywordInput : keywordInput
    const field = type === "focus" ? "focusKeywords" : "keywords"
    if (!input.trim()) return
    const existing = regenForm[field].map(k => k.toLowerCase())
    const newKws = input
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(k => k && !existing.includes(k))
    if (type === "focus" && regenForm.focusKeywords.length + newKws.length > 3) {
      return message.warning("Max 3 focus keywords")
    }
    if (newKws.length > 0) updateRegenField(field, [...regenForm[field], ...newKws])
    type === "focus" ? setFocusKeywordInput("") : setKeywordInput("")
  }

  const removeRegenKeyword = (type, index) => {
    const field = type === "focus" ? "focusKeywords" : "keywords"
    updateRegenField(
      field,
      regenForm[field].filter((_, i) => i !== index)
    )
  }

  const addKeyword = useCallback(() => {
    if (newKeyword.trim()) {
      const newKws = newKeyword
        .split(",")
        .map(k => k.trim().toLowerCase())
        .filter(k => k && !keywords.map(kw => kw.toLowerCase()).includes(k))
      if (newKws.length > 0) setKeywords(prev => [...prev, ...newKws])
      setNewKeyword("")
    }
  }, [newKeyword, keywords, setKeywords])

  const removeKeyword = useCallback(
    keyword => {
      setKeywords(prev => prev.filter(k => k !== keyword))
    },
    [setKeywords]
  )

  const seoScore = result?.insights?.blogScore || blog?.seoScore || 0
  const contentScore = blog?.blogScore || 0

  // ========== PANELS ==========

  const renderOverviewPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">Analysis</h3>
                {isPro && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-bold">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Real-time Statistics
              </p>
            </div>
          </div>
          {setIsSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-md transition-all">
            <div className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
              {getWordCount(editorContent)}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Word Count
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-md transition-all">
            <div className="text-2xl font-black text-gray-900 group-hover:text-purple-600 transition-colors">
              {keywords?.length || 0}
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Keywords
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="space-y-3">
          <ScoreCard title="Quality Score" score={contentScore} icon={FileText} />
          <ScoreCard title="SEO Potential" score={seoScore} icon={TrendingUp} />
        </div>

        {/* Optimization Card */}
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h4 className="text-sm font-bold text-gray-900">Boost SEO Score</h4>
          </div>
          <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">
            Run our advanced competitive analysis to uncover keyword opportunities and improve
            rankings.
          </p>
          <button
            onClick={handleAnalyzing}
            disabled={isAnalyzingCompetitive}
            className={`
              w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm
              ${
                isAnalyzingCompetitive
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg active:scale-[0.98]"
              }
            `}
          >
            {isAnalyzingCompetitive ? "Analyzing Content..." : "Run Analysis (10 Credits)"}
          </button>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-white border-t border-gray-50">
        <Button
          type="primary"
          size="large"
          block
          onClick={handlePostClick}
          loading={isPosting}
          disabled={isDisabled || userPlan === "free"}
          className={`h-14 font-bold rounded-2xl border-none shadow-xl transition-all active:scale-[0.98] ${
            userPlan === "free"
              ? "!bg-gray-200 !text-gray-400"
              : "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-green-100"
          }`}
        >
          {userPlan === "free" ? (
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> <span>Upgrade to Publish</span>
            </div>
          ) : isPosting ? (
            "Publishing..."
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" />
              <span>
                {posted && Object.keys(posted).length > 0 ? "Update Post" : "Publish to Web"}
              </span>
            </div>
          )}
        </Button>
      </div>
    </div>
  )

  // Export handlers
  const handleExportMarkdown = () => {
    if (userPlan === "free") {
      return handlePopup({
        title: "Export Unavailable",
        description: "Free users cannot export blogs. Upgrade to unlock this feature.",
        confirmText: "Upgrade Now",
        onConfirm: () => navigate("/pricing"),
      })
    }

    const markdown = editorContent || ""
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${blog?.title || "blog"}.md`
    a.click()
    URL.revokeObjectURL(url)
    message.success("Exported as Markdown!")
  }

  const handleExportHTML = () => {
    if (userPlan === "free") {
      return handlePopup({
        title: "Export Unavailable",
        description: "Free users cannot export blogs. Upgrade to unlock this feature.",
        confirmText: "Upgrade Now",
        onConfirm: () => navigate("/pricing"),
      })
    }

    const htmlContent = blog?.content || editorContent || ""
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blog?.title || "Blog"}</title>
  <meta name="description" content="${metadata.description || ""}">
</head>
<body>
  <article>
    <h1>${blog?.title || ""}</h1>
    ${htmlContent}
  </article>
</body>
</html>`
    const blob = new Blob([fullHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${blog?.title || "blog"}.html`
    a.click()
    URL.revokeObjectURL(url)
    message.success("Exported as HTML!")
  }

  const renderSeoPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">SEO & Export</h3>
                {isPro && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    <Crown className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Metadata, analysis & export options
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* SEO Metadata Section */}
        <div className="space-y-3 p-3 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              SEO Metadata
            </span>
            <button
              onClick={handleMetadataGen}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Generate
            </button>
          </div>
          <div className="space-y-3">
            <Input
              value={metadata.title}
              onChange={e => setMetadata(p => ({ ...p, title: e.target.value }))}
              placeholder="Meta title..."
              size="small"
            />
            <TextArea
              value={metadata.description}
              onChange={e => setMetadata(p => ({ ...p, description: e.target.value }))}
              placeholder="Meta description..."
              rows={4}
              className="!resize-none"
            />
          </div>
          <button
            onClick={handleMetadataSave}
            className="w-full py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow hover:shadow-md"
          >
            Save Metadata
          </button>
        </div>

        {/* Export Section */}
        <div className="space-y-3 p-3 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-900">Export Blog</span>
            {userPlan === "free" && (
              <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" /> Pro
              </span>
            )}
          </div>

          <div
            className="
    grid gap-3
    grid-cols-1
    sm:grid-cols-2
    lg:grid-cols-3
  "
          >
            {/* Markdown */}
            <button
              onClick={handleExportMarkdown}
              disabled={userPlan === "free"}
              className={`
      group flex flex-col items-center justify-center gap-2
      py-4 px-3
      rounded-xl text-sm font-semibold
      border-2 transition-all duration-300
      ${
        userPlan === "free"
          ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
          : `
            bg-gradient-to-br from-blue-50 to-indigo-50
            hover:from-blue-100 hover:to-indigo-100
            text-blue-700 border-blue-200
            hover:border-blue-300 hover:shadow-lg
            active:scale-[0.98] sm:hover:scale-105
          `
      }
    `}
            >
              <FileText
                className={`
        w-6 h-6
        ${userPlan !== "free" && "sm:group-hover:scale-110 transition-transform"}
      `}
              />
              <span>Markdown</span>
            </button>

            {/* HTML */}
            <button
              onClick={handleExportHTML}
              disabled={userPlan === "free"}
              className={`
      group flex flex-col items-center justify-center gap-2
      py-4 px-3
      rounded-xl text-sm font-semibold
      border-2 transition-all duration-300
      ${
        userPlan === "free"
          ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
          : `
            bg-gradient-to-br from-purple-50 to-pink-50
            hover:from-purple-100 hover:to-pink-100
            text-purple-700 border-purple-200
            hover:border-purple-300 hover:shadow-lg
            active:scale-[0.98] sm:hover:scale-105
          `
      }
    `}
            >
              <FileCode
                className={`
        w-6 h-6
        ${userPlan !== "free" && "sm:group-hover:scale-110 transition-transform"}
      `}
              />
              <span>HTML</span>
            </button>

            {/* PDF */}
            <button
              onClick={handlePdfExport}
              disabled={userPlan === "free"}
              className={`
      group flex flex-col items-center justify-center gap-2
      py-4 px-3
      rounded-xl text-sm font-semibold
      border-2 transition-all duration-300
      ${
        userPlan === "free"
          ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
          : `
            bg-gradient-to-br from-green-50 to-emerald-50
            hover:from-green-100 hover:to-emerald-100
            text-green-700 border-green-200
            hover:border-green-300 hover:shadow-lg
            active:scale-[0.98] sm:hover:scale-105
          `
      }
    `}
            >
              <Download
                className={`
        w-6 h-6
        ${userPlan !== "free" && "sm:group-hover:scale-110 transition-transform"}
      `}
              />
              <span>PDF</span>
            </button>
          </div>

          {userPlan === "free" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 text-center font-medium">
                🔒 Upgrade to export your blogs in multiple formats
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSuggestionsPanel = () => {
    // Handle applying a single suggestion
    const handleApplySuggestion = (index, suggestion) => {
      if (handleReplace && suggestion) {
        // handleReplace in MainEditorPage already removes the suggestion from the list
        handleReplace(suggestion.original, suggestion.change)
        message.success("Change applied successfully!")
      }
    }

    // Handle rejecting a suggestion
    const handleRejectSuggestion = index => {
      setProofreadingResults(prev => prev.filter((_, i) => i !== index))
    }

    // Handle applying all suggestions
    const handleApplyAll = () => {
      if (proofreadingResults?.length > 0) {
        proofreadingResults.forEach(s => handleReplace(s.original, s.change))
        setProofreadingResults([])
        message.success(`Applied ${proofreadingResults.length} changes!`)
      }
    }

    // Add original index to each suggestion for tracking
    const suggestionsWithIndex =
      proofreadingResults?.map((s, i) => ({
        ...s,
        originalIndex: i,
      })) || []

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">AI Proofreading</h3>
                  {isPro && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      <Crown className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Grammar & style suggestions</p>
              </div>
            </div>
            {proofreadingResults?.length > 0 && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full">
                {proofreadingResults.length}
              </span>
            )}
          </div>

          {proofreadingResults?.length > 0 && (
            <button
              onClick={handleApplyAll}
              className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Apply All {proofreadingResults.length} Changes
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {isAnalyzingProofreading ? (
            <div className="text-center py-16">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Analyzing your content...</p>
              <p className="text-xs text-gray-500">This may take a moment</p>
            </div>
          ) : suggestionsWithIndex.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {suggestionsWithIndex.map((suggestion, i) => (
                <ProofreadingSuggestion
                  key={`${suggestion.original}-${i}`}
                  suggestion={suggestion}
                  index={suggestion.originalIndex}
                  onApply={handleApplySuggestion}
                  onReject={handleRejectSuggestion}
                />
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-16 h-[80vh] flex flex-col items-center justify-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Lightbulb className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-700 mb-1">No suggestions yet</h4>
              <p className="text-xs text-gray-500 mb-4 max-w-[200px] mx-auto">
                Run AI proofreading to get grammar and style suggestions
              </p>
              <button
                onClick={handleProofreading}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all text-sm"
              >
                Run AI Proofreading
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderBlogInfoPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Blog Information</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Metadata and settings used for this blog
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scroll">
        {/* Template & Category */}
        <div className="space-y-3">
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Template</div>
            <div className="font-semibold text-gray-900">{blog?.template || "N/A"}</div>
          </div>
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Category</div>
            <div className="font-semibold text-gray-900">{blog?.category || "N/A"}</div>
          </div>
        </div>

        {/* Tags */}
        {blog?.tags && blog.tags.length > 0 && (
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {blog.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {blog?.keywords && blog.keywords.length > 0 && (
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Keywords</div>
            <div className="flex flex-wrap gap-1.5">
              {blog.keywords.map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Focus Keywords */}
        {blog?.focusKeywords && blog.focusKeywords.length > 0 && (
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Focus Keywords</div>
            <div className="flex flex-wrap gap-1.5">
              {blog.focusKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tone & Word Count */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Tone</div>
            <div className="font-semibold text-gray-900">{blog?.tone || "N/A"}</div>
          </div>
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Target Length</div>
            <div className="font-semibold text-gray-900">{blog?.userDefinedLength || 0} words</div>
          </div>
        </div>

        {/* AI Model & Image Source */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">AI Model</div>
            <div className="font-semibold text-gray-900 capitalize">{blog?.aiModel || "N/A"}</div>
          </div>
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Image Source</div>
            <div className="font-semibold text-gray-900 capitalize">
              {blog?.imageSource || "none"}
            </div>
          </div>
        </div>

        {/* Options/Features */}
        {blog?.options && (
          <div className="p-3 bg-white border rounded-lg">
            <div className="text-xs text-gray-500 mb-2">Features Enabled</div>
            <div className="space-y-1.5">
              {Object.entries(blog.options).map(
                ([key, value]) =>
                  value && (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </div>
                  )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderPanel = () => {
    switch (activePanel) {
      case "overview":
        return renderOverviewPanel()
      case "seo":
        return renderSeoPanel()
      case "bloginfo":
        return renderBlogInfoPanel()
      default:
        return renderOverviewPanel()
    }
  }

  // Collapsed state - show only icon bar
  if (isCollapsed) {
    return (
      <div className="w-16 h-screen bg-gradient-to-b from-slate-50 to-gray-100 border-l border-gray-200 flex flex-col items-center gap-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <Tooltip key={item.id} title={item.label} placement="left">
              <button
                onClick={() => {
                  if (item.id === "regenerate") {
                    // Open the 2-step modal for regenerate
                    setRegenerateStep(1)
                    setIsRegenerateModalOpen(true)
                    setIsCollapsed(false)
                  } else {
                    setActivePanel(item.id)
                    setIsCollapsed(false)
                  }
                }}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all duration-200 relative group"
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              </button>
            </Tooltip>
          )
        })}
        <div className="mt-auto flex flex-col gap-2">
          {/* Divider */}
          <div className="w-8 h-px bg-gray-300 my-2" />

          <Tooltip title="Expand Sidebar" placement="left">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all duration-200 group"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
          </Tooltip>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex h-full">
        {/* Content Panel */}
        <div className="flex-1 w-80 bg-white border-l overflow-hidden flex flex-col">
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
        <div className="w-16 bg-gradient-to-b from-slate-50 to-gray-100 border-l border-gray-200 flex flex-col items-center py-5 gap-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activePanel === item.id
            return (
              <Tooltip key={item.id} title={item.label} placement="left">
                <button
                  onClick={() => {
                    if (item.id === "regenerate") {
                      // Open the 2-step modal for regenerate
                      setRegenerateStep(1)
                      setIsRegenerateModalOpen(true)
                    } else {
                      setActivePanel(item.id)
                    }
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative group ${
                    isActive
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200"
                      : "text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-md"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? "" : "group-hover:scale-110"
                    }`}
                  />
                </button>
              </Tooltip>
            )
          })}

          <div className="mt-auto flex flex-col gap-2">
            {/* Divider */}
            <div className="w-8 h-px bg-gray-300 my-2" />
            {/* Collapse Button */}
            <div className="hidden md:block">
              <Tooltip title="Collapse Sidebar" placement="left">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="w-11 h-11 rounded-2xl items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white hover:shadow-md transition-all duration-200 group flex"
                >
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Tooltip>
            </div>
            {/* Mobile close */}
            <div className="md:hidden">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CategoriesModal
        isCategoryModalOpen={isCategoryModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        onSubmit={handleCategorySubmit}
        initialCategory={formData.category}
        initialIncludeTableOfContents={formData.includeTableOfContents}
        integrations={integrations}
        blogData={blog}
        posted={posted}
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>Published Platforms</span>
          </div>
        }
        open={choosePlatformOpen}
        onCancel={() => setChoosePlatformOpen(false)}
        footer={null}
        centered
        width={320}
      >
        <div className="space-y-2">
          {postedLinks.map(({ platform, link, label }) => (
            <button
              key={platform}
              onClick={() => window.open(link, "_blank")}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
            >
              {label} <ExternalLink className="w-4 h-4" />
            </button>
          ))}
        </div>
      </Modal>

      {/* Generated Metadata Accept/Reject Modal */}
      <Modal
        title="Generated SEO Metadata"
        open={generatedMetadataModal}
        onCancel={handleRejectMetadata}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleRejectMetadata}>Reject</Button>
            <Button
              type="primary"
              onClick={handleAcceptMetadata}
              className="bg-gradient-to-r from-green-500 to-emerald-600 border-0"
            >
              Accept & Apply
            </Button>
          </div>
        }
        centered
        width={500}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Review the AI-generated metadata below. Accept to apply these changes or reject to keep
            your current data.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Generated Title</label>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-800">
                {generatedMetadata?.title || generatedMetadata?.metaTitle || "No title generated"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Generated Description
            </label>
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
                <span className="font-medium">Title:</span> {metadata.title || "Not set"}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">Description:</span>{" "}
                {metadata.description || "Not set"}
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* 2-Step Regenerate Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <span>Regenerate Blog - Step {regenerateStep} of 2</span>
          </div>
        }
        open={isRegenerateModalOpen}
        onCancel={() => {
          setIsRegenerateModalOpen(false)
          setRegenerateStep(1)
        }}
        footer={
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-600">Estimated Cost:</span>
                <span className="font-bold text-blue-600">{calculateRegenCost()} credits</span>
              </div>
            </div>
            <div className="flex gap-2">
              {regenerateStep === 2 && <Button onClick={() => setRegenerateStep(1)}>Back</Button>}
              {regenerateStep === 1 ? (
                <Button
                  type="primary"
                  onClick={() => setRegenerateStep(2)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 border-0"
                >
                  Next: Enhancement Options
                </Button>
              ) : (
                <Button
                  type="primary"
                  loading={isRegenerating}
                  onClick={handleRegenerateSubmit}
                  icon={<RefreshCw className="w-4 h-4" />}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 border-0"
                >
                  Regenerate Blog
                </Button>
              )}
            </div>
          </div>
        }
        centered
        width={600}
      >
        {regenerateStep === 1 ? (
          // Step 1: Regenerate Blog Settings
          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scroll pr-2">
            <p className="text-sm text-gray-500 mb-4">
              Configure your blog regeneration settings. You can modify the topic, keywords, tone,
              and other options.
            </p>

            {/* Topic & Title */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Topic</label>
                <Input
                  value={regenForm.topic}
                  onChange={e => updateRegenField("topic", e.target.value)}
                  placeholder="Blog topic..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Title</label>
                <Input
                  value={regenForm.title}
                  onChange={e => updateRegenField("title", e.target.value)}
                  placeholder="Blog title..."
                />
              </div>
            </div>

            {/* Focus Keywords */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Focus Keywords (max 3)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={focusKeywordInput}
                  onChange={e => setFocusKeywordInput(e.target.value)}
                  onKeyDown={e =>
                    e.key === "Enter" && (e.preventDefault(), addRegenKeyword("focus"))
                  }
                  placeholder="Add keyword..."
                  size="small"
                  className="h-8"
                />

                <Button
                  type="primary"
                  onClick={() => addRegenKeyword("focus")}
                  icon={<Plus className="w-4 h-4" />}
                  className="h-8 flex items-center justify-center"
                />
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {regenForm.focusKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
                  >
                    {kw}{" "}
                    <button onClick={() => removeRegenKeyword("focus", i)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Secondary Keywords */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Keywords</label>

              <div className="flex items-center gap-2">
                <Input
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e =>
                    e.key === "Enter" && (e.preventDefault(), addRegenKeyword("secondary"))
                  }
                  placeholder="Add keywords..."
                  size="small"
                  className="h-8"
                />

                <Button
                  type="primary"
                  onClick={() => addRegenKeyword("secondary")}
                  icon={<Plus className="w-4 h-4" />}
                  className="h-8 flex items-center justify-center"
                />
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {regenForm.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                  >
                    {kw}
                    <button onClick={() => removeRegenKeyword("secondary", i)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tone & Length */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Tone</label>
                <Select
                  value={regenForm.tone}
                  onChange={val => updateRegenField("tone", val)}
                  options={TONES.map(t => ({ label: t, value: t }))}
                  className="w-full"
                  size="small"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Word Count</label>
                <Select
                  value={regenForm.userDefinedLength}
                  onChange={val => updateRegenField("userDefinedLength", val)}
                  options={[
                    { label: "500 words", value: 500 },
                    { label: "1,000 words", value: 1000 },
                    { label: "1,500 words", value: 1500 },
                    { label: "2,000 words", value: 2000 },
                    { label: "2,500 words", value: 2500 },
                    { label: "3,000 words", value: 3000 },
                    { label: "3,500 words", value: 3500 },
                    { label: "4,000 words", value: 4000 },
                    { label: "4,500 words", value: 4500 },
                    { label: "5,000 words", value: 5000 },
                  ]}
                  className="w-full"
                  size="small"
                />
              </div>
            </div>

            {/* AI Model */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">AI Model</label>
              <div className="grid grid-cols-3 gap-2">
                {AI_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (model.restrictedPlans.includes(userPlan)) {
                        openUpgradePopup({ featureName: model.label, navigate })
                      } else {
                        updateRegenField("aiModel", model.id)
                      }
                    }}
                    className={`p-2 rounded-lg border text-center text-xs transition-all ${
                      regenForm.aiModel === model.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${model.restrictedPlans.includes(userPlan) ? "opacity-50" : ""}`}
                  >
                    <img src={model.logo} alt={model.label} className="w-5 h-5 mx-auto mb-1" />
                    {model.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Images Section */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium">Add Images</span>
                <Switch
                  size="small"
                  checked={regenForm.isCheckedGeneratedImages}
                  onChange={val => updateRegenField("isCheckedGeneratedImages", val)}
                />
              </div>

              {regenForm.isCheckedGeneratedImages && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-medium text-gray-500 block">Image Source</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateRegenField("imageSource", IMAGE_SOURCE.STOCK)}
                      className={`p-2 rounded-lg border text-center text-xs transition-all ${
                        regenForm.imageSource === IMAGE_SOURCE.STOCK
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="font-medium">Stock Images</div>
                    </button>
                    <button
                      onClick={() => updateRegenField("imageSource", IMAGE_SOURCE.AI)}
                      className={`p-2 rounded-lg border text-center text-xs transition-all ${
                        regenForm.imageSource === IMAGE_SOURCE.AI
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="font-medium">AI Generated</div>
                    </button>
                  </div>

                  <div className="pt-1">
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                      Number of Images: {regenForm.numberOfImages || 3}
                    </label>
                    <InputNumber
                      size="small"
                      min={1}
                      max={10}
                      value={regenForm.numberOfImages || 3}
                      onChange={val => updateRegenField("numberOfImages", val)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Brand Voice */}
            <BrandVoiceSelector
              label="Brand Voice"
              labelClass="text-xs font-medium text-gray-700"
              value={{
                isCheckedBrand: regenForm.useBrandVoice,
                brandId: regenForm.brandId,
                addCTA: regenForm.addCTA,
              }}
              onChange={val => {
                updateRegenField("useBrandVoice", val.isCheckedBrand)
                updateRegenField("brandId", val.brandId)
                updateRegenField("addCTA", val.addCTA)
              }}
            />
          </div>
        ) : (
          // Step 2: Content Enhancement Options
          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scroll pr-2">
            <p className="text-sm text-gray-500 mb-4">
              Select the content enhancement options you want to include in your regenerated blog.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      regenForm.options.includeFaqs ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-700">Include FAQs</span>
                </div>
                <Switch
                  size="small"
                  checked={regenForm.options.includeFaqs}
                  onChange={val => updateRegenField("options.includeFaqs", val)}
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      regenForm.options.includeInterlinks ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-700">Include Interlinks</span>
                </div>
                <Switch
                  size="small"
                  checked={regenForm.options.includeInterlinks}
                  onChange={val => updateRegenField("options.includeInterlinks", val)}
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      regenForm.options.includeCompetitorResearch ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Competitor Research</span>
                    <span className="ml-2 text-xs text-amber-600 font-semibold">+10 credits</span>
                  </div>
                </div>
                <Switch
                  size="small"
                  checked={regenForm.options.includeCompetitorResearch}
                  onChange={val => updateRegenField("options.includeCompetitorResearch", val)}
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      regenForm.options.addOutBoundLinks ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-700">Add Outbound Links</span>
                </div>
                <Switch
                  size="small"
                  checked={regenForm.options.addOutBoundLinks}
                  onChange={val => updateRegenField("options.addOutBoundLinks", val)}
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Enhancement Summary</p>
                  <p className="text-xs text-blue-700 mt-1">
                    These options will enhance your blog content with additional features like FAQs,
                    internal links, competitor insights, and external references.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default TextEditorSidebar
