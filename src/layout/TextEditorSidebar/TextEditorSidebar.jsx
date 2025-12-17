import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Plus,
  SlidersHorizontal,
  Download,
  Minimize2,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Target,
  FileText,
  Zap,
  TagIcon,
  Sparkles,
  Eye,
  Maximize2,
  ExternalLink,
  Globe,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ImageIcon,
  RefreshCw,
} from "lucide-react"
import {
  Button,
  Tooltip,
  message,
  Tabs,
  Badge,
  Collapse,
  Dropdown,
  Menu,
  Tag,
  Input,
  Spin,
} from "antd"
import { fetchProofreadingSuggestions, fetchBlogPrompt } from "@store/slices/blogSlice"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import { generateMetadataThunk, getIntegrationsThunk } from "@store/slices/otherSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { getEstimatedCost } from "@utils/getEstimatedCost"
import { marked } from "marked"
import { CrownTwoTone, DownOutlined } from "@ant-design/icons"
import { Modal } from "antd"
import LoadingScreen from "@components/UI/LoadingScreen"
import {
  FeatureCard,
  ScoreCard,
  StatCard,
  CompetitorsList,
  AnalysisInsights,
  ProofreadingSuggestion,
} from "./FeatureComponents"
import FeatureSettingsModal from "./FeatureSettingsModal"
import CategoriesModal from "../Editor/CategoriesModal"
import * as cheerio from "cheerio"
import { getBlogPostings, getExportedBlog } from "@api/blogApi"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

