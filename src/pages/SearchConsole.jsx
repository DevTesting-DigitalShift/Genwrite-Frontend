import { useState, useMemo, useEffect } from "react"
import {
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  BarChart3,
  ExternalLink,
  RefreshCw,
  LogIn,
  Link,
  Download,
} from "lucide-react"
import { Helmet } from "react-helmet"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { fetchVerifiedSites, connectGscAccount, fetchGscAuthUrl } from "@store/slices/gscSlice"
import { message, Button, Spin, Table, Tag, Select, Input, Tooltip } from "antd"
import { useNavigate, useSearchParams } from "react-router-dom"
import axiosInstance from "@api/index"
import Loading from "@components/Loading"
import * as XLSX from "xlsx"
import { fetchAllBlogs } from "@store/slices/blogSlice"
import UpgradeModal from "@components/UpgradeModal"
import { selectUser } from "@store/slices/authSlice"

const { Option } = Select
const { Search: AntSearch } = Input

const SearchConsole = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [dateRange, setDateRange] = useState("30d")
  const [selectedBlog, setSelectedBlog] = useState("all") // New state for selected blog
  const [blogData, setBlogData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const { blogs } = useSelector((state) => state.blog)
  const {
    verifiedSites,
    loading: sitesLoading,
    error: reduxError,
  } = useSelector((state) => state.gsc)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  if (userPlan === "free" || userPlan === "basic") {
    return <UpgradeModal featureName={"Google Search Console"} />
  }

  useEffect(() => {
    dispatch(fetchAllBlogs())
  }, [dispatch])

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
      if (!result) {
        throw new Error("Failed to retrieve authentication URL")
      }
      const popup = window.open(result, "GSC Connect", "width=600,height=600")
      if (!popup) {
        throw new Error("Popup blocked. Please allow popups and try again.")
      }

      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return
        const { code, state, error: popupError } = event.data
        if (popupError) {
          message.error(popupError || "Authentication failed")
          setIsConnecting(false)
          window.removeEventListener("message", handleMessage)
          return
        }
        if (code && state) {
          try {
            await dispatch(connectGscAccount({ code, state })).unwrap()
            message.success("Google Search Console connected successfully!")
            dispatch(fetchVerifiedSites())
            navigate("/search-console", { replace: true })
          } catch (err) {
            message.error(err.message || "Failed to connect GSC account")
            console.error("GSC connection error:", err)
          } finally {
            setIsConnecting(false)
            window.removeEventListener("message", handleMessage)
          }
        }
      }

      window.addEventListener("message", handleMessage)

      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed)
          setIsConnecting(false)
          window.removeEventListener("message", handleMessage)
          message.warning("Authentication canceled")
        }
      }, 1000)
    } catch (err) {
      message.error(err.message || "Failed to initiate GSC connection")
      console.error("GSC auth error:", err)
      setIsConnecting(false)
    }
  }

  // Handle OAuth callback
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
          message.error(err.message || "Failed to connect GSC account")
          console.error("OAuth callback error:", err)
        } finally {
          setIsConnecting(false)
        }
      }
      connect()
    }
  }, [searchParams, dispatch, setSearchParams])

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!verifiedSites.length) {
      setError("No verified sites found. Please connect your Google Search Console account.")
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const { from, to } = getDateRangeParams()
      const blogDataPromises = verifiedSites.map(async (site) => {
        try {
          const siteUrl = site.siteUrl
          if (!siteUrl) {
            throw new Error(`Invalid site URL for site: ${JSON.stringify(site)}`)
          }
          const params = {
            siteUrl,
            from,
            to,
            dimensions: ["page", "query"],
          }
          // Add blogUrl to params if a specific blog is selected
          if (selectedBlog !== "all") {
            params.blogUrl = selectedBlog
          }
          const response = await axiosInstance.get("/gsc/sites-data", {
            params,
            timeout: 30000,
          })

          if (!response.data?.data?.rows) {
            throw new Error("No analytics data returned from API")
          }

          const analyticsRows = response.data.data.rows || []
          return analyticsRows.map((row, index) => ({
            id: `${siteUrl}-${index}`,
            url: row?.keys[0] || "",
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr ? (row.ctr * 100).toFixed(2) : 0,
            position: row.position ? row.position.toFixed(1) : 0,
            keywords: row.keys?.length > 1 ? row.keys.slice(1) : [],
            publishDate: new Date().toISOString().split("T")[0],
          }))
        } catch (siteError) {
          console.error(`Error fetching data for site ${site.siteUrl}:`, siteError)
          return []
        }
      })

      const allBlogData = (await Promise.allSettled(blogDataPromises))
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value)

      setBlogData(allBlogData)
    } catch (err) {
      console.error("Error fetching analytics data:", err)
      let errorMessage = "Failed to load analytics data. Please try again."
      if (err.response) {
        switch (err.response.status) {
          case 403:
            errorMessage =
              "You do not have access to one or more sites. Please reconnect your GSC account."
            break
          case 400:
            errorMessage = "Invalid query parameters. Please check your input."
            break
          case 429:
            errorMessage = "Rate limit exceeded. Please try again later."
            break
          case 500:
            errorMessage = "Server error. Please try again later or contact support."
            break
          default:
            errorMessage = err.response.data?.error || errorMessage
        }
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your network and try again."
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Export data as Excel
  const handleExport = async () => {
    if (!blogData.length) {
      message.warning("No data to export")
      return
    }
    try {
      const headers = [
        "Keywords",
        "Clicks",
        "Impressions",
        "CTR (%)",
        "Avg Position",
        "URL",
        "Publish Date",
      ]

      const rows = blogData.map((blog) => ({
        Keywords:
          Array.isArray(blog.keywords) && blog.keywords.length > 1
            ? blog.keywords.slice(1).join(", ")
            : blog.keywords.join(", "),
        Clicks: blog.clicks,
        Impressions: blog.impressions,
        "CTR (%)": blog.ctr,
        "Avg Position": blog.position,
        URL: blog.url,
        "Publish Date": blog.publishDate,
      }))

      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Search Console Data")
      const fileName = `search_console_data_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
      message.success("Data exported successfully")
    } catch (err) {
      console.error("Error exporting data:", err)
      message.error("Failed to export data. Please try again.")
    }
  }

  // Fetch verified sites and analytics data
  useEffect(() => {
    dispatch(fetchVerifiedSites())
  }, [dispatch])

  // Calculate totals for summary cards
  const totals = useMemo(() => {
    return blogData.reduce(
      (acc, blog) => ({
        clicks: acc.clicks + Number(blog.clicks || 0),
        impressions: acc.impressions + Number(blog.impressions || 0),
        avgCtr:
          blogData.length > 0
            ? blogData.reduce((sum, b) => sum + Number(b.ctr || 0), 0) / blogData.length
            : 0,
        avgPosition:
          blogData.length > 0
            ? blogData.reduce((sum, b) => sum + Number(b.position || 0), 0) / blogData.length
            : 0,
      }),
      { clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0 }
    )
  }, [blogData])

  // Filtering logic for table
  const filteredData = useMemo(() => {
    return blogData.filter((blog) => {
      if (!blog) return false
      const matchesSearch =
        (blog.blogName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (blog.keywords || []).some((keyword) =>
          (keyword || "").toLowerCase().includes(searchTerm.toLowerCase())
        )
      const matchesCategory = filterCategory === "all" || blog.category === filterCategory
      const matchesStatus = filterStatus === "all" || blog.status === filterStatus
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [blogData, searchTerm, filterCategory, filterStatus])

  const categories = [
    "all",
    ...Array.from(new Set(blogData.map((blog) => blog.category || "Uncategorized"))),
  ]
  const statuses = ["all", "published", "draft", "archived"]

  // Get unique blog URLs for selection
  const blogUrls = useMemo(() => {
    const urls = new Set(
      blogs.filter((blog) => blog?.taskStatus?.wordpress === "done").map((blog) => blog.title)
    )
    return ["all", ...urls]
  }, [blogs])

  // Ant Design Table Columns
  const columns = [
    {
      title: "Keywords",
      dataIndex: "keywords",
      key: "keywords",
      render: (keywords) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {keywords.slice(0, 3).map((keyword, idx) => (
            <Tag key={idx} color="blue">
              {keyword}
            </Tag>
          ))}
          {keywords.length > 3 && <Tag color="default">+{keywords.length - 3} more</Tag>}
        </div>
      ),
    },
    {
      title: "Clicks",
      dataIndex: "clicks",
      key: "clicks",
      sorter: (a, b) => a.clicks - b.clicks,
      render: (clicks) => (
        <div className="font-semibold text-gray-900">{new Intl.NumberFormat().format(clicks)}</div>
      ),
      align: "center",
    },
    {
      title: "Impressions",
      dataIndex: "impressions",
      key: "impressions",
      sorter: (a, b) => a.impressions - b.impressions,
      render: (impressions) => (
        <div className="font-semibold text-gray-900">
          {new Intl.NumberFormat().format(impressions)}
        </div>
      ),
      align: "center",
    },
    {
      title: "CTR",
      dataIndex: "ctr",
      key: "ctr",
      sorter: (a, b) => a.ctr - b.ctr,
      render: (ctr) => (
        <div
          className={`font-semibold ${
            ctr >= 8 ? "text-green-600" : ctr >= 5 ? "text-yellow-600" : "text-red-600"
          }`}
        >
          {ctr}%
        </div>
      ),
      align: "center",
    },
    {
      title: "Avg Position",
      dataIndex: "position",
      key: "position",
      sorter: (a, b) => a.position - b.position,
      render: (position) => (
        <div
          className={`font-semibold ${
            position <= 3 ? "text-green-600" : position <= 10 ? "text-yellow-600" : "text-red-600"
          }`}
        >
          {position}
        </div>
      ),
      align: "center",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <Tooltip title={record.url}>
            <Button
              type="text"
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={() => window.open(record.url, "_blank")}
              disabled={!record.url}
              title="View Blog"
            />
          </Tooltip>
        </div>
      ),
      align: "center",
    },
  ]

  // Format number helper
  const formatNumber = (num) => new Intl.NumberFormat().format(num)

  // GSC Connection UI
  if (sitesLoading) {
    return <Loading />
  }

  if (!verifiedSites.length || error?.includes("No verified sites found")) {
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
              <div className="mt-2">
                <Button type="link" onClick={connectGSC} disabled={isConnecting}>
                  Try Reconnecting
                </Button>
              </div>
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
            <Select value={dateRange} onChange={(value) => setDateRange(value)} className="w-32">
              <Option value="7d">Last 7 days</Option>
              <Option value="30d">Last 30 days</Option>
              <Option value="90d">Last 90 days</Option>
              <Option value="1y">Last year</Option>
            </Select>
            <Button
              icon={<Download className="w-4 h-4" />}
              onClick={handleExport}
              disabled={isLoading || sitesLoading}
              className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
            >
              Export
            </Button>
            <Button
              icon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />}
              onClick={fetchAnalyticsData}
              disabled={isLoading || sitesLoading}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && !error.includes("No verified sites found") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 text-red-800 p-4 rounded-lg text-sm"
          >
            {error}
            {(error.includes("reconnect") || error.includes("unauthorized_client")) && (
              <div className="mt-2">
                <Button type="link" onClick={connectGSC} disabled={isConnecting}>
                  Reconnect GSC
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && <Loading />}

        {/* Summary Cards */}
        {!isLoading && (
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
        {!isLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
            <div className="flex flex-col lg:flex-row gap-4">
              <AntSearch
                placeholder="Search blogs or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<Search className="w-5 h-5 text-gray-400 mr-2" />}
              />
              <Select
                value={selectedBlog}
                onChange={(value) => setSelectedBlog(value)}
                className="w-2/3"
                placeholder="Select Blog"
              >
                {blogUrls.map((url) => (
                  <Option key={url} value={url}>
                    {url === "all" ? "All Blogs" : url}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: itemsPerPage,
              total: filteredData.length,
              onChange: (page, pageSize) => {
                setCurrentPage(page)
                setItemsPerPage(pageSize)
              },
              pageSizeOptions: [10, 20, 50, 100],
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} results`,
            }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100"
            locale={{
              emptyText: "No data available. Try adjusting your filters or refreshing the data.",
            }}
          />
        )}
      </div>
    </div>
  )
}

export default SearchConsole
