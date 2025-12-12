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
import { updateBlog, retryBlogById } from "@api/blogApi"
import { useQueryClient } from "@tanstack/react-query"
import BrandVoiceSelector from "@components/multipleStepModal/BrandVoiceSelector"
import {
  ScoreCard,
  CompetitorsList,
  AnalysisInsights,
  ProofreadingSuggestion,
} from "./FeatureComponents"
import FeatureSettingsModal from "./FeatureSettingsModal"

const { TextArea } = Input
const { Panel } = Collapse

// AI Models config
const AI_MODELS = [
  { id: "gemini", label: "Gemini", logo: "/Images/gemini.png", restrictedPlans: [] },
  { id: "chatgpt", label: "ChatGPT", logo: "/Images/chatgpt.png", restrictedPlans: ["free"] },
  { id: "claude", label: "Claude", logo: "/Images/claude.png", restrictedPlans: ["free", "basic"] },
]

// Sidebar navigation items
const NAV_ITEMS = [
  { id: "overview", icon: BarChart3, label: "Overview" },
  { id: "analysis", icon: TrendingUp, label: "Analysis" },
  { id: "suggestions", icon: Lightbulb, label: "Suggestions" },
  { id: "enhancement", icon: SlidersHorizontal, label: "Enhancement" },
  { id: "regenerate", icon: RefreshCw, label: "Regenerate" },
]

