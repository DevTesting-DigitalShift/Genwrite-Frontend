import { useState, useMemo, useEffect } from "react"
import {
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Link,
  Download,
} from "lucide-react"
import { Helmet } from "react-helmet"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { fetchVerifiedSites, connectGscAccount, fetchGscAuthUrl } from "@store/slices/gscSlice"
import axios from "axios"
import { useGoogleLogin } from "@react-oauth/google"
import { message, Button } from "antd"
import { useNavigate, useSearchParams } from "react-router-dom"

const SearchConsole = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [dateRange, setDateRange] = useState("30d")
  const [blogData, setBlogData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const dispatch = useDispatch()
  const {
    verifiedSites,
    loading: sitesLoading,
    error: reduxError,
  } = useSelector((state) => state.gsc)
  const { user } = useSelector((state) => state.auth)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Calculate date range for API request
  const getDateRangeParams = () => {
    const to = new Date()
    const from = new Date()
    switch (dateRange) {
      case "7d":
        from.setDate(to.getDate() - 7)
        break
      case "90d":
        from.setDate(to.getDate() - 90)
        break
      case "1y":
        from.setFullYear(to.getFullYear() - 1)
        break
      case "30d":
      default:
        from.setDate(to.getDate() - 30)
        break
    }
    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    }
  }

  // Google Search Console authentication
  const connectGSC = async () => {
    try {
      setIsConnecting(true)
      const result = await dispatch(fetchGscAuthUrl()).unwrap()
      console.log({result})
      if (result) {
        const popup = window.open(result, "GSC Connect", "width=600,height=600")
        if (!popup) {
          throw new Error("Popup blocked. Please allow popups and try again.")
        }

        const handleMessage = async (event) => {
          // Ensure the message comes from the expected origin
          if (event.origin !== window.location.origin) return
          const { code, state, error: popupError } = event.data
          if (popupError) {
            message.error(popupError)
            setIsConnecting(false)
            window.removeEventListener("message", handleMessage)
            return
          }
          if (code && state) {
            try {
              await dispatch(connectGscAccount({ code, state })).unwrap()
              message.success("Google Search Console connected successfully!")
              dispatch(fetchVerifiedSites())
              // Clear query params if any
              navigate("/search-console", { replace: true })
            } catch (err) {
              message.error("Failed to connect GSC account.")
              console.error(err)
            } finally {
              setIsConnecting(false)
              window.removeEventListener("message", handleMessage)
            }
          }
        }

        window.addEventListener("message", handleMessage)

        // Fallback: Poll popup closure
        const checkPopupClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopupClosed)
            setIsConnecting(false)
            window.removeEventListener("message", handleMessage)
            // message.error("Authentication canceled or failed.")
          }
        }, 1000)
      }
    } catch (err) {
      message.error(err.message || "Failed to initiate GSC connection.")
      console.error(err)
      setIsConnecting(false)
    }
  }

  // Handle OAuth callback from query params (fallback for direct redirects)
  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      message.error(`Authentication failed: ${error}`)
      setSearchParams({}, { replace: true })
      setIsConnecting(false)
      return
    }

    if (code && state) {
      const connect = async () => {
        try {
          setIsConnecting(true)
          await dispatch(connectGscAccount({ code, state })).unwrap()
          message.success("Google Search Console connected successfully!")
          dispatch(fetchVerifiedSites())
          setSearchParams({}, { replace: true })
        } catch (err) {
          message.error("Failed to connect GSC account.")
          console.error(err)
        } finally {
          setIsConnecting(false)
        }
      }
      connect()
    }
  }, [searchParams, dispatch, setSearchParams])

  // Fetch analytics data for all verified sites
  const fetchAnalyticsData = async () => {
    if (!verifiedSites.length) return
    setIsLoading(true)
    setError(null)
    try {
      const { from, to } = getDateRangeParams()
      const blogDataPromises = verifiedSites.map(async (site) => {
        const siteUrl = site.siteUrl // Matches backend's siteUrl format (e.g., sc-domain:example.com)
        const response = await axios.get("/api/v1/gsc/sites-data", {
          params: {
            siteUrl,
            from,
            to,
            dimensions: ["page", "query"],
          },
        })

        const analyticsRows = response.data.data?.rows || []
        return analyticsRows.map((row, index) => ({
          id: `${siteUrl}-${index}`,
          blogName: row.keys[0].split("/").pop() || "Untitled Page",
          url: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr ? (row.ctr * 100).toFixed(2) : 0,
          position: row.position ? row.position.toFixed(1) : 0,
          keywords: row.keys[1] ? [row.keys[1]] : [],
          publishDate: new Date().toISOString().split("T")[0], // Placeholder; update if backend provides
          category: "Uncategorized", // Placeholder; extend backend to support categories
          status: "published", // Placeholder; extend backend for status
        }))
      })

      const allBlogData = (await Promise.all(blogDataPromises)).flat()
      setBlogData(allBlogData)
    } catch (err) {
      console.error("Error fetching analytics data:", err.response?.data || err)
      const errorMessage =
        err.response?.status === 403
          ? "You do not have access to one or more sites. Please reconnect your GSC account."
          : err.response?.status === 400
          ? "Invalid query parameters. Please check your input."
          : err.response?.data?.error || "Failed to load analytics data."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Export data as CSV
  const handleExport = async () => {
    if (!blogData.length) {
      message.warning("No data to export")
      return
    }
    const headers = [
      "Blog Name",
      "URL",
      "Clicks",
      "Impressions",
      "CTR (%)",
      "Avg Position",
      "Keywords",
      "Category",
      "Status",
      "Publish Date",
    ]
    const rows = blogData.map((blog) => [
      blog.blogName,
      blog.url,
      blog.clicks,
      blog.impressions,
      blog.ctr,
      blog.position,
      blog.keywords.join("; "),
      blog.category,
      blog.status,
      blog.publishDate,
    ])
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "search_console_data.csv"
    link.click()
    URL.revokeObjectURL(url)
    message.success("Data exported as CSV")
  }

  // Fetch verified sites and analytics data on mount and date range change
  useEffect(() => {
    dispatch(fetchVerifiedSites())
  }, [dispatch])

  useEffect(() => {
    if (verifiedSites.length > 0) {
      fetchAnalyticsData()
    }
  }, [verifiedSites, dateRange])

  // Filtering and sorting logic
  const filteredAndSortedData = useMemo(() => {
    let filtered = blogData.filter((blog) => {
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
  }, [blogData, searchTerm, sortConfig, filterCategory, filterStatus])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)

  // Calculate totals
  const totals = useMemo(() => {
    return filteredAndSortedData.reduce(
      (acc, blog) => ({
        clicks: acc.clicks + Number(blog.clicks),
        impressions: acc.impressions + Number(blog.impressions),
        avgCtr:
          filteredAndSortedData.length > 0
            ? filteredAndSortedData.reduce((sum, b) => sum + Number(b.ctr), 0) /
              filteredAndSortedData.length
            : 0,
        avgPosition:
          filteredAndSortedData.length > 0
            ? filteredAndSortedData.reduce((sum, b) => sum + Number(b.position), 0) /
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

  const categories = ["all", ...Array.from(new Set(blogData.map((blog) => blog.category)))]
  const statuses = ["all", "published", "draft", "archived"]

  // GSC Connection UI
  if (!verifiedSites.length) {
    return (
      <div
        className="p-6 flex items-center justify-center"
        style={{ minHeight: "calc(100vh - 250px)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center"
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Link className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Google Search Console</h2>
          <p className="text-gray-600 text-sm mb-6">
            Connect your Google Search Console account to monitor your blog performance, track
            search analytics, and optimize your content for better visibility.
          </p>
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm mb-4">
              {error}
              {error.includes("unauthorized_client") && (
                <div className="mt-2">
                  <Button type="link" onClick={connectGSC} disabled={isConnecting}>
                    Try Reconnecting
                  </Button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={connectGSC}
            disabled={isConnecting}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Connect GSC
              </>
            )}
          </button>
        </motion.div>
      </div>
    )
  }

  // Main UI with data
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 p-5">
      <Helmet>
        <title>Blog Search Console | GenWrite</title>
      </Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Search Console
            </motion.h1>
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
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={fetchAnalyticsData}
              disabled={isLoading || sitesLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {(error || reduxError) && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg text-sm">
            {error || reduxError}
          </div>
        )}

        {/* Loading State */}
        {(isLoading || sitesLoading) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        )}

        {/* Summary Cards */}
        {!isLoading && !sitesLoading && (
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
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatNumber(totals.impressions)}
              </h3>
              <p className="text-gray-600 text-sm">Total Impressions</p>
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
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {!isLoading && !sitesLoading && (
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
        )}

        {/* Data Table */}
        {!isLoading && !sitesLoading && (
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
                        <div className="font-semibold text-gray-900">
                          {formatNumber(blog.clicks)}
                        </div>
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
                            onClick={() => window.open(blog.url, "_blank")}
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
        )}
      </div>
    </div>
  )
}

export default SearchConsole