const { Panel } = Collapse
const { TextArea } = Input

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
  const [newKeyword, setNewKeyword] = useState("")
  const [isAnalyzingProofreading, setIsAnalyzingProofreading] = useState(false)
  const [competitiveAnalysisResults, setCompetitiveAnalysisResults] = useState(null)
  const [shouldRunCompetitive, setShouldRunCompetitive] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")
  const [choosePlatformOpen, setChoosePlatformOpen] = useState(false)
  const { data: integrations } = useSelector(state => state.wordpress)
  const [metadata, setMetadata] = useState({
    title: blog?.seoMetadata?.title || "",
    description: blog?.seoMetadata?.description || "",
  })
  const [metadataHistory, setMetadataHistory] = useState([])
  const [customPrompt, setCustomPrompt] = useState("")
  const user = useSelector(state => state.auth.user)
  const userPlan = user?.subscription?.plan
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { handlePopup } = useConfirmPopup()
  const { loading: isAnalyzingCompetitive } = useSelector(state => state.analysis)
  const { metadata: reduxMetadata } = useSelector(state => state.wordpress)
  const [open, setOpen] = useState(false)
  const { analysisResult } = useSelector(state => state.analysis)
  const blogId = blog?._id
  const result = analysisResult?.[blogId]
  const hasAnyIntegration =
    integrations && integrations.integrations && Object.keys(integrations.integrations).length > 0
  const isDisabled =
    isPosting ||
    !hasAnyIntegration || // Disable if no integration at all
    (formData.wordpressPostStatus && !integrations.integrations.WORDPRESS)

  // State for blog postings from API
  const [blogPostings, setBlogPostings] = useState([])
  const [isLoadingPostings, setIsLoadingPostings] = useState(false)

  // Platform configuration with icons and colors
  const PLATFORM_CONFIG = {
    WORDPRESS: {
      label: "WordPress",
      color: "#21759b",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    SHOPIFY: {
      label: "Shopify",
      color: "#96bf48",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    SERVERENDPOINT: {
      label: "Server",
      color: "#6366f1",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-200",
    },
    WIX: {
      label: "Wix",
      color: "#faad14",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
    },
  }

  // Image CDN status configuration
  const IMAGE_CDN_STATUS_CONFIG = {
    pending: { icon: Clock, color: "text-yellow-500", label: "Images Pending" },
    processing: { icon: RefreshCw, color: "text-blue-500", label: "Processing Images" },
    completed: { icon: CheckCircle, color: "text-green-500", label: "Images Ready" },
    failed: { icon: AlertCircle, color: "text-red-500", label: "Image Error" },
  }

  // Fetch blog postings from API
  useEffect(() => {
    const fetchPostings = async () => {
      if (!blog?._id) {
        setBlogPostings([])
        return
      }

      setIsLoadingPostings(true)
      try {
        const postings = await getBlogPostings(blog._id)
        setBlogPostings(postings)
      } catch (error) {
        console.error("Failed to fetch blog postings:", error)
        setBlogPostings([])
      } finally {
        setIsLoadingPostings(false)
      }
    }

    fetchPostings()
  }, [blog?._id, posted]) // Re-fetch when posted changes (after posting)

  // Derived list for display - combines API data with fallback to prop
  const postedLinks =
    blogPostings.length > 0
      ? blogPostings.map(posting => ({
          ...posting,
          platform: posting.integrationType,
          label: PLATFORM_CONFIG[posting.integrationType]?.label || posting.integrationType,
          config: PLATFORM_CONFIG[posting.integrationType] || PLATFORM_CONFIG.SERVERENDPOINT,
        }))
      : posted
      ? Object.entries(posted)
          .filter(([_, data]) => data?.link)
          .map(([platform, data]) => ({
            platform,
            link: data.link,
            label: PLATFORM_CONFIG[platform]?.label || platform,
            config: PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.SERVERENDPOINT,
            postedOn: data.postedOn,
          }))
      : []

  // Check if blog has been posted
  const hasPostings = postedLinks.length > 0

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

  const getWordCount = text => {
    return text
      ? text
          .trim()
          .split(/\s+/)
          .filter(word => word.length > 0).length
      : 0
  }

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
      setMetadataHistory(prev => {
        const exists = prev.some(
          item => item.title === newMeta.title && item.description === newMeta.description
        )
        if (!exists && (newMeta.title || newMeta.description)) {
          return [...prev, newMeta]
        }
        return prev
      })
      if (metadata.title !== newMeta.title || metadata.description !== newMeta.description) {
        setMetadata({
          title: newMeta.title,
          description: newMeta.description,
        })
      }
    }
  }, [reduxMetadata])

  useEffect(() => {
    dispatch(getIntegrationsThunk())
  }, [dispatch])

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
    keyword => {
      setKeywords(prev => prev.filter(k => k !== keyword))
    },
    [setKeywords]
  )

  const addKeywords = useCallback(() => {
    if (newKeyword.trim()) {
      const newKeywordsArray = newKeyword
        .split(",")
        .map(k => k.trim().toLowerCase())
        .filter(k => k && !keywords.map(kw => kw.toLowerCase()).includes(k))

      if (newKeywordsArray.length > 0) {
        setKeywords(prev => [...prev, ...newKeywordsArray])
      }
      setNewKeyword("")
    }
  }, [newKeyword, keywords, setKeywords])

  const handleKeyDown = useCallback(
    e => {
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

    proofreadingResults.forEach(suggestion => {
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
      setMetadataHistory(prev => {
        const exists = prev.some(
          item => item.title === newMeta.title && item.description === newMeta.description
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
          setCustomPrompt("")
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
    async type => {
      if (!editorContent) {
        message.error("No content to export.")
        return
      }
      const title = blog?.title || "Untitled Blog"
      let blob, filename
      if (type === "markdown") {
        blob = new Blob([editorContent], { type: "text/markdown" })
        filename = `${title}.md`
      } else if (type === "html") {
        const htmlContent = marked.parse(editorContent, { gfm: true })
        blob = new Blob([htmlContent], { type: "text/html" })
        filename = `${title}.html`
      } else if (type === "pdf") {
        const data = await getExportedBlog(blog._id)
        blob = data.pdfBlob
        filename = `${title}.pdf`
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      message.success(`${type.toUpperCase()} exported successfully!`)
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
      <Menu.Item key="pdf" onClick={() => handleExport("pdf")}>
        Export as PDF
      </Menu.Item>
    </Menu>
  )

  const handleCategorySubmit = useCallback(
    ({ category, includeTableOfContents, type }) => {
      try {
        onPost({ ...formData, categories: category, includeTableOfContents, type })
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
    if (unsavedChanges) {
      handlePopup({
        title: "Unsaved Changes",
        description: (
          <>
            You have unsaved changes in your blog content. Would you like to save these changes
            before posting? If you proceed without saving, your changes will be lost.
          </>
        ),
        confirmText: "Save and Proceed",
        cancelText: "Proceed without Saving",
        onConfirm: async () => {
          try {
            await handleSubmit({ metadata })
            setIsCategoryModalOpen(true)
          } catch (error) {
            console.error("Failed to save changes:", error)
            message.error("Failed to save changes. Please try again.")
          }
        },
        onCancel: e => {
          if (e?.source == "button") {
            setIsCategoryModalOpen(true)
          }
        },
      })
    } else {
      setIsCategoryModalOpen(true)
    }
  }, [unsavedChanges, handlePopup, handleSubmit])

  if (isAnalyzingCompetitive) {
    return (
      <div className="flex items-center">
        <LoadingScreen message="Running Competitive Analysis" />
      </div>
    )
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: "calc(100% - 60px)" }}
        className="fixed top-[14.7rem] right-0 transform -translate-y-1/2 z-50"
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

  function countWordsFromHTML(html) {
    const isHTML = html?.includes("<article")
    if (!isHTML) return getWordCount(html)

    const $ = cheerio.load(html)
    const fullText = $("body").text()
    const cleanedText = fullText.replace(/\s+/g, " ").trim()
    const words = cleanedText.split(" ")

    // Filter out any empty strings that might result from splitting
    const filteredWords = words.filter(word => word !== "")

    // Get the word count
    const wordCount = filteredWords.length

    // const lengthMatrix = {
    //   headings: ["h1", "h2", "h3", "h4"],
    //   paragraphs: ["p"],
    //   lists: ["ul", "ol"],
    // }
    return wordCount
  }

  return (
    <>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full md:w-96 bg-white shadow-xl flex flex-col"
      >
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
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
                <div className="hidden sm:inline">
                  <Tooltip title="Minimize sidebar" placement="left">
                    <Button
                      size="small"
                      icon={<Minimize2 className="w-4 h-4" />}
                      onClick={() => setIsMinimized(true)}
                    />
                  </Tooltip>
                </div>

                <Tooltip title="Content settings">
                  <Button
                    size="small"
                    icon={<SlidersHorizontal className="w-4 h-4" />}
                    onClick={() => setOpen(true)}
                  />
                </Tooltip>

                <div className="block md:hidden">
                  <Button
                    size="small"
                    icon={<X className="w-4 h-4" />}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 px-2">
              {[
                { key: "overview", label: "Overview", icon: BarChart3 },
                { key: "analysis", label: "Analysis", icon: TrendingUp },
                {
                  key: "suggestions",
                  label: "Suggestions",
                  icon: Lightbulb,
                },
              ].map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150 flex-shrink-0
        ${
          activeSection === key
            ? "bg-blue-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  {badge > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll border-r">
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
                          <CrownTwoTone className="w-3 h-3" />
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
                      onChange={e => setNewKeyword(e.target.value)}
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

                  <div className="space-y-3">
                    <ScoreCard title="Content Score" score={blog?.blogScore} icon={FileText} />
                    <ScoreCard
                      title="SEO Score"
                      score={result?.insights?.blogScore || blog?.seoScore}
                      icon={TrendingUp}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        title="Words"
                        value={countWordsFromHTML(editorContent) || blog?.userDefinedLength}
                        icon={FileText}
                      />

                      <StatCard title="Keywords" value={keywords?.length || 0} icon={Target} />
                    </div>
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
                    <FeatureCard
                      title="AI Proofreading"
                      description="Grammar and style improvements"
                      isPro={["free", "basic"].includes(userPlan?.toLowerCase?.())}
                      isLoading={isAnalyzingProofreading}
                      onClick={handleProofreadingBlog}
                      buttonText="Proofread Content"
                      icon={FileText}
                    />
                    <FeatureCard
                      title="Generate Metadata"
                      description="Create SEO-friendly title and description"
                      isPro={["free", "basic"].includes(userPlan?.toLowerCase?.())}
                      isLoading={false}
                      onClick={() => {
                        if (["free", "basic"].includes(userPlan?.toLowerCase?.())) {
                          navigate("/pricing")
                        } else {
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
                        }
                      }}
                      buttonText="Generate Metadata"
                      icon={TagIcon}
                    />
                    <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                      {metadataHistory.length > 0 && (
                        <Dropdown
                          menu={
                            <Menu
                              onClick={({ key }) => {
                                if (key.startsWith("delete-")) {
                                  const idToDelete = key.replace("delete-", "")
                                  setMetadataHistory(prev =>
                                    prev.filter(item => item.id !== idToDelete)
                                  )
                                  if (
                                    metadataHistory.find(item => item.id === idToDelete)?.title ===
                                      metadata.title &&
                                    metadataHistory.find(item => item.id === idToDelete)
                                      ?.description === metadata.description
                                  ) {
                                    setMetadata({ title: "", description: "" })
                                  }
                                } else {
                                  const selected = metadataHistory.find(item => item.id === key)
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
                                      onClick={e => {
                                        e.stopPropagation()
                                        const idToDelete = item.id
                                        setMetadataHistory(prev =>
                                          prev.filter(m => m.id !== idToDelete)
                                        )
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
                          onChange={e => setMetadata(prev => ({ ...prev, title: e.target.value }))}
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
                          onChange={e =>
                            setMetadata(prev => ({ ...prev, description: e.target.value }))
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
                        onChange={e => {
                          setCustomPrompt(e.target.value)
                        }}
                        placeholder="e.g., 'Make the tone more professional' or 'Shorten the content'"
                        rows={6}
                        aria-label="Custom prompt for AI content modification"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all !resize-none"
                      />
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
                className="p-4 space-y-4 h-screen"
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
                  <div className="text-center py-8 h-screen">
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
                          onApply={suggestionIndex => {
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
                  <div className="text-center py-8 h-screen">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">No suggestions available</p>
                    <p className="text-xs text-gray-500">Run AI proofreading to get suggestions</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 z-50 p-4 border-t border-gray-200 bg-gray-50">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="primary"
              size="large"
              onClick={handlePostClick}
              loading={isPosting}
              disabled={isDisabled}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 border-0 hover:shadow-lg"
            >
              {isPosting ? "Posting..." : hasPostings ? "Re-Post" : "Post Blog"}
            </Button>
          </motion.div>

          {/* Loading state for postings */}
          {isLoadingPostings && (
            <div className="mt-3 flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Spin size="small" />
              <span>Loading postings...</span>
            </div>
          )}

          {/* Posted Links Display - New Premium UI */}
          {!isLoadingPostings && postedLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Published ({postedLinks.length})
                  </span>
                </div>
                {postedLinks.length > 1 && (
                  <button
                    onClick={() => setChoosePlatformOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </button>
                )}
              </div>

              {/* Single posting - show inline card */}
              {postedLinks.length === 1 && (
                <div
                  className={`p-3 rounded-lg border ${
                    postedLinks[0].config?.borderColor || "border-gray-200"
                  } ${
                    postedLinks[0].config?.bgColor || "bg-gray-50"
                  } cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => window.open(postedLinks[0].link, "_blank")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          postedLinks[0].config?.bgColor || "bg-gray-100"
                        }`}
                      >
                        <Globe
                          className={`w-4 h-4 ${
                            postedLinks[0].config?.textColor || "text-gray-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            postedLinks[0].config?.textColor || "text-gray-700"
                          }`}
                        >
                          {postedLinks[0].label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {postedLinks[0].postedOn
                            ? dayjs(postedLinks[0].postedOn).fromNow()
                            : "Recently posted"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Image CDN Status Badge */}
                      {postedLinks[0].imageCdnStatus &&
                        IMAGE_CDN_STATUS_CONFIG[postedLinks[0].imageCdnStatus] && (
                          <Tooltip
                            title={IMAGE_CDN_STATUS_CONFIG[postedLinks[0].imageCdnStatus].label}
                          >
                            {(() => {
                              const StatusIcon =
                                IMAGE_CDN_STATUS_CONFIG[postedLinks[0].imageCdnStatus].icon
                              return (
                                <StatusIcon
                                  className={`w-4 h-4 ${
                                    IMAGE_CDN_STATUS_CONFIG[postedLinks[0].imageCdnStatus].color
                                  } ${
                                    postedLinks[0].imageCdnStatus === "processing"
                                      ? "animate-spin"
                                      : ""
                                  }`}
                                />
                              )
                            })()}
                          </Tooltip>
                        )}
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Multiple postings - show compact list */}
              {postedLinks.length > 1 && (
                <div className="space-y-2">
                  {postedLinks.slice(0, 2).map((posting, index) => (
                    <div
                      key={posting._id || posting.platform + index}
                      className={`p-2 rounded-lg border ${
                        posting.config?.borderColor || "border-gray-200"
                      } ${
                        posting.config?.bgColor || "bg-gray-50"
                      } cursor-pointer hover:shadow-sm transition-all`}
                      onClick={() => window.open(posting.link, "_blank")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe
                            className={`w-3.5 h-3.5 ${
                              posting.config?.textColor || "text-gray-600"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              posting.config?.textColor || "text-gray-700"
                            }`}
                          >
                            {posting.label}
                          </span>
                          {posting.postedOn && (
                            <span className="text-xs text-gray-400">
                              • {dayjs(posting.postedOn).fromNow()}
                            </span>
                          )}
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {postedLinks.length > 2 && (
                    <button
                      onClick={() => setChoosePlatformOpen(true)}
                      className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
                    >
                      +{postedLinks.length - 2} more platforms
                    </button>
                  )}
                </div>
              )}
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
        integrations={integrations}
        blogData={blog}
        posted={posted}
      />

      {/* Enhanced Platform Selection Modal */}
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
        width={440}
      >
        <div className="py-2">
          <p className="text-sm text-gray-600 mb-4">
            This blog has been published to {postedLinks.length} platform
            {postedLinks.length > 1 ? "s" : ""}.
          </p>

          <div className="space-y-3">
            {postedLinks.map((posting, index) => {
              const cdnStatus = posting.imageCdnStatus
                ? IMAGE_CDN_STATUS_CONFIG[posting.imageCdnStatus]
                : null
              const CdnIcon = cdnStatus?.icon

              return (
                <motion.div
                  key={posting._id || posting.platform + index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border-2 ${
                    posting.config?.borderColor || "border-gray-200"
                  } ${
                    posting.config?.bgColor || "bg-gray-50"
                  } hover:shadow-lg transition-all cursor-pointer group`}
                  onClick={() => window.open(posting.link, "_blank")}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Platform Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          posting.config?.bgColor || "bg-gray-100"
                        } border ${posting.config?.borderColor || "border-gray-200"}`}
                      >
                        <Globe
                          className={`w-6 h-6 ${posting.config?.textColor || "text-gray-600"}`}
                        />
                      </div>

                      {/* Platform Info */}
                      <div className="flex-1">
                        <h4
                          className={`font-semibold ${
                            posting.config?.textColor || "text-gray-800"
                          }`}
                        >
                          {posting.label}
                        </h4>

                        {/* Posting Date */}
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {posting.postedOn
                              ? dayjs(posting.postedOn).format("MMM D, YYYY [at] h:mm A")
                              : "Recently posted"}
                          </span>
                        </div>

                        {/* Image CDN Status */}
                        {cdnStatus && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <ImageIcon className="w-3 h-3 text-gray-400" />
                            <div className="flex items-center gap-1">
                              {CdnIcon && (
                                <CdnIcon
                                  className={`w-3 h-3 ${cdnStatus.color} ${
                                    posting.imageCdnStatus === "processing" ? "animate-spin" : ""
                                  }`}
                                />
                              )}
                              <span className={`text-xs ${cdnStatus.color}`}>
                                {cdnStatus.label}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Category if available */}
                        {posting.category && (
                          <div className="mt-2">
                            <Tag color="blue" className="text-xs">
                              {posting.category}
                            </Tag>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* External Link Icon */}
                    <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </div>

                  {/* Link Preview */}
                  <div className="mt-3 pt-3 border-t border-gray-200/50">
                    <p className="text-xs text-gray-400 truncate font-mono">{posting.link}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Refresh Button */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              type="text"
              size="small"
              icon={<RefreshCw className={`w-4 h-4 ${isLoadingPostings ? "animate-spin" : ""}`} />}
              onClick={async () => {
                if (blog?._id) {
                  setIsLoadingPostings(true)
                  try {
                    const postings = await getBlogPostings(blog._id)
                    setBlogPostings(postings)
                    message.success("Postings refreshed")
                  } catch (error) {
                    message.error("Failed to refresh postings")
                  } finally {
                    setIsLoadingPostings(false)
                  }
                }
              }}
              disabled={isLoadingPostings}
              className="text-gray-500 hover:text-blue-600"
            >
              Refresh Postings
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default TextEditorSidebar
