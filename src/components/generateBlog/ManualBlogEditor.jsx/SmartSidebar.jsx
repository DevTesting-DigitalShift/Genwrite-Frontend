import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Hash,
  Zap,
  BarChart3,
  Image,
  BookOpen,
  GitBranch,
  Calendar,
  Settings,
  Sparkles,
  Target,
} from "lucide-react"

const SmartSidebar = ({ isExpanded, onToggle, wordCount, readTime, title, content }) => {
  const [activeToolId, setActiveToolId] = useState("overview")

  const tools = [
    {
      id: "overview",
      name: "Overview",
      icon: FileText,
      description: "Document stats and overview",
      isActive: true,
      component: OverviewPanel,
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
      id: "seo-insights",
      name: "SEO Insights",
      icon: Target,
      description: "SEO optimization tools",
      isActive: true,
      component: SEOPanel,
    },
    {
      id: "tags",
      name: "Tags & Categories",
      icon: Hash,
      description: "Manage tags and categories",
      isActive: true,
      component: TagsPanel,
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: BarChart3,
      description: "Content performance metrics",
      isActive: false,
      isPro: true,
    },
    {
      id: "media",
      name: "Media Manager",
      icon: Image,
      description: "Upload and manage images",
      isActive: false,
    },
    {
      id: "markdown",
      name: "Markdown Guide",
      icon: BookOpen,
      description: "Markdown syntax reference",
      isActive: false,
    },
    {
      id: "versions",
      name: "Version History",
      icon: GitBranch,
      description: "Track document changes",
      isActive: false,
      isPro: true,
    },
    {
      id: "schedule",
      name: "Publishing",
      icon: Calendar,
      description: "Schedule and publish posts",
      isActive: false,
    },
    {
      id: "settings",
      name: "Settings",
      icon: Settings,
      description: "Editor preferences",
      isActive: false,
    },
  ]

  const activeTool = tools.find((tool) => tool.id === activeToolId)
  const ActiveComponent = activeTool?.component

  return (
    <>
      {/* Sidebar */}
      <div
        className={`relative bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-lg ${
          isExpanded ? "w-80" : "w-16"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -left-3 top-6 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 shadow-md"
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronRight className="w-3 h-3 text-white-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-white-600" />
          )}
        </button>

        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          {/* Tools Navigation */}
          <div className="flex-1 py-6 overflow-y-auto">
            <div className="space-y-1 px-3">
              {tools.map((tool) => {
                const Icon = tool.icon
                const isActive = activeToolId === tool.id

                return (
                  <div key={tool.id} className="relative group">
                    <button
                      onClick={() => tool.isActive && setActiveToolId(tool.id)}
                      disabled={!tool.isActive}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : tool.isActive
                          ? "hover:bg-gray-50"
                          : "cursor-not-allowed"
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
                            <span className="text-xs text-gray-500 ">Coming soon</span>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Tooltip for collapsed state */}
                    {!isExpanded && (
                      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                        <div className="bg-gray-900  text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {tool.name}
                          {tool.isPro && <span className="ml-1 text-purple-300">Pro</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && ActiveComponent && (
        <div className="w-80 bg-white border-r border-gray-200overflow-y-auto">
          <ActiveComponent
            wordCount={wordCount}
            readTime={readTime}
            title={title}
            content={content}
          />
        </div>
      )}
    </>
  )
}

// Panel Components
const OverviewPanel = ({ wordCount, readTime, title }) => (
  <div className="p-6 space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Document Overview</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-20">
          <div className="text-2xl font-bold text-blue-60">{wordCount}</div>
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
  </div>
)

const AIAssistantPanel = () => (
  <div className="p-6 space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Assistant</h3>

      <div className="space-y-4">
        <button className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>Generate Title Ideas</span>
          </div>
        </button>

        <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200">
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Improve Content</span>
          </div>
        </button>

        <button className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200">
          <div className="flex items-center justify-center space-x-2">
            <Target className="w-5 h-5" />
            <span>SEO Optimization</span>
          </div>
        </button>
      </div>
    </div>
  </div>
)

const SEOPanel = () => {
  const [keywords, setKeywords] = useState(["react", "blog", "editor"])
  const [newKeyword, setNewKeyword] = useState("")

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()])
      setNewKeyword("")
    }
  }

  const removeKeyword = (keyword) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Insights</h3>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 ">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 ">SEO Score</span>
              <span className="text-2xl font-bold text-green-600 ">85</span>
            </div>
            <div className="w-full bg-gray-200  rounded-full h-2">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: "85%" }} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700  mb-2 block">Focus Keywords</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-2 py-1 bg-blue-100  text-blue-800  text-xs rounded-full"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 text-blue-600  hover:text-blue-800 -200"
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white  text-gray-900  text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addKeyword}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TagsPanel = () => {
  const [tags, setTags] = useState(["Technology", "Tutorial", "React"])
  const [newTag, setNewTag] = useState("")

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags & Categories</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-purple-100 900 text-purple-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-purple-600 hover:text-purple-800 purple-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag"
                className="flex-1 px-3 py-2 border border-gray-300  rounded-lg bg-white -800 text-gray-900  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700  mb-2 block">Category</label>
            <select className="w-full px-3 py-2 border border-gray-300  rounded-lg bg-white -800 text-gray-900  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>Technology</option>
              <option>Tutorial</option>
              <option>News</option>
              <option>Opinion</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartSidebar
