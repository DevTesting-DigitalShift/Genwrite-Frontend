import React from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Sparkles,
  Shield,
  UserCheck,
  FileText,
  Layout,
  Youtube,
  Search,
  TrendingUp,
  MessageSquare,
  MousePointerClick,
  Globe,
  Activity,
  Image as ImageIcon,
} from "lucide-react"

const TOOL_TYPES = { URL: "URL", TEXT: "TEXT", GENERIC: "GENERIC" }

const ALL_TOOLS = {
  humanize: {
    id: "humanize",
    title: "AI Humanizer",
    description: "Transform AI text into undetectable, human-like content.",
    path: "/humanize-content",
    icon: UserCheck,
    color: "from-blue-500 to-indigo-600",
    type: TOOL_TYPES.TEXT,
  },
  detection: {
    id: "detection",
    title: "AI Detection",
    description: "Verify if your content looks AI-generated or human-written.",
    path: "/content-detection",
    icon: Shield,
    color: "from-indigo-500 to-purple-600",
    type: TOOL_TYPES.TEXT,
  },
  metadata: {
    id: "metadata",
    title: "Meta Data Generator",
    description: "Optimize your SEO with AI-generated titles and descriptions.",
    path: "/generate-metadata",
    icon: Search,
    color: "from-emerald-500 to-teal-600",
    type: TOOL_TYPES.TEXT,
  },
  youtube: {
    id: "youtube",
    title: "YouTube Summary",
    description: "Instant summaries and highlights from any YouTube video.",
    path: "/youtube-summarization",
    icon: Youtube,
    color: "from-red-500 to-rose-600",
    type: TOOL_TYPES.URL,
  },
  keyword: {
    id: "keyword",
    title: "Keyword Research",
    description: "Find high-potential keywords to boost your SEO strategy.",
    path: "/keyword-research",
    icon: TrendingUp,
    color: "from-blue-400 to-cyan-600",
    type: TOOL_TYPES.TEXT,
  },
  chatpdf: {
    id: "chatpdf",
    title: "Chat With PDF",
    description: "Analyze, summarize and chat with your PDF documents.",
    path: "/chat-with-pdf",
    icon: MessageSquare,
    color: "from-indigo-400 to-blue-600",
    type: TOOL_TYPES.GENERIC,
  },
  ranking: {
    id: "ranking",
    title: "Website Ranking",
    description: "Track your website's performance and search rankings.",
    path: "/website-ranking",
    icon: Layout,
    color: "from-teal-400 to-emerald-600",
    type: TOOL_TYPES.URL,
  },
  scraping: {
    id: "scraping",
    title: "Keyword Scrapping",
    description: "Extract high-performing keywords from any website URL.",
    path: "/keyword-scraping",
    icon: MousePointerClick,
    color: "from-orange-500 to-amber-600",
    type: TOOL_TYPES.URL,
  },
  builder: {
    id: "builder",
    title: "Competitive Analysis",
    description: "Create stunning websites and landing pages in seconds.",
    path: "/competitive-analysis",
    icon: Globe,
    color: "from-violet-500 to-fuchsia-600",
    type: TOOL_TYPES.URL,
  },
  images: {
    id: "images",
    title: "AI Image Tools",
    description: "Generate and edit professional images with AI. ",
    path: "/image-gallery",
    icon: ImageIcon,
    color: "from-pink-500 to-rose-600",
    type: TOOL_TYPES.GENERIC,
  },
  monitoring: {
    id: "monitoring",
    title: "Performance Monitoring",
    description: "Keep track of your SEO performance and site health.",
    path: "/performance-monitoring",
    icon: Activity,
    color: "from-green-500 to-emerald-600",
    type: TOOL_TYPES.GENERIC,
  },
}

const ConnectedTools = ({
  currentToolId,
  suggestions = [],
  title = "What's Next?",
  transferValue = "",
  isCompact = false,
}) => {
  const navigate = useNavigate()

  const currentTool = ALL_TOOLS[currentToolId] || {}
  const currentType = currentTool.type || TOOL_TYPES.GENERIC

  // Smart suggestions logic
  const getSmartSuggestions = () => {
    // 1. Get tools of the same type (excluding current)
    const sameType = Object.values(ALL_TOOLS).filter(
      t => t.type === currentType && t.id !== currentToolId
    )

    // 2. Get generic tools (excluding current and same type)
    const generics = Object.values(ALL_TOOLS).filter(
      t =>
        t.type === TOOL_TYPES.GENERIC &&
        t.id !== currentToolId &&
        !sameType.find(st => st.id === t.id)
    )

    // 3. Get other tools (fallback)
    const others = Object.values(ALL_TOOLS).filter(
      t =>
        t.id !== currentToolId &&
        !sameType.find(st => st.id === t.id) &&
        !generics.find(g => g.id === t.id)
    )

    // Combine them prioritising same type, then generic, then others
    return [...sameType, ...generics, ...others].slice(0, 3)
  }

  // Use either smart suggestions or manual suggestions
  const toolsToShow =
    suggestions.length > 0
      ? suggestions
          .map(id => ALL_TOOLS[id])
          .filter(tool => tool && tool.id !== currentToolId)
          .slice(0, 3)
      : getSmartSuggestions()

  if (toolsToShow.length === 0) return null

  return (
    <div className={isCompact ? "" : "mt-12 pt-8 border-t border-gray-100"}>
      <div className={`flex items-center gap-3 ${isCompact ? "mb-4" : "mb-6"}`}>
        <div
          className={`${isCompact ? "w-6 h-6" : "w-8 h-8"} bg-blue-50 rounded-lg flex items-center justify-center`}
        >
          <Sparkles className={`${isCompact ? "w-3 h-3" : "w-4 h-4"} text-blue-600`} />
        </div>
        <h3 className={`${isCompact ? "text-lg" : "text-xl"} font-bold text-gray-900`}>{title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {toolsToShow.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              const finalValue = tool.id === "youtube" || tool.id === "scraping" ? "" : transferValue
              navigate(tool.path, { state: { transferValue: finalValue } })
            }}
            className={`group cursor-pointer bg-white border border-gray-100 ${isCompact ? "p-3.5" : "p-5"} rounded-2xl hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative overflow-hidden`}
          >
            {/* Background Gradient Blur */}
            <div
              className={`absolute -right-4 -top-4 w-16 h-16 bg-linear-to-br ${tool.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`}
            />

            <div
              className={`${isCompact ? "w-10 h-10" : "w-12 h-12"} bg-linear-to-br ${tool.color} rounded-xl flex items-center justify-center ${isCompact ? "mb-2.5" : "mb-4"} shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300`}
            >
              <tool.icon className={`${isCompact ? "w-5 h-5" : "w-6 h-6"} text-white`} />
            </div>

            <h4
              className={`${isCompact ? "text-base" : "text-lg"} font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors`}
            >
              {tool.title}
            </h4>
            <p
              className={`${isCompact ? "text-xs" : "text-sm"} text-gray-500 line-clamp-2 leading-relaxed ${isCompact ? "mb-3" : "mb-4"}`}
            >
              {tool.description}
            </p>

            <div
              className={`flex items-center text-blue-600 ${isCompact ? "text-[12px]" : "text-sm"} font-bold group-hover:gap-2 transition-all`}
            >
              Try It Now
              <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ConnectedTools
