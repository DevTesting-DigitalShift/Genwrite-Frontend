import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Plus,
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  Target,
  Crown,
  SlidersHorizontal,
  Eye,
  BarChart3,
  FileText,
  Lightbulb,
  Minimize2,
  Maximize2,
  Download,
  Tag as TagIcon,
} from "lucide-react"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Button, Tooltip, message, Tabs, Badge, Collapse, Dropdown, Menu, Tag, Input } from "antd"
import { fetchProofreadingSuggestions, fetchBlogPrompt } from "@store/slices/blogSlice"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { getCategoriesThunk, generateMetadataThunk } from "@store/slices/otherSlice"
import CategoriesModal from "@components/CategoriesModal"
import Loading from "@components/Loading"
import { marked } from "marked"
import { CrownTwoTone, DownOutlined } from "@ant-design/icons"
import { Modal } from "antd"

const { Panel } = Collapse
const { TextArea } = Input

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
}) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [isAnalyzingProofreading, setIsAnalyzingProofreading] = useState(false)
  const [competitiveAnalysisResults, setCompetitiveAnalysisResults] = useState(null)
  const [shouldRunCompetitive, setShouldRunCompetitive] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")
  const [metadata, setMetadata] = useState({
    title: blog?.seoMetadata?.title || "",
    description: blog?.seoMetadata?.description || "",
  })
  const [metadataHistory, setMetadataHistory] = useState([])
  const [customPrompt, setCustomPrompt] = useState("")
  const user = useSelector((state) => state.auth.user)
  const userPlan = user?.subscription?.plan
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { handlePopup } = useConfirmPopup()
  const { loading: isAnalyzingCompetitive } = useSelector((state) => state.analysis)
  const { metadata: reduxMetadata } = useSelector((state) => state.wordpress)
  const [open, setOpen] = useState(false)
  const { analysisResult } = useSelector((state) => state.analysis)
  const blogId = blog?._id
  const result = analysisResult?.[blogId]

  // Reset metadata and history when blog changes
  useEffect(() => {
    setMetadata({
      title: blog?.seoMetadata?.title || "",
      description: blog?.seoMetadata?.description || "",
    })
    setMetadataHistory([])
  }, [blog?._id])

  // Configure marked for HTML output and token parsing
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: false,
    mangle: false,
  })

  const getWordCount = (text) => {
    return text
      ? text
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length
      : 0
  }

  useEffect(() => {
    dispatch(getCategoriesThunk()).unwrap()
  }, [dispatch])

  useEffect(() => {
    setCompetitiveAnalysisResults(null)
  }, [blog?._id])

  // Handle reduxMetadata updates
  useEffect(() => {
    if (reduxMetadata && (reduxMetadata.title || reduxMetadata.description)) {
      const newMeta = {
        id: Date.now().toString(),
        title: reduxMetadata.title || "",
        description: reduxMetadata.description || "",
      }
      setMetadataHistory((prev) => {
        const exists = prev.some(
          (item) => item.title === newMeta.title && item.description === newMeta.description
        )
        if (!exists && (newMeta.title || newMeta.description)) {
          return [...prev, newMeta]
        }
        return prev
      })
      // Only update metadata state if it differs from current state
      if (metadata.title !== newMeta.title || metadata.description !== newMeta.description) {
        setMetadata({
          title: newMeta.title,
          description: newMeta.description,
        })
      }
    }
  }, [reduxMetadata])

  const fetchCompetitiveAnalysis = useCallback(async () => {
    if (!blog || !blog.title || !blog.content) {
      message.error("Blog title or content is missing for analysis.")
      return
    }

    const validKeywords =
      keywords && keywords.length > 0 ? keywords : blog?.focusKeywords || blog.keywords

    try {
      const resultAction = await dispatch(
        fetchCompetitiveAnalysisThunk({
          blogId: blog._id,
          title: blog.title,
          content: blog.content,
          keywords: validKeywords,
        })
      ).unwrap()

      setCompetitiveAnalysisResults(resultAction)
      setActiveSection("analysis")
    } catch (err) {
      console.error("Failed to fetch competitive analysis:", {
        error: err.message,
        status: err.status,
        response: err.response,
      })
      message.error("Failed to perform competitive analysis.")
    }
  }, [blog, keywords, dispatch])

  useEffect(() => {
    if (shouldRunCompetitive) {
      fetchCompetitiveAnalysis()
      setShouldRunCompetitive(false)
    }
  }, [shouldRunCompetitive, fetchCompetitiveAnalysis])

  useEffect(() => {
    if (blog?.seoScore || blog?.generatedMetadata?.competitorsAnalysis) {
      setCompetitiveAnalysisResults({
        blogScore: blog.seoScore,
        ...blog?.generatedMetadata?.competitorsAnalysis,
      })
    }
  }, [blog])

  const removeKeyword = useCallback(
    (keyword) => {
      setKeywords((prev) => prev.filter((k) => k !== keyword))
    },
    [setKeywords]
  )

  const addKeywords = useCallback(() => {
    if (newKeyword.trim()) {
      const newKeywordsArray = newKeyword
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k && !keywords.map((kw) => kw.toLowerCase()).includes(k))

      if (newKeywordsArray.length > 0) {
        setKeywords((prev) => [...prev, ...newKeywordsArray])
      }
      setNewKeyword("")
    }
  }, [newKeyword, keywords, setKeywords])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addKeywords()
      }
    },
    [addKeywords]
  )

  const handleProofreadingClick = useCallback(async () => {
    if (!blog || !blog.content) {
      message.error("Blog content is required for proofreading.")
      return
    }

    if (isAnalyzingCompetitive) {
      message.error(
        "Please wait for Competitive Analysis to complete before starting Proofreading."
      )
      return
    }

    setIsAnalyzingProofreading(true)
    try {
      const result = await dispatch(
        fetchProofreadingSuggestions({
          id: blog._id,
        })
      ).unwrap()
      setProofreadingResults(result)
      setActiveSection("suggestions")
      message.success("Proofreading suggestions loaded successfully!")
    } catch (error) {
      console.error("Error fetching proofreading suggestions:", {
        error: error.message,
        status: error.status,
        response: error.response,
      })
      message.error("Failed to fetch proofreading suggestions.")
    } finally {
      setIsAnalyzingProofreading(false)
    }
  }, [blog, dispatch, isAnalyzingCompetitive, setProofreadingResults])

  const handleApplyAllSuggestions = useCallback(() => {
    if (proofreadingResults.length === 0) {
      message.info("No suggestions available to apply.")
      return
    }

    proofreadingResults.forEach((suggestion) => {
      handleReplace(suggestion.original, suggestion.change)
    })
    setProofreadingResults([])
    message.success("All proofreading suggestions applied successfully!")
  }, [proofreadingResults, handleReplace, setProofreadingResults])

  const handleMetadataGeneration = useCallback(async () => {
    if (!blog || !editorContent) {
      message.error("Blog content is required for metadata generation.")
      return
    }

    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      navigate("/pricing")
      return
    }

    const validKeywords =
      keywords && keywords.length > 0 ? keywords : blog?.focusKeywords || blog.keywords

    try {
      await dispatch(
        generateMetadataThunk({
          content: editorContent,
          keywords: validKeywords,
          focusKeywords: blog?.focusKeywords || [],
        })
      ).unwrap()
    } catch (error) {
      console.error("Error generating metadata:", error)
      message.error("Failed to generate metadata.")
    }
  }, [blog, editorContent, keywords, dispatch, navigate, userPlan])

  const handleMetadataSave = useCallback(async () => {
    if (!metadata.title && !metadata.description) {
      message.error("Please enter a meta title or description to save.")
      return
    }
    try {
      await handleSubmit({ metadata })
      const newMeta = {
        id: Date.now().toString(),
        title: metadata.title || "",
        description: metadata.description || "",
      }
      setMetadataHistory((prev) => {
        const exists = prev.some(
          (item) => item.title === newMeta.title && item.description === newMeta.description
        )
        if (!exists && (newMeta.title || newMeta.description)) {
          return [...prev, newMeta]
        }
        return prev
      })
    } catch (error) {
      console.error("Error saving metadata:", error)
      // message.error("Failed to save metadata.")
    }
  }, [handleSubmit, metadata])

  const handleAnalyzing = useCallback(() => {
    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      navigate("/pricing")
      return
    }

    const seoScore = blog?.seoScore
    const competitors = blog?.generatedMetadata?.competitors
    const hasScore = typeof seoScore === "number" && seoScore >= 0
    const hasCompetitors = Array.isArray(competitors) && competitors.length > 0
    const hasAnalysis = !!competitiveAnalysisResults

    if (!hasScore && !hasCompetitors && !hasAnalysis) {
      return handlePopup({
        title: "Competitive Analysis",
        description: "Do you really want to run competitive analysis? It will cost 10 credits.",
        confirmText: "Run",
        cancelText: "Cancel",
        onConfirm: () => fetchCompetitiveAnalysis(),
      })
    }

    return handlePopup({
      title: "Run Competitive Analysis Again?",
      description: (
        <>
          You have already performed a competitive analysis for this blog. Would you like to run it
          again? <span className="font-bold">This will cost 10 credits.</span>
        </>
      ),
      confirmText: "Run",
      cancelText: "Cancel",
      onConfirm: () => fetchCompetitiveAnalysis(),
    })
  }, [userPlan, blog, handlePopup, navigate, competitiveAnalysisResults, fetchCompetitiveAnalysis])

  const handleProofreadingBlog = useCallback(() => {
    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      navigate("/pricing")
    } else {
      handlePopup({
        title: "AI Proofreading",
        description: (
          <>
            Do you really want to proofread the blog?{" "}
            <span className="font-bold">
              {" "}
              This will cost {getEstimatedCost("blog.proofread")} credits.
            </span>
          </>
        ),
        onConfirm: handleProofreadingClick,
      })
    }
  }, [userPlan, handlePopup, navigate, handleProofreadingClick])

  const handleCustomPromptBlog = useCallback(async () => {
    if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
      navigate("/pricing")
      return
    }

    if (!blog || !editorContent) {
      message.error("Blog content is required for prompt-based modification.")
      return
    }

    handlePopup({
      title: "Apply Custom Prompt",
      description: (
        <>
          Do you want to modify the blog content using the prompt?{" "}
          <span className="font-bold">This will cost 5 credits.</span>
        </>
      ),
      confirmText: "Apply Prompt",
      cancelText: "Cancel",
      onConfirm: async () => {
        setIsHumanizing(true)
        try {
          const result = await dispatch(
            fetchBlogPrompt({
              id: blog._id,
              prompt: customPrompt,
            })
          ).unwrap()
          setHumanizedContent(result.data)
          setIsHumanizeModalOpen(true)
          message.success("Content modified with custom prompt successfully!")
          setCustomPrompt("") // ✅ only clear after success
        } catch (error) {
          console.error("Error applying custom prompt:", error)
          message.error("Failed to apply custom prompt.")
        } finally {
          setIsHumanizing(false)
        }
      },
    })
  }, [
    blog,
    editorContent,
    customPrompt,
    dispatch,
    handlePopup,
    setHumanizedContent,
    setIsHumanizing,
    setIsHumanizeModalOpen,
    userPlan,
    navigate,
  ])

  const handleKeywordRewrite = useCallback(() => {
    handlePopup({
      title: "Rewrite Keywords",
      description:
        "Do you want to rewrite the entire content with added keywords? You can rewrite only 3 times.",
      onConfirm: handleSave,
    })
  }, [handlePopup, handleSave])

  const handleExport = useCallback(
    async (type) => {
      if (!editorContent) {
        message.error("No content to export.")
        return
      }
      const title = blog?.title || "Untitled Blog"
      if (type === "markdown") {
        const blob = new Blob([editorContent], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${title}.md`
        a.click()
        URL.revokeObjectURL(url)
        message.success("Markdown exported successfully!")
      } else if (type === "html") {
        const htmlContent = marked.parse(editorContent, { gfm: true })
        const blob = new Blob([htmlContent], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${title}.html`
        a.click()
        URL.revokeObjectURL(url)
        message.success("HTML exported successfully!")
      }
    },
    [editorContent, blog]
  )

  const exportMenu = (
    <Menu>
      <Menu.Item key="markdown" onClick={() => handleExport("markdown")}>
        Export as Markdown
      </Menu.Item>
      <Menu.Item key="html" onClick={() => handleExport("html")}>
        Export as HTML
      </Menu.Item>
    </Menu>
  )

  const getScoreColor = useCallback((score) => {
    if (score >= 80) return "bg-green-100 text-green-700 border-green-200"
    if (score >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200"
    return "bg-red-100 text-red-700 border-red-200"
  }, [])

  const handleCategorySubmit = useCallback(
    ({ category, includeTableOfContents }) => {
      try {
        onPost({ ...formData, categories: category, includeTableOfContents })
      } catch (error) {
        console.error("Failed to post blog:", {
          error: error.message,
          status: error.status,
          response: error.response,
        })
        message.error("Failed to post blog. Please try again.")
      }
    },
    [formData, onPost]
  )

  const handlePostClick = useCallback(() => {
    setIsCategoryModalOpen(true)
  }, [])

  if (isAnalyzingCompetitive) {
    return (
      <div className="flex items-center">
        <Loading message="Running Competitive Analysis" />
      </div>
    )
  }

  const FeatureCard = ({
    title,
    description,
    isPro,
    isLoading,
    onClick,
    buttonText,
    icon: Icon,
    children, // Added to support additional content like TextArea
  }) => (
    <motion.div
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className="bg-white rounded-lg shadow-sm border hover:shadow-xl border-gray-200 p-4"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {isPro && <CrownTwoTone className="text-2xl ml-auto mr-2" />}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      {children}
      <Button
        onClick={onClick}
        loading={isLoading}
        disabled={isLoading}
        type="primary"
        className="w-full py-2 text-sm px-4 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
        ghost={isPro}
      >
        {isLoading ? "Processing..." : buttonText}
      </Button>
    </motion.div>
  )

  const ScoreCard = ({ title, score, icon: Icon }) => (
    <div className={`p-3 rounded-lg border ${getScoreColor(score || 0)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {score > 0 && (
          <span className="text-lg font-bold">
            {score}
            <span className="text-xs ml-1">/100</span>
          </span>
        )}
      </div>
      {(score || 0) === 0 ? (
        <p className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded-lg">
          Run Competitive Analysis to get score
        </p>
      ) : (
        <div className="w-full bg-white/50 rounded-full h-2">
          <div
            style={{ width: `${score}%`, transition: "width 0.5s ease" }}
            className={`h-2 rounded-full ${
              score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
            }`}
          />
        </div>
      )}
    </div>
  )

  const CompetitorsList = ({ competitors }) => {
    const [showAll, setShowAll] = useState(false)
    const visibleCompetitors = showAll ? competitors : competitors?.slice(0, 5)

    return (
      <div className="space-y-2 relative">
        {competitors?.length > 5 && (
          <span className="absolute top-0 right-0 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
            {competitors.length}
          </span>
        )}

        {visibleCompetitors?.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1 text-gray-900 truncate">{item.title}</p>
              <a
                href={item.link || item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {item.score && <Tag color="blue">{(item.score * 100).toFixed(2)}%</Tag>}
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        ))}

        {competitors?.length > 5 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-blue-600 hover:text-blue-700 text-center w-full"
          >
            +{competitors.length - 5} more competitors
          </button>
        )}
      </div>
    )
  }

  const AnalysisInsights = ({ insights }) => {
    const [showAll, setShowAll] = useState(false)
    const [expandedIndexes, setExpandedIndexes] = useState(new Set())

    const entries = Object.entries(insights || {})
    const visibleEntries = showAll ? entries : entries.slice(0, 3)

    const toggleExpanded = (index) => {
      const updated = new Set(expandedIndexes)
      updated.has(index) ? updated.delete(index) : updated.add(index)
      setExpandedIndexes(updated)
    }

    return (
      <div className="space-y-3">
        {visibleEntries.map(([key, value], index) => {
          const isExpanded = expandedIndexes.has(index)
          const text = typeof value === "object" ? "Multiple insights available" : value?.toString()
          const shouldTruncate = text?.length > 120 && !isExpanded
          const displayText = shouldTruncate ? text.slice(0, 120) + "..." : text
          const match = value.match(/\((\d+\/\d+)\)$/)
          const score = match ? match[1] : null

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-blue-50 rounded-lg border border-blue-100"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium text-blue-900 text-sm mb-1">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p>{score && <Tag color="blue">{score.replace("/", " / ")}</Tag>}</p>
                  </div>
                  <p
                    className="text-xs text-blue-700 leading-relaxed cursor-pointer select-none"
                    onClick={() => toggleExpanded(index)}
                  >
                    {displayText}
                    {shouldTruncate && <span className="text-blue-500 ml-1">(more)</span>}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}

        {entries.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-600 hover:text-blue-700 text-center w-full"
          >
            {showAll ? "Show less" : `+${entries.length - 5} more insights`}
          </button>
        )}
      </div>
    )
  }

  const ProofreadingSuggestion = ({ suggestion, index, onApply }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow"
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-gray-700">Original</span>
          </div>
          <div className="p-2 bg-red-50 border border-red-100 rounded text-xs text-gray-700 leading-relaxed">
            {suggestion.original}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-gray-700">Suggested</span>
          </div>
          <div className="p-2 bg-green-50 border border-red-100 rounded text-xs text-gray-700 leading-relaxed">
            {suggestion.change}
          </div>
        </div>
        <Button
          size="small"
          type="primary"
          ghost
          onClick={() => {
            handleReplace(suggestion.original, suggestion.change)
            onApply(index)
          }}
          className="w-full"
        >
          Apply This Change
        </Button>
      </div>
    </motion.div>
  )

  if (isMinimized) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: "calc(100% - 60px)" }}
        className="fixed top-[17.5rem] right-0 transform -translate-y-1/2 z-50"
      >
        <Tooltip title="Maximize Sidebar" placement="left">
          <Button
            onClick={() => setIsMinimized(false)}
            className="h-12 rounded-lg"
            icon={<Maximize2 className="w-4 h-4" />}
          />
        </Tooltip>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-96 bg-white shadow-xl flex flex-col"
      >
        <div className="p-4 border border-l-0 bg-gradient-to-r rounded-tr-md from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold">Content Analysis</h2>
              <p className="text-xs text-gray-600">Optimize your content performance</p>
            </div>
            <div className="flex items-center gap-2">
              {!["free", "basic"].includes(userPlan?.toLowerCase?.()) && (
                <Tooltip title="Export Content" placement="left">
                  <Dropdown overlay={exportMenu} trigger={["click"]}>
                    <Button size="small" icon={<Download className="w-4 h-4" />} />
                  </Dropdown>
                </Tooltip>
              )}
              <Tooltip title="Minimize sidebar" placement="left">
                <Button
                  size="small"
                  icon={<Minimize2 className="w-4 h-4" />}
                  onClick={() => setIsMinimized(true)}
                />
              </Tooltip>
              <Tooltip title="Content settings">
                <Button
                  size="small"
                  icon={<SlidersHorizontal className="w-4 h-4" />}
                  onClick={() => setOpen(true)}
                />
              </Tooltip>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 px-2">
            {[
              { key: "overview", label: "Overview", icon: BarChart3 },
              { key: "analysis", label: "Analysis", icon: TrendingUp },
              {
                key: "suggestions",
                label: "Suggestions",
                icon: Lightbulb,
                badge: proofreadingResults.length,
              },
            ].map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
        ${
          activeSection === key
            ? "bg-blue-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {badge > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 max-h-screen overflow-y-auto custom-scroll border-r">
          <AnimatePresence mode="wait">
            {activeSection === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        Keywords
                      </h3>
                    </div>
                    {keywords.length > 0 && (
                      <button
                        type="text"
                        onClick={() => {
                          if (["free"].includes(userPlan?.toLowerCase?.())) {
                            openUpgradePopup({ featureName: "Keyword Optimization", navigate })
                          } else {
                            handleKeywordRewrite()
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-opacity-80 transition-colors text-sm font-medium
                    bg-green-50 text-green-600 border-green-300 border hover:bg-green-100"
                      >
                        {["free"].includes(userPlan?.toLowerCase?.()) ? (
                          <Crown className="w-3 h-3" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Optimize
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {keywords.map((keyword, index) => (
                        <motion.div
                          key={`${keyword}-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-200"
                        >
                          <span className="truncate max-w-[120px]">{keyword}</span>
                          <button
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add keywords..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      size="small"
                      type="primary"
                      onClick={addKeywords}
                      icon={<Plus className="w-4 h-4" />}
                    />
                  </div>
                  {keywords.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">No keywords added yet</p>
                  )}
                </div>

                <div className="space-y-7">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      Performance Metrics
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {getWordCount(editorContent)}
                      </div>
                      <div className="text-xs text-blue-600">Words</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-purple-600">{keywords?.length}</div>
                      <div className="text-xs text-purple-600">Keywords</div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <ScoreCard title="Content Score" score={blog?.blogScore} icon={FileText} />
                    <ScoreCard
                      title="SEO Score"
                      score={result?.insights?.blogScore || blog?.seoScore}
                      icon={TrendingUp}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      AI Tools
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <FeatureCard
                      title="Competitive Analysis"
                      description="Compare with top competitors"
                      isPro={["free", "basic"].includes(userPlan?.toLowerCase?.())}
                      isLoading={isAnalyzingCompetitive}
                      onClick={handleAnalyzing}
                      buttonText="Run Analysis"
                      icon={TrendingUp}
                    />
                    {activeTab === "Normal" && (
                      <FeatureCard
                        title="AI Proofreading"
                        description="Grammar and style improvements"
                        isPro={["free", "basic"].includes(userPlan?.toLowerCase?.())}
                        isLoading={isAnalyzingProofreading}
                        onClick={handleProofreadingBlog}
                        buttonText="Proofread Content"
                        icon={FileText}
                      />
                    )}
                    <FeatureCard
                      title="Generate Metadata"
                      description="Create SEO-friendly title and description"
                      isPro={["free", "basic"].includes(userPlan?.toLowerCase?.())}
                      isLoading={false}
                      onClick={() => {
                        handlePopup({
                          title: "Generate Metadata",
                          description: (
                            <>
                              Generate SEO metadata?
                              <span className="font-bold"> This will cost 2 credits.</span>
                            </>
                          ),
                          confirmText: "Generate",
                          cancelText: "Cancel",
                          onConfirm: handleMetadataGeneration,
                        })
                      }}
                      buttonText="Generate Metadata"
                      icon={TagIcon}
                    />
                    <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                      {metadataHistory.length > 0 && (
                        <Dropdown
                          overlay={
                            <Menu
                              onClick={({ key }) => {
                                if (key.startsWith("delete-")) {
                                  const idToDelete = key.replace("delete-", "")
                                  setMetadataHistory((prev) =>
                                    prev.filter((item) => item.id !== idToDelete)
                                  )
                                  // Only clear metadata if the deleted item was the current one
                                  if (
                                    metadataHistory.find((item) => item.id === idToDelete)
                                      ?.title === metadata.title &&
                                    metadataHistory.find((item) => item.id === idToDelete)
                                      ?.description === metadata.description
                                  ) {
                                    setMetadata({ title: "", description: "" })
                                  }
                                } else {
                                  const selected = metadataHistory.find((item) => item.id === key)
                                  if (selected) {
                                    setMetadata({
                                      title: selected.title,
                                      description: selected.description,
                                    })
                                  }
                                }
                              }}
                            >
                              {metadataHistory.map((item, index) => (
                                <Menu.Item key={item.id}>
                                  <div className="flex justify-between items-center">
                                    <span>Version {index + 1}</span>
                                    <Button
                                      type="link"
                                      danger
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const idToDelete = item.id
                                        setMetadataHistory((prev) =>
                                          prev.filter((m) => m.id !== idToDelete)
                                        )
                                        // Only clear metadata if the deleted item was the current one
                                        if (
                                          item.title === metadata.title &&
                                          item.description === metadata.description
                                        ) {
                                          setMetadata({ title: "", description: "" })
                                        }
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </Menu.Item>
                              ))}
                            </Menu>
                          }
                          trigger={["click"]}
                        >
                          <Button className="w-full mb-2">
                            Select Previous Metadata <DownOutlined />
                          </Button>
                        </Dropdown>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Meta Title
                        </label>
                        <Input
                          value={metadata.title || blog?.seoMetadata?.title || ""}
                          onChange={(e) =>
                            setMetadata((prev) => ({ ...prev, title: e.target.value }))
                          }
                          placeholder="Enter meta title"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Meta Description
                        </label>
                        <TextArea
                          value={metadata.description || blog?.seoMetadata?.description || ""}
                          onChange={(e) =>
                            setMetadata((prev) => ({ ...prev, description: e.target.value }))
                          }
                          placeholder="Enter meta description"
                          rows={4}
                          className="mt-1 !resize-none"
                        />
                      </div>
                      <Button
                        type="primary"
                        onClick={handleMetadataSave}
                        className="w-full py-2 text-sm px-4 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                      >
                        Save Metadata
                      </Button>
                    </div>

                    <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-1">
                            <h3 className="font-semibold text-gray-900">Custom Prompt</h3>
                            {["free", "basic"].includes(userPlan?.toLowerCase?.()) && (
                              <CrownTwoTone className="text-2xl ml-auto mr-2" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Modify content with a custom AI prompt
                          </p>
                        </div>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Prompt
                      </label>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => {
                          console.log("Typing:", e.target.value)
                          setCustomPrompt(e.target.value)
                        }}
                        placeholder="e.g., 'Make the tone more professional' or 'Shorten the content'"
                        rows={6}
                        aria-label="Custom prompt for AI content modification"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all !resize-none"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Enter a prompt to customize the blog content.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleCustomPromptBlog}
                    loading={isHumanizing}
                    type="primary"
                    className="w-full py-2 text-sm px-4 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                    ghost={["free", "basic"].includes(userPlan?.toLowerCase?.())}
                  >
                    {isHumanizing ? "Processing..." : "Apply Custom Prompt"}
                  </Button>
                </div>
              </motion.div>
            )}

            {activeSection === "analysis" && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 sp ace-y-4"
              >
                {competitiveAnalysisResults || result ? (
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

                    {(competitiveAnalysisResults?.insights?.analysis ||
                      competitiveAnalysisResults?.analysis) && (
                      <Panel
                        header={
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">Key Insights</span>
                          </div>
                        }
                        key="2"
                      >
                        <AnalysisInsights
                          insights={
                            competitiveAnalysisResults?.insights?.analysis ||
                            competitiveAnalysisResults?.analysis
                          }
                        />
                      </Panel>
                    )}
                  </Collapse>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">No analysis results yet</p>
                    <p className="text-xs text-gray-500">
                      Run competitive analysis to see insights
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === "suggestions" && (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-4"
              >
                {isAnalyzingProofreading ? (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"
                    />
                    <p className="text-sm text-gray-600">Analyzing content...</p>
                  </div>
                ) : proofreadingResults.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-orange-500" />
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          Suggestions
                        </h3>
                        <Badge count={proofreadingResults.length} />
                      </div>
                      <Button
                        size="small"
                        type="primary"
                        onClick={handleApplyAllSuggestions}
                        disabled={proofreadingResults.length === 0}
                        className="text-xs"
                      >
                        Apply All
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-screen overflow-y-auto">
                      {proofreadingResults.map((suggestion, index) => (
                        <ProofreadingSuggestion
                          key={index}
                          suggestion={suggestion}
                          index={index}
                          onApply={(suggestionIndex) => {
                            const newResults = proofreadingResults.filter(
                              (_, i) => i !== suggestionIndex
                            )
                            setProofreadingResults(newResults)
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">No suggestions available</p>
                    <p className="text-xs text-gray-500">Run AI proofreading to get suggestions</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border border-l-0 rounded-br-md border-gray-200 bg-gray-50">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="primary"
              size="large"
              onClick={handlePostClick}
              loading={isPosting}
              disabled={isPosting}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 border-0 hover:shadow-lg"
            >
              {isPosting ? "Posting..." : blog?.wordpress ? "Re-Post" : "Post Blog"}
            </Button>
          </motion.div>

          {posted?.link && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 text-center"
            >
              <a
                href={posted.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 text-sm hover:text-blue-700 font-medium"
              >
                View Published Post
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          )}
        </div>
      </motion.div>

      <Modal
        title="Content Enhancement Summary"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
        width={480}
      >
        <FeatureSettingsModal features={blog?.options || {}} />
      </Modal>

      <CategoriesModal
        isCategoryModalOpen={isCategoryModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        onSubmit={handleCategorySubmit}
        initialCategory={formData.category}
        initialIncludeTableOfContents={formData.includeTableOfContents}
      />
    </>
  )
}

const FeatureSettingsModal = ({ features }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <div className="text-sm text-gray-600 mb-4">
        Here are the content enhancement features currently applied to your blog:
      </div>

      <div className="grid grid-cols-1 gap-3">
        {Object.entries(features || {}).length > 0 ? (
          Object.entries(features).map(([key, value]) => {
            const isEnabled = Boolean(value)
            return (
              <motion.div
                key={key}
                whileHover={{ backgroundColor: "#f8fafc" }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${isEnabled ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {isEnabled ? "Enabled" : "Disabled"}
                </span>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-6">
            <SlidersHorizontal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No enhancement features configured</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default TextEditorSidebar
