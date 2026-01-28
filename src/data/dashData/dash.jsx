import {
  Activity,
  BarChart2Icon,
  BarChart3,
  Grid3X3,
  PenTool,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { FaYoutube } from "react-icons/fa"
import { ACTIVE_MODELS } from "@/data/dashModels"

export const stats = [
  { label: "Total Projects", value: "24", change: "+12%", icon: <Target className="w-5 h-5" /> },
  {
    label: "Words Generated",
    value: "45.2K",
    change: "+8%",
    icon: <PenTool className="w-5 h-5" />,
  },
  { label: "Credits Used", value: "1,247", change: "+15%", icon: <Sparkles className="w-5 h-5" /> },
  { label: "Success Rate", value: "94%", change: "+2%", icon: <BarChart3 className="w-5 h-5" /> },
]

export const letsBegin = [
  {
    id: "A",
    title: "Generate Quick Blog",
    icon: <Zap className="w-6 h-6" />,
    content: "Create engaging blogs in seconds with just a few inputs — super fast and easy!",
    hoverGradient: "from-purple-500 to-purple-600",
    modelKey: ACTIVE_MODELS.Quick_Blog,
  },
  {
    id: "C",
    title: "Generate Advanced Blog",
    icon: <PenTool className="w-6 h-6" />,
    content: "Fine-tune every detail — from tone to structure — for premium, pro-level blogs.",
    hoverGradient: "from-blue-500 to-sky-400",
    modelKey: ACTIVE_MODELS.Advanced_Blog,
  },
  {
    id: "B",
    title: "Generate YouTube Blog",
    icon: <FaYoutube className="w-6 h-6" />,
    content: "Transform YouTube videos into SEO-friendly blogs automatically.",
    hoverGradient: "from-red-500 to-pink-600",
    modelKey: ACTIVE_MODELS.YouTube_Blog,
  },
  {
    id: "D",
    title: "Generate Bulk Blogs",
    icon: <Grid3X3 className="w-6 h-6" />,
    content: "Generate dozens of blogs at once with flexible templates and automation.",
    hoverGradient: "from-emerald-500 to-green-600",
    modelKey: ACTIVE_MODELS.Bulk_Blog,
  },
]

export const quickTools = [
  {
    id: 1,
    title: "Keyword Research",
    content: "Explore keywords, check stats, and power your blogs & jobs.",
    icon: <Search className="w-6 h-6" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
    modelKey: ACTIVE_MODELS.Keyword_Research,
  },
  {
    id: 3,
    title: "Performance Monitoring",
    content: "Monitor your blog's SEO, keywords, and competitor data easily.",
    icon: <Activity className="w-6 h-6" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    hoverBg: "hover:bg-orange-100",
    modelKey: ACTIVE_MODELS.Performance_Monitoring,
  },
  {
    id: 4,
    title: "Competitor Analysis",
    content: "Analyze your competitors' content and strategies.",
    icon: <Users className="w-6 h-6" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    hoverBg: "hover:bg-purple-100",
    modelKey: ACTIVE_MODELS.Competitor_Analysis,
  },
  {
    id: 5,
    title: "Analytics",
    content: "Visualize performance, unlock insights, and stay ahead",
    icon: <BarChart2Icon className="w-6 h-6" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    hoverBg: "hover:bg-green-100",
    navigate: "/analytics",
  },
]
