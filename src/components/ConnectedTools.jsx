import React from "react"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Shield, UserCheck, FileText, Layout, Youtube, Search, TrendingUp, MessageSquare } from "lucide-react"
import { useNavigate } from "react-router-dom"

/**
 * @typedef {Object} ToolSuggestion
 * @property {string} title
 * @property {string} description
 * @property {string} path
 * @property {any} icon
 * @property {string} color
 * @property {string} id
 */

const ALL_TOOLS = {
  humanize: {
    id: "humanize",
    title: "AI Humanizer",
    description: "Transform AI text into undetectable, human-like content.",
    path: "/humanize-content",
    icon: UserCheck,
    color: "from-blue-500 to-indigo-600",
  },
  detection: {
    id: "detection",
    title: "AI Detection",
    description: "Verify if your content looks AI-generated or human-written.",
    path: "/ai-content-detection",
    icon: Shield,
    color: "from-indigo-500 to-purple-600",
  },
  metadata: {
    id: "metadata",
    title: "Meta Data Generator",
    description: "Optimize your SEO with AI-generated titles and descriptions.",
    path: "/generate-metadata",
    icon: Search,
    color: "from-emerald-500 to-teal-600",
  },
  youtube: {
    id: "youtube",
    title: "YouTube Summary",
    description: "Instant summaries and highlights from any YouTube video.",
    path: "/youtube-summarization",
    icon: Youtube,
    color: "from-red-500 to-rose-600",
  },
  keyword: {
    id: "keyword",
    title: "Keyword Research",
    description: "Find high-potential keywords to boost your SEO strategy.",
    path: "/keyword-research",
    icon: TrendingUp,
    color: "from-blue-400 to-cyan-600",
  },
  chatpdf: {
    id: "chatpdf",
    title: "Chat With PDF",
    description: "Analyze, summarize and chat with your PDF documents.",
    path: "/chat-with-pdf",
    icon: MessageSquare,
    color: "from-indigo-400 to-blue-600",
  },
  ranking: {
    id: "ranking",
    title: "Website Ranking",
    description: "Track your website's performance and search rankings.",
    path: "/website-ranking",
    icon: Layout,
    color: "from-teal-400 to-emerald-600",
  },
}

const ConnectedTools = ({ currentToolId, suggestions = [], title = "What's Next?" }) => {
  const navigate = useNavigate()

  // Filter out the current tool and map IDs to tool objects
  const toolsToShow = suggestions
    .map(id => ALL_TOOLS[id])
    .filter(tool => tool && tool.id !== currentToolId)
    .slice(0, 3)

  if (toolsToShow.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {toolsToShow.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(tool.path)}
            className="group cursor-pointer bg-white border border-gray-100 p-5 rounded-2xl hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative overflow-hidden"
          >
            {/* Background Gradient Blur */}
            <div className={`absolute -right-4 -top-4 w-16 h-16 bg-linear-to-br ${tool.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`} />
            
            <div className={`w-12 h-12 bg-linear-to-br ${tool.color} rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300`}>
              <tool.icon className="w-6 h-6 text-white" />
            </div>

            <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {tool.title}
            </h4>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
              {tool.description}
            </p>

            <div className="flex items-center text-blue-600 text-sm font-bold group-hover:gap-2 transition-all">
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