const TextEditorSidebar = ({
  blog,
  keywords,
  setKeywords,
  onPost,
  activeTab,
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
  const [isAnalyzingProofreading, setIsAnalyzingProofreading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [keywordInput, setKeywordInput] = useState("")
  const [focusKeywordInput, setFocusKeywordInput] = useState("")

  const { data: integrations } = useSelector(state => state.wordpress)
  const [metadata, setMetadata] = useState({
    title: blog?.seoMetadata?.title || "",
    description: blog?.seoMetadata?.description || "",
  })

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
    imageSource: "unsplash",
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
        imageSource: blog.imageSource || "unsplash",
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

  const getWordCount = text =>
    text
      ? text
          .trim()
          .split(/\s+/)
          .filter(word => word.length > 0).length
      : 0

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

  // Calculate regenerate cost
  const calculateRegenCost = useCallback(() => {
    let cost = getEstimatedCost("blog.single", regenForm.aiModel)
    if (regenForm.isCheckedGeneratedImages) {
      cost +=
        regenForm.imageSource === "ai"
          ? creditCostsWithGemini.aiImages * (regenForm.numberOfImages || 3)
          : 10
    }
    if (regenForm.options.includeCompetitorResearch) cost += 10
    if (regenForm.useBrandVoice) cost += 10
    return cost
  }, [regenForm])

  // Handlers
  const handleRegenerate = async () => {
    if (!blog?._id) return message.error("Blog ID missing")
    const cost = calculateRegenCost()
    const credits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

    if (credits < cost) {
      return handlePopup({
        title: "Insufficient Credits",
        description: `Need ${cost} credits, have ${credits}.`,
        confirmText: "Buy Credits",
        onConfirm: () => navigate("/pricing"),
      })
    }

    handlePopup({
      title: "Regenerate Blog",
      description: (
        <>
          Regenerate with new settings? <span className="font-bold">Cost: {cost} credits</span>
        </>
      ),
      confirmText: "Regenerate",
      onConfirm: async () => {
        setIsRegenerating(true)
        try {
          await updateBlog(blog._id, { ...regenForm, isCheckedBrand: regenForm.useBrandVoice })
          await retryBlogById(blog._id, { createNew: true })
          queryClient.invalidateQueries({ queryKey: ["blogs"] })
          message.success("Blog regeneration started!")
          navigate("/blogs")
        } catch (error) {
          message.error(error.message || "Failed to regenerate")
        } finally {
          setIsRegenerating(false)
        }
      },
    })
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
          setActivePanel("analysis")
          message.success("Analysis complete!")
        } catch {
          message.error("Analysis failed")
        }
      },
    })
  }, [isPro, navigate, handlePopup, dispatch, blog, keywords])

  const handleProofreading = useCallback(() => {
    if (isPro) return navigate("/pricing")
    handlePopup({
      title: "AI Proofreading",
      description: (
        <>
          Check grammar & style?{" "}
          <span className="font-bold">{getEstimatedCost("blog.proofread")} credits</span>
        </>
      ),
      onConfirm: async () => {
        setIsAnalyzingProofreading(true)
        try {
          const result = await dispatch(fetchProofreadingSuggestions({ id: blog._id })).unwrap()
          setProofreadingResults(result)
          setActivePanel("suggestions")
          message.success(`Found ${result.length} suggestions`)
        } catch {
          message.error("Proofreading failed")
        } finally {
          setIsAnalyzingProofreading(false)
        }
      },
    })
  }, [isPro, navigate, handlePopup, dispatch, blog, setProofreadingResults])

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
        try {
          await dispatch(
            generateMetadataThunk({
              content: editorContent,
              keywords: keywords || [],
              focusKeywords: blog?.focusKeywords || [],
            })
          ).unwrap()
          message.success("Metadata generated!")
        } catch {
          message.error("Generation failed")
        }
      },
    })
  }, [isPro, navigate, handlePopup, dispatch, editorContent, keywords, blog])

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

  const handleKeywordRewrite = useCallback(() => {
    handlePopup({
      title: "Rewrite Keywords",
      description: "Rewrite content with keywords? (3 times max)",
      onConfirm: handleSave,
    })
  }, [handlePopup, handleSave])

  const handlePostClick = useCallback(() => {
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
  }, [unsavedChanges, handlePopup, handleSubmit, metadata])

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
      <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Overview</h3>
                {isPro && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    <Crown className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Summary of your content’s SEO performance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-600">{getWordCount(editorContent)}</div>
            <div className="text-xs text-blue-600/70">Words</div>
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600">{keywords?.length || 0}</div>
            <div className="text-xs text-purple-600/70">Keywords</div>
          </div>
        </div>

        {/* Scores */}
        <div className="space-y-3">
          <ScoreCard title="Content Score" score={contentScore} icon={FileText} />
          <ScoreCard title="SEO Score" score={seoScore} icon={TrendingUp} />
        </div>

        {/* Keywords */}
        {/* <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">Keywords</span>
            </div>
            {keywords?.length > 0 && (
              <button
                onClick={handleKeywordRewrite}
                className="text-xs text-green-600 flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3 h-3" /> Optimize
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords?.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                {kw}
                <button onClick={() => removeKeyword(kw)} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addKeyword()}
              placeholder="Add keyword..."
              size="small"
            />
            <Button
              size="small"
              type="primary"
              onClick={addKeyword}
              icon={<Plus className="w-3 h-3" />}
            />
          </div>
        </div> */}

        {/* Quick Actions */}
        <div className="space-y-4">
          <span className="text-sm font-semibold text-gray-900">Quick Actions</span>

          {/* SEO Analysis Card */}
          <div className="p-3 border rounded-xl shadow-sm bg-white hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-semibold text-gray-800">Competitive Analysis</h4>
            </div>

            {/* Gradient Button */}
            <button
              onClick={handleAnalyzing}
              disabled={isAnalyzingCompetitive}
              className={`
        w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all
        ${
          isAnalyzingCompetitive
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:from-purple-600 hover:via-indigo-600 hover:to-blue-700"
        }
      `}
            >
              {isAnalyzingCompetitive ? "Analyzing..." : "Run SEO Analysis"}
            </button>
          </div>

          {/* Proofreading Card */}
          <div className="p-3 border rounded-xl shadow-sm bg-white hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-green-600" />
              <h4 className="text-sm font-semibold text-gray-800">AI Proofreading</h4>

              {!isPro && proofreadingResults?.length > 0 && (
                <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {proofreadingResults.length}
                </span>
              )}
            </div>

            {/* Gradient Button */}
            <button
              onClick={handleProofreading}
              disabled={isAnalyzingProofreading}
              className={`
        w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all
        ${
          isAnalyzingProofreading
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:from-purple-600 hover:via-indigo-600 hover:to-blue-700"
        }
      `}
            >
              {isAnalyzingProofreading ? "Checking..." : "Start Proofreading"}
            </button>
          </div>
        </div>

        {/* SEO Metadata Card */}
        <div className="space-y-4 p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          {/* Header */}
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

          {/* Inputs */}
          <div className="space-y-3">
            <Input
              value={metadata.title}
              onChange={e => setMetadata(p => ({ ...p, title: e.target.value }))}
              placeholder="Meta title..."
              size="small"
              className="rounded-md"
            />

            <TextArea
              value={metadata.description}
              onChange={e => setMetadata(p => ({ ...p, description: e.target.value }))}
              placeholder="Meta description..."
              rows={6}
              className="!resize-none rounded-md"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleMetadataSave}
            className="
      w-full py-2 text-sm font-semibold rounded-lg
      bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600
      text-white shadow hover:shadow-md hover:opacity-90 transition-all
    "
          >
            Save Metadata
          </button>
        </div>

        {/* Custom AI Prompt Card */}
        <div className="space-y-4 p-3 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-900">Custom AI Prompt</span>
          </div>

          {/* Text Area */}
          <TextArea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="e.g., Make the tone more professional..."
            rows={6}
            className="!resize-none rounded-md"
          />

          {/* Apply Prompt */}
          <button
            onClick={handleCustomPromptBlog}
            disabled={isHumanizing}
            className={`
      w-full py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2
      bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600
      text-white shadow hover:shadow-md hover:opacity-90 transition-all
      ${isHumanizing ? "opacity-60 cursor-not-allowed" : ""}
    `}
          >
            <Sparkles className="w-4 h-4" />
            {isHumanizing ? "Applying..." : "Apply Prompt"}
          </button>
        </div>

        {/* Posted Links */}
        {postedLinks.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Published</span>
            {postedLinks.map(({ platform, link, label }) => (
              <a
                key={platform}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 text-sm"
              >
                <span className="text-green-700">{label}</span>
                <ExternalLink className="w-4 h-4 text-green-600" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Floating Post Button */}
      <div className="p-3 border-t bg-white">
        <Button
          type="primary"
          size="large"
          block
          onClick={handlePostClick}
          loading={isPosting}
          disabled={isDisabled}
          className="h-12 font-semibold bg-gradient-to-r from-green-500 to-emerald-600 border-0 hover:shadow-lg"
        >
          {isPosting
            ? "Posting..."
            : posted && Object.keys(posted).length > 0
            ? "Re-Post Blog"
            : "Post Blog"}
        </Button>
      </div>
    </div>
  )

  const renderAnalysisPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">SEO Analysis</h3>
                {isPro && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    <Crown className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Keyword, optimization & ranking insights
              </p>
            </div>
          </div>
        </div>
      </div>

      {result || blog?.generatedMetadata?.competitors ? (
        <Collapse defaultActiveKey={["1"]} ghost expandIconPosition="end">
          {(result?.competitors || blog?.generatedMetadata?.competitors)?.length > 0 && (
            <Panel
              header={
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Top Competitors</span>
                </div>
              }
              key="1"
            >
              <CompetitorsList
                competitors={result?.competitors || blog?.generatedMetadata?.competitors}
              />
            </Panel>
          )}
          {(result?.insights?.analysis || result?.analysis) && (
            <Panel
              header={
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">Key Insights</span>
                </div>
              }
              key="2"
            >
              <AnalysisInsights insights={result?.insights?.analysis || result?.analysis} />
            </Panel>
          )}
        </Collapse>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center h-[80vh]">
          <TrendingUp className="w-12 h-12 text-gray-300 mb-3" />

          <p className="text-sm text-gray-500 mb-4">No analysis yet</p>

          <button
            onClick={handleAnalyzing}
            disabled={isAnalyzingCompetitive}
            className={`
      px-6 py-2.5 rounded-lg text-sm font-semibold transition-all
      bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow
      hover:shadow-md hover:opacity-90
      ${isAnalyzingCompetitive ? "opacity-60 cursor-not-allowed" : ""}
    `}
          >
            {isAnalyzingCompetitive ? "Analyzing..." : "Run SEO Analysis"}
          </button>
        </div>
      )}
    </div>
  )

  const renderSuggestionsPanel = () => {
    // Handle applying a single suggestion
    const handleApplySuggestion = (index, suggestion) => {
      if (handleReplace && suggestion) {
        handleReplace(suggestion.original, suggestion.change)
        setProofreadingResults(prev => prev.filter((_, i) => i !== index))
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

  const renderEnhancementPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-blue-50 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </div>

            <div>
              <div className="flex items-center  gap-2">
                <h3 className="font-semibold text-gray-900">Content Enhancement</h3>
                {isPro && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    <Crown className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Tools that polish and optimize your blog content
              </p>
            </div>
          </div>
        </div>
      </div>

      <FeatureSettingsModal features={blog?.options || {}} />
    </div>
  )

  const renderRegeneratePanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-blue-50 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <RefreshCcw className="w-4 h-4 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Regenerate Blog</h3>
                {isPro && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    <Crown className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Generate fresh versions of your blog content
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Topic & Title */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Topic</label>
            <Input
              value={regenForm.topic}
              onChange={e => updateRegenField("topic", e.target.value)}
              placeholder="Blog topic..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
            <Input
              value={regenForm.title}
              onChange={e => updateRegenField("title", e.target.value)}
              placeholder="Blog title..."
            />
          </div>
        </div>

        {/* Focus Keywords */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Focus Keywords (max 3)
          </label>
          <div className="flex gap-2">
            <Input
              value={focusKeywordInput}
              onChange={e => setFocusKeywordInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addRegenKeyword("focus"))}
              placeholder="Add keyword..."
              size="small"
            />
            <Button
              size="small"
              type="primary"
              onClick={() => addRegenKeyword("focus")}
              icon={<Plus className="w-3 h-3" />}
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
          <label className="text-xs font-medium text-gray-500 mb-1 block">Secondary Keywords</label>
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e =>
                e.key === "Enter" && (e.preventDefault(), addRegenKeyword("secondary"))
              }
              placeholder="Add keywords..."
              size="small"
            />
            <Button
              size="small"
              type="primary"
              onClick={() => addRegenKeyword("secondary")}
              icon={<Plus className="w-3 h-3" />}
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {regenForm.keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                {kw}{" "}
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
            <label className="text-xs font-medium text-gray-500 mb-1 block">Tone</label>
            <Select
              value={regenForm.tone}
              onChange={val => updateRegenField("tone", val)}
              options={TONES.map(t => ({ label: t, value: t }))}
              className="w-full"
              size="small"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Length: {regenForm.userDefinedLength}
            </label>
            <Slider
              value={regenForm.userDefinedLength}
              onChange={val => updateRegenField("userDefinedLength", val)}
              min={500}
              max={5000}
              step={100}
            />
          </div>
        </div>

        {/* AI Model */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">AI Model</label>
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

        {/* Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Add Images</span>
            <Switch
              size="small"
              checked={regenForm.isCheckedGeneratedImages}
              onChange={val => updateRegenField("isCheckedGeneratedImages", val)}
            />
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Include FAQs</span>
            <Switch
              size="small"
              checked={regenForm.options.includeFaqs}
              onChange={val => updateRegenField("options.includeFaqs", val)}
            />
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Interlinks</span>
            <Switch
              size="small"
              checked={regenForm.options.includeInterlinks}
              onChange={val => updateRegenField("options.includeInterlinks", val)}
            />
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Competitor Research (+10)</span>
            <Switch
              size="small"
              checked={regenForm.options.includeCompetitorResearch}
              onChange={val => updateRegenField("options.includeCompetitorResearch", val)}
            />
          </div>
        </div>

        {/* Brand Voice */}
        <BrandVoiceSelector
          label="Brand Voice"
          labelClass="text-xs font-medium text-gray-500"
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

      {/* Floating Regenerate Button */}
      <div className="p-3 border-t bg-white space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Estimated Cost</span>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-blue-600">{calculateRegenCost()} credits</span>
          </div>
        </div>
        <Button
          type="primary"
          block
          size="large"
          loading={isRegenerating}
          onClick={handleRegenerate}
          icon={<RefreshCw className="w-4 h-4" />}
          className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 border-0 font-semibold"
        >
          Regenerate Blog
        </Button>
      </div>
    </div>
  )

  const renderPanel = () => {
    switch (activePanel) {
      case "overview":
        return renderOverviewPanel()
      case "analysis":
        return renderAnalysisPanel()
      case "suggestions":
        return renderSuggestionsPanel()
      case "enhancement":
        return renderEnhancementPanel()
      case "regenerate":
        return renderRegeneratePanel()
      default:
        return renderOverviewPanel()
    }
  }

  // Collapsed state - show only icon bar
  if (isCollapsed) {
    return (
      <div className="w-16 bg-gradient-to-b from-slate-50 to-gray-100 border-l border-gray-200 flex flex-col items-center py-5 gap-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const hasBadge = item.id === "suggestions" && proofreadingResults?.length > 0
          return (
            <Tooltip key={item.id} title={item.label} placement="left">
              <button
                onClick={() => {
                  setActivePanel(item.id)
                  setIsCollapsed(false)
                }}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all duration-200 relative group"
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                {hasBadge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
                    {proofreadingResults.length}
                  </span>
                )}
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
            const hasBadge = item.id === "suggestions" && proofreadingResults?.length > 0
            return (
              <Tooltip key={item.id} title={item.label} placement="left">
                <button
                  onClick={() => setActivePanel(item.id)}
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
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
                      {proofreadingResults.length}
                    </span>
                  )}
                </button>
              </Tooltip>
            )
          })}

          <div className="mt-auto flex flex-col gap-2">
            {/* Divider */}
            <div className="w-8 h-px bg-gray-300 my-2" />

            {/* Collapse Button */}
            <Tooltip title="Collapse Sidebar" placement="left">
              <button
                onClick={() => setIsCollapsed(true)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white hover:shadow-md transition-all duration-200 group"
              >
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Tooltip>

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
        title="Choose Platform"
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
    </>
  )
}

export default TextEditorSidebar
