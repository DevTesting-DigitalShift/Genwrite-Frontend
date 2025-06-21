import { Activity, BarChart3, Grid3X3, PenTool, Search, Sparkles, Target, TrendingUp, Users, Zap } from "lucide-react"

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
    id: 1,
    imageUrl: "./Images/createnew.png",
    title: "Create New BLog",
    icon: <PenTool className="w-6 h-6" />,
    content: "Generate blogs, email, product, description, etc.",
    hoverGradient: "from-blue-600 to-blue-700",
  },
  {
    id: "A",
    imageUrl: "./Images/quickblog.png",
    title: "Generate Quick Blog",
    icon: <Zap className="w-6 h-6" />,
    content: "With few inputs you are good to go to create Awesome blogs!",
    hoverGradient: "from-purple-600 to-purple-700",
  },
  {
    id: "B",
    imageUrl: "./Images/createmultipleblog.png",
    title: "Create Multiple Blog's",
    icon: <Grid3X3 className="w-6 h-6" />,
    content: "Ellipse draft overflow arrange pen",
    hoverGradient: "from-emerald-600 to-emerald-700",
  },
]

export const quickTools = [
  {
    id: 1,
    imageUrl: "./Images/keyword.png",
    title: "Keyword Search",
    content: "Fill bold reesizing vector create group inspect effect.",
    icon: <Search className="w-8 h-8" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
  },
  {
    id: 2,
    imageUrl: "./Images/seoanalysis.png",
    title: "SEO Analysis",
    content: "Generate blogs, emails , product description etc.",
    icon: <TrendingUp className="w-8 h-8" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    hoverBg: "hover:bg-green-100",
  },
  {
    id: 3,
    imageUrl: "./Images/performancemonitoring.png",
    title: "Performance Monitoring",
    content: "Generate blogs, emails , product description etc.",
    icon: <Activity className="w-8 h-8" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    hoverBg: "hover:bg-orange-100",
  },
  {
    id: 4,
    imageUrl: "./Images/competitor.png",
    title: "Competitor Analysis",
    content: "Analyze your competitors' content and strategies",
    icon: <Users className="w-8 h-8" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    hoverBg: "hover:bg-purple-100",
  },
]

export const recentProjects = [
  {
    id: 1,
    title: "How to cook pasta in 15 minutes",
    content:
      "Cooking a pot of pasta is one of the best kitchen skills you can learn. Pasta is inexpensive, cooks up quickly, and ...",
    tags: ["Blog", "Pasta"],
  },
  {
    id: 2,
    title: "Experience the Future of Footwear with 3D Printed Shoes",
    content:
      "Our cutting-edge technology allows you to create shoes that are uniquely tailored to your feet, providing ...",
    tags: ["Facebook Post", "Post", "Footwear"],
  },
]
