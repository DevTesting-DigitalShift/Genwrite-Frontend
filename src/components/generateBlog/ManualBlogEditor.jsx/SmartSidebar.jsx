import { useState, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Hash,
  Zap,
  BarChart3,
  Sparkles,
  Target,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { Button, Modal, message } from "antd"
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useNavigate } from "react-router-dom"

const SmartSidebar = ({
  isExpanded,
  onToggle,
  wordCount,
  readTime,
  title,
  content,
  keywords,
  addKeyword,
  removeKeyword,
  generateKeywords,
  isGeneratingKeywords,
  newKeyword,
  setNewKeyword,
  seoScore,
  blogScore,
  getScoreColor,
}) => {
  const [activeToolId, setActiveToolId] = useState(null)
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const userPlan = user?.plan ?? user?.subscription?.plan
  const { handlePopup } = useConfirmPopup()
  const navigate = useNavigate()

  const tools = [
    {
      id: "overview",
      name: "Document Overview",
      icon: FileText,
      description: "Document stats and overview",
      isActive: true,
      component: OverviewPanel,
    },
    {
      id: "performance-metrics",
      name: "Performance Metrics",
      icon: Target,
      description: "SEO optimization tools",
      isActive: true,
      component: SEOPanel,
    },
    {
      id: "ai-assistant",
      name: "AI Assistant",
      icon: Sparkles,
      description: "AI-powered writing suggestions",
      isActive: true,
      isPro: true,
      component: AIAssistantPanel,
    },
    {
      id: "tags",
      name: "Keywords",
      icon: Hash,
      description: "Manage tags and categories",
      isActive: true,
      component: TagsPanel,
    },
    {
      id: "content-enhancements",
      name: "Content Enhancements",
      icon: BarChart3,
      description: "Content performance metrics",
      isActive: true,
      isPro: false,
      component: ContentEnhancementsPanel,
    },
  ]

  const handleToggleTool = (toolId) => {
    setActiveToolId(activeToolId === toolId ? null : toolId)
  }

  const handleAnalyzing = useCallback(() => {
    if (["free", "basic"].includes(userPlan?.toLowerCase())) {
      return handlePopup({
        title: "Upgrade Required",
        description: "Competitor Analysis is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/pricing"),
      })
    }

    const hasScore = typeof seoScore === "number" && seoScore >= 0
    const hasAnalysis = false // Placeholder: Replace with actual competitiveAnalysisResults check if available

    if (!hasScore && !hasAnalysis) {
      return handlePopup({
        title: "Competitive Analysis",
        description: "Do you really want to run competitive analysis? It will cost 10 credits.",
        confirmText: "Run",
        cancelText: "Cancel",
        onConfirm: fetchCompetitiveAnalysis,
      })
    }

    return handlePopup({
      title: "Run Competitive Analysis Again?",
      description:
        "You have already performed a competitive analysis for this blog. Would you like to run it again? This will cost 10 credits.",
      confirmText: "Run",
      cancelText: "Cancel",
      onConfirm: fetchCompetitiveAnalysis,
    })
  }, [userPlan, seoScore, handlePopup, navigate])

  const fetchCompetitiveAnalysis = useCallback(async () => {
    try {
      await dispatch(
        fetchCompetitiveAnalysisThunk({ blogId: "someBlogId", title, content, keywords })
      ).unwrap()
      message.success("Competitive analysis started.")
    } catch (err) {
      message.error("Failed to start competitive analysis.")
    }
  }, [dispatch, title, content, keywords])

  // const handlePopup = ({ title, description, confirmText, cancelText, onConfirm }) => {
  //   Modal.confirm({
  //     title,
  //     content: description,
  //     okText: confirmText,
  //     cancelText,
  //     onOk: onConfirm,
  //     onCancel: () => {},
  //   })
  // }

  return (
    <div
      className={`relative bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-lg ${
        isExpanded ? "w-[300px]" : "w-20"
      }`}
    >
      <button
        onClick={onToggle}
        className="absolute -left-3 top-6 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 shadow-md"
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <ChevronRight className="w-3 h-3 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-600" />
        )}
      </button>

      <div className="h-full flex flex-col">
        <div className="flex-1 py-6 overflow-y-auto">
          <div className="space-y-1 px-3">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isActive = activeToolId === tool.id

              return (
                <div key={tool.id} className="relative group">
                  <button
                    onClick={() => tool.isActive && handleToggleTool(tool.id)}
                    disabled={!tool.isActive}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : tool.isActive
                        ? "hover:bg-gray-50"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isExpanded ? "mr-3" : ""}`} />
                    {isExpanded && (
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{tool.name}</span>
                          {tool.isPro && (
                            <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full">
                              Pro
                            </span>
                          )}
                        </div>
                        {!tool.isActive && (
                          <span className="text-xs text-gray-500">Coming soon</span>
                        )}
                      </div>
                    )}
                  </button>

                  {!isExpanded && (
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {tool.name}
                        {tool.isPro && <span className="ml-1 text-purple-300">Pro</span>}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <tool.component
                              wordCount={wordCount}
                              readTime={readTime}
                              title={title}
                              content={content}
                              keywords={keywords}
                              addKeyword={addKeyword}
                              removeKeyword={removeKeyword}
                              generateKeywords={generateKeywords}
                              isGeneratingKeywords={isGeneratingKeywords}
                              newKeyword={newKeyword}
                              setNewKeyword={setNewKeyword}
                              seoScore={seoScore}
                              blogScore={blogScore}
                              getScoreColor={getScoreColor}
                              handleAnalyzing={handleAnalyzing}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Panel Components
const OverviewPanel = ({ wordCount, readTime, title }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-2xl font-bold text-blue-600">{wordCount}</div>
        <div className="text-sm text-gray-600">Words</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="text-2xl font-bold text-green-600">{readTime}</div>
        <div className="text-sm text-gray-600">Min read</div>
      </div>
    </div>
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Title Length</label>
        <div className="mt-1 flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                title.length <= 60 ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min((title.length / 60) * 100, 100)}%` }}
            />
          </div>
          <span className="ml-2 text-sm text-gray-600">{title.length}/60</span>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Content Progress</label>
        <div className="mt-1 flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((wordCount / 1000) * 100, 100)}%` }}
            />
          </div>
          <span className="ml-2 text-sm text-gray-600">{wordCount}/1000</span>
        </div>
      </div>
    </div>
  </div>
)

