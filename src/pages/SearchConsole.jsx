import React, { useState, useMemo } from "react"
import {
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  BarChart3,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Helmet } from "react-helmet"

const SearchConsole = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  })
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [dateRange, setDateRange] = useState("30d")

  // Mock data - replace with actual API data
  const mockBlogData = [
    {
      id: "1",
      blogName: "How To Debug Your React Application Effectively",
      url: "/blog/debug-react-application",
      clicks: 1247,
      impressions: 15680,
      ctr: 7.95,
      position: 3.2,
      keywords: ["react debugging", "javascript errors", "development tools"],
      publishDate: "2024-01-15",
      category: "Development",
      status: "published",
    },
    {
      id: "2",
      blogName: "Complete Guide to SEO Optimization in 2024",
      url: "/blog/seo-optimization-guide",
      clicks: 2156,
      impressions: 28940,
      ctr: 7.45,
      position: 2.8,
      keywords: ["SEO optimization", "search engine ranking", "digital marketing"],
      publishDate: "2024-01-20",
      category: "Marketing",
      status: "published",
    },
    {
      id: "3",
      blogName: "Building Scalable Node.js Applications",
      url: "/blog/scalable-nodejs-apps",
      clicks: 892,
      impressions: 12450,
      ctr: 7.16,
      position: 4.1,
      keywords: ["nodejs", "scalability", "backend development"],
      publishDate: "2024-01-10",
      category: "Development",
      status: "published",
    },
    {
      id: "4",
      blogName: "AI-Powered Content Creation Strategies",
      url: "/blog/ai-content-creation",
      clicks: 1834,
      impressions: 22100,
      ctr: 8.3,
      position: 2.1,
      keywords: ["AI content", "content strategy", "artificial intelligence"],
      publishDate: "2024-01-25",
      category: "AI & Technology",
      status: "published",
    },
    {
      id: "5",
      blogName: "Modern CSS Grid Layout Techniques",
      url: "/blog/css-grid-layout",
      clicks: 756,
      impressions: 9840,
      ctr: 7.68,
      position: 5.2,
      keywords: ["CSS grid", "web design", "frontend development"],
      publishDate: "2024-01-08",
      category: "Design",
      status: "published",
    },
    {
      id: "6",
      blogName: "Database Optimization Best Practices",
      url: "/blog/database-optimization",
      clicks: 1123,
      impressions: 16780,
      ctr: 6.69,
      position: 3.8,
      keywords: ["database optimization", "SQL performance", "data management"],
      publishDate: "2024-01-12",
      category: "Development",
      status: "published",
    },
    {
      id: "7",
      blogName: "Mobile-First Design Principles",
      url: "/blog/mobile-first-design",
      clicks: 945,
      impressions: 13200,
      ctr: 7.16,
      position: 4.5,
      keywords: ["mobile design", "responsive design", "UX principles"],
      publishDate: "2024-01-18",
      category: "Design",
      status: "draft",
    },
    {
      id: "8",
      blogName: "Cloud Security Implementation Guide",
      url: "/blog/cloud-security-guide",
      clicks: 1567,
      impressions: 19850,
      ctr: 7.89,
      position: 2.9,
      keywords: ["cloud security", "cybersecurity", "data protection"],
      publishDate: "2024-01-22",
      category: "Security",
      status: "published",
    },
  ]

  // Filtering and sorting logic
  const filteredAndSortedData = useMemo(() => {
    let filtered = mockBlogData.filter((blog) => {
      const matchesSearch =
        blog.blogName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = filterCategory === "all" || blog.category === filterCategory
      const matchesStatus = filterStatus === "all" || blog.status === filterStatus

      return matchesSearch && matchesCategory && matchesStatus
    })

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
        }

        return 0
      })
    }

    return filtered
  }, [mockBlogData, searchTerm, sortConfig, filterCategory, filterStatus])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)

  // Calculate totals
  const totals = useMemo(() => {
    return filteredAndSortedData.reduce(
      (acc, blog) => ({
        clicks: acc.clicks + blog.clicks,
        impressions: acc.impressions + blog.impressions,
        avgCtr:
          filteredAndSortedData.length > 0
            ? filteredAndSortedData.reduce((sum, b) => sum + b.ctr, 0) /
              filteredAndSortedData.length
            : 0,
        avgPosition:
          filteredAndSortedData.length > 0
            ? filteredAndSortedData.reduce((sum, b) => sum + b.position, 0) /
              filteredAndSortedData.length
            : 0,
      }),
      { clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0 }
    )
  }, [filteredAndSortedData])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    )
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const categories = ["all", ...Array.from(new Set(mockBlogData.map((blog) => blog.category)))]
  const statuses = ["all", "published", "draft", "archived"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 p-6">
      <Helmet>
        <title>Blog Search Console | GenWrite</title>
      </Helmet>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog Search Console</h1>
              <p className="text-gray-600">Monitor your blog performance and search analytics</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(totals.clicks)}</h3>
            <p className="text-gray-600 text-sm">Total Clicks</p>
            <div className="mt-2 text-xs text-green-600 font-medium">+12.5% vs last period</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{formatNumber(totals.impressions)}</h3>
            <p className="text-gray-600 text-sm">Total Impressions</p>
            <div className="mt-2 text-xs text-green-600 font-medium">+8.3% vs last period</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{totals.avgCtr.toFixed(2)}%</h3>
            <p className="text-gray-600 text-sm">Average CTR</p>
            <div className="mt-2 text-xs text-red-600 font-medium">-2.1% vs last period</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{totals.avgPosition.toFixed(1)}</h3>
            <p className="text-gray-600 text-sm">Average Position</p>
            <div className="mt-2 text-xs text-green-600 font-medium">+0.8 vs last period</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search blogs or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "all"
                      ? "All Status"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    <button
                      onClick={() => handleSort("blogName")}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      Blog Name
                      {getSortIcon("blogName")}
                    </button>
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-900">
                    <button
                      onClick={() => handleSort("clicks")}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      Clicks
                      {getSortIcon("clicks")}
                    </button>
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-900">
                    <button
                      onClick={() => handleSort("impressions")}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      Impressions
                      {getSortIcon("impressions")}
                    </button>
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-900">
                    <button
                      onClick={() => handleSort("ctr")}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      CTR
                      {getSortIcon("ctr")}
                    </button>
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-900">
                    <button
                      onClick={() => handleSort("position")}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      Avg Position
                      {getSortIcon("position")}
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">Keywords</th>
                  <th className="text-center p-4 font-semibold text-gray-900">
                    <button
                      onClick={() => handleSort("category")}
                      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                    >
                      Category
                      {getSortIcon("category")}
                    </button>
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-900">Status</th>
                  <th className="text-center p-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((blog, index) => (
                  <tr
                    key={blog.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="p-4">
                      <div className="max-w-xs">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {blog.blogName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{blog.url}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Published: {new Date(blog.publishDate).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-semibold text-gray-900">{formatNumber(blog.clicks)}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-semibold text-gray-900">
                        {formatNumber(blog.impressions)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div
                        className={`font-semibold ${
                          blog.ctr >= 8
                            ? "text-green-600"
                            : blog.ctr >= 5
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {blog.ctr.toFixed(2)}%
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div
                        className={`font-semibold ${
                          blog.position <= 3
                            ? "text-green-600"
                            : blog.position <= 10
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {blog.position.toFixed(1)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {blog.keywords.slice(0, 3).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                        {blog.keywords.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{blog.keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                        {blog.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(
                          blog.status
                        )}`}
                      >
                        {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Blog"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>of {filteredAndSortedData.length} results</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchConsole
