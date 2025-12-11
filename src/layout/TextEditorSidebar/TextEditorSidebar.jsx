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
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <h3 className="font-semibold text-gray-900">Overview</h3>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-600">{getWordCount(editorContent)}</div>
            <div className="text-xs text-blue-600/70">Words</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl text-center">
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
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Quick Actions</span>
          <button
            onClick={handleAnalyzing}
            disabled={isAnalyzingCompetitive}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left text-sm disabled:opacity-50"
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>{isAnalyzingCompetitive ? "Analyzing..." : "Run SEO Analysis"}</span>
            {isPro && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Pro
              </span>
            )}
          </button>
          <button
            onClick={handleProofreading}
            disabled={isAnalyzingProofreading}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left text-sm disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-green-600" />
            <span>{isAnalyzingProofreading ? "Checking..." : "AI Proofreading"}</span>
            {proofreadingResults?.length > 0 && (
              <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {proofreadingResults.length}
              </span>
            )}
          </button>
        </div>

        {/* Metadata */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">SEO Metadata</span>
            <button
              onClick={handleMetadataGen}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Generate
            </button>
          </div>
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
            rows={2}
            className="!resize-none"
          />
          <Button block size="small" onClick={handleMetadataSave}>
            Save Metadata
          </Button>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Custom AI Prompt</span>
          </div>
          <TextArea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="e.g., Make it more professional..."
            rows={3}
            className="!resize-none"
          />
          <Button
            type="primary"
            block
            size="small"
            loading={isHumanizing}
            onClick={handleCustomPromptBlog}
            icon={<Sparkles className="w-3 h-3" />}
          >
            Apply Prompt
          </Button>
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
      <div className="p-4 border-t bg-white">
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
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <h3 className="font-semibold text-gray-900">SEO Analysis</h3>

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
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-2">No analysis yet</p>
          <Button type="primary" onClick={handleAnalyzing} loading={isAnalyzingCompetitive}>
            Run SEO Analysis
          </Button>
        </div>
      )}
    </div>
  )

  const renderSuggestionsPanel = () => (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Suggestions</h3>
        {proofreadingResults?.length > 0 && (
          <Button
            size="small"
            type="primary"
            onClick={() => {
              proofreadingResults.forEach(s => handleReplace(s.original, s.change))
              setProofreadingResults([])
              message.success("Applied!")
            }}
          >
            Apply All
          </Button>
        )}
      </div>

      {isAnalyzingProofreading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Analyzing...</p>
        </div>
      ) : proofreadingResults?.length > 0 ? (
        <div className="space-y-3">
          {proofreadingResults.map((s, i) => (
            <ProofreadingSuggestion
              key={i}
              suggestion={s}
              index={i}
              onApply={idx =>
                setProofreadingResults(proofreadingResults.filter((_, j) => j !== idx))
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-2">No suggestions yet</p>
          <Button type="primary" onClick={handleProofreading}>
            Run AI Proofreading
          </Button>
        </div>
      )}
    </div>
  )

  const renderEnhancementPanel = () => (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <h3 className="font-semibold text-gray-900">Content Enhancement</h3>
      <FeatureSettingsModal features={blog?.options || {}} />
    </div>
  )

  const renderRegeneratePanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Regenerate Blog</h3>

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
      <div className="p-4 border-t bg-white space-y-3">
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
      <div className="w-14 bg-white border-l flex flex-col items-center py-4 gap-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <Tooltip key={item.id} title={item.label} placement="left">
              <button
                onClick={() => {
                  setActivePanel(item.id)
                  setIsCollapsed(false)
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Icon className="w-5 h-5" />
              </button>
            </Tooltip>
          )
        })}
        <div className="mt-auto">
          <Tooltip title="Expand" placement="left">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
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

        {/* Icon Navigation Bar - Light Theme */}
        <div className="w-14 bg-gray-50 border-l flex flex-col items-center py-4 gap-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activePanel === item.id
            const hasBadge = item.id === "suggestions" && proofreadingResults?.length > 0
            return (
              <Tooltip key={item.id} title={item.label} placement="left">
                <button
                  onClick={() => setActivePanel(item.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-400 hover:text-blue-600 hover:bg-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {proofreadingResults.length}
                    </span>
                  )}
                </button>
              </Tooltip>
            )
          })}

          <div className="mt-auto flex flex-col gap-1">
            {/* Collapse Button */}
            <Tooltip title="Collapse" placement="left">
              <button
                onClick={() => setIsCollapsed(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </Tooltip>

            {/* Mobile close */}
            <div className="md:hidden">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white"
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