const AIAssistantPanel = ({ generateKeywords, isGeneratingKeywords, handleAnalyzing }) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <button
        onClick={generateKeywords}
        disabled={isGeneratingKeywords}
        className={`w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 ${
          isGeneratingKeywords ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="w-5 h-5" />
          <span>{isGeneratingKeywords ? "Generating..." : "Generate Keywords"}</span>
        </div>
      </button>
      <button
        onClick={handleAnalyzing}
        className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
      >
        <div className="flex items-center justify-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Run Competitive Analysis</span>
        </div>
      </button>
      <button className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200">
        <div className="flex items-center justify-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Proofread Content</span>
        </div>
      </button>
    </div>
  </div>
)

const SEOPanel = ({ seoScore, blogScore, getScoreColor }) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700">Blog Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(blogScore)}`}>{blogScore || 0}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getScoreColor(blogScore)}`}
            style={{ width: `${Math.min(blogScore || 0, 100)}%` }}
          />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-700">SEO Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(seoScore)}`}>{seoScore || 0}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getScoreColor(seoScore)}`}
            style={{ width: `${Math.min(seoScore || 0, 100)}%` }}
          />
        </div>
      </div>
    </div>
  </div>
)

const TagsPanel = ({ keywords, addKeyword, removeKeyword, newKeyword, setNewKeyword }) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Keywords</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {keywords.map((keyword) => (
            <span
              key={keyword.text}
              className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
            >
              {keyword.text}
              <button
                onClick={() => removeKeyword(keyword.text)}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addKeyword()}
            placeholder="Add keyword"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            onClick={addKeyword}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Add
          </Button>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
        <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option>Technology</option>
          <option>Tutorial</option>
          <option>News</option>
          <option>Other</option>
        </select>
      </div>
    </div>
  </div>
)

const ContentEnhancementsPanel = () => {
  const enhancements = [
    { name: "Interlinks", status: "Disabled" },
    { name: "FAQs", status: "Disabled" },
    { name: "Competitor Research", status: "Disabled" },
    { name: "Generate Humanised Content", status: "Disabled" },
    { name: "Keyword Research", status: "Disabled" },
    { name: "Wordpress Posting", status: "Disabled" },
    { name: "Table of Contents", status: "Disabled" },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {enhancements.map((enhancement) => (
          <div
            key={enhancement.name}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
          >
            <span className="text-sm font-medium text-gray-700">{enhancement.name}</span>
            <span className="text-sm text-gray-500">{enhancement.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SmartSidebar
