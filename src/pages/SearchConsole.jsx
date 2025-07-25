import React, { useState, useMemo, useCallback, useEffect } from "react"
import {
  Search,
  TrendingUp,
  Eye,
  MousePointer,
  BarChart3,
  ExternalLink,
  RefreshCw,
  LogIn,
  Download,
  RotateCcw,
  X,
  TrendingDown,
} from "lucide-react"
import { Helmet } from "react-helmet"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchVerifiedSites,
  connectGscAccount,
  fetchGscAuthUrl,
  fetchGscAnalytics,
  clearAnalytics,
} from "@store/slices/gscSlice"
import { message, Button, Table, Tag, Select, Input, Tooltip, DatePicker, Switch } from "antd"
import { useNavigate, useSearchParams } from "react-router-dom"
import Loading from "@components/Loading"
import * as XLSX from "xlsx"
import { fetchAllBlogs } from "@store/slices/blogSlice"
import { selectUser } from "@store/slices/authSlice"
import UpgradeModal from "@components/UpgradeModal"
import moment from "moment"
import { FcGoogle } from "react-icons/fc"

const { Option } = Select
const { Search: AntSearch } = Input
const { RangePicker } = DatePicker

const SearchConsole = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [dateRange, setDateRange] = useState("30d")
  const [customDateRange, setCustomDateRange] = useState([null, null])
  const [selectedBlog, setSelectedBlog] = useState("all")
  const [selectedCountries, setSelectedCountries] = useState([])
  const [includeCountry, setIncludeCountry] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [blogData, setBlogData] = useState([])

  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const userPlan = (user?.plan || user?.subscription?.plan || "free").toLowerCase()
  const { blogs } = useSelector((state) => state.blog)
  const { analyticsData, loading: sitesLoading, error } = useSelector((state) => state.gsc)
  const navigate = useNavigate()

  // Fetch blogs on mount
  useEffect(() => {
    dispatch(fetchAllBlogs())
  }, [dispatch])

  // Calculate date range for API request
  const getDateRangeParams = useCallback(() => {
    let from, to
    if (customDateRange[0] && customDateRange[1]) {
      from = customDateRange[0].startOf("day").toISOString().split("T")[0]
      to = customDateRange[1].endOf("day").toISOString().split("T")[0]
    } else {
      to = new Date()
      from = new Date()
      switch (dateRange) {
        case "7d":
          from.setDate(to.getDate() - 7)
          break
        case "30d":
          from.setDate(to.getDate() - 30)
          break
        case "180d":
          from.setDate(to.getDate() - 180)
          break
        default:
          from.setDate(to.getDate() - 30)
      }
      from = from.toISOString().split("T")[0]
      to = to.toISOString().split("T")[0]
    }
    return { from, to }
  }, [dateRange, customDateRange])

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(
    async (search = "") => {
      setIsLoading(true)
      try {
        const { from, to } = getDateRangeParams()
        const params = {
          from,
          to,
          includeCountry,
          ...(search && { searchTerm: search }),
          ...(selectedBlog !== "all" && { blogUrl: selectedBlog }),
          ...(includeCountry &&
            selectedCountries.length > 0 && {
              countryCodes: selectedCountries,
            }),
        }
        const data = await dispatch(fetchGscAnalytics(params)).unwrap()
        setBlogData(
          data.map((item, index) => ({
            id: `${item.link}-${index}`,
            url: item.link,
            clicks: item.clicks,
            impressions: item.impressions,
            ctr: (item.ctr * 100).toFixed(2),
            position: item.position.toFixed(1),
            keywords: [item.key].map((k) => (k.length > 50 ? `${k.substring(0, 47)}...` : k)),
            countryCode: item.countryCode || "N/A",
            countryName: item.countryName || "N/A",
            blogId: item.blogId,
            blogTitle: item.blogTitle,
          }))
        )
      } catch (err) {
        const errorMessage = err.message || err.error || "Failed to fetch analytics data"
        message.error(errorMessage)
        console.error("Error fetching analytics data:", err)
        setBlogData([])
      } finally {
        setIsLoading(false)
      }
    },
    [
      dispatch,
      dateRange,
      customDateRange,
      selectedBlog,
      selectedCountries,
      includeCountry,
      getDateRangeParams,
    ]
  )

  // Google Search Console authentication
  const connectGSC = useCallback(async () => {
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
        if (typeof event.data === "string" && event.data === "GSC Connected") {
          try {
            setIsAuthenticated(true)
            await dispatch(fetchVerifiedSites()).unwrap()
            message.success("Google Search Console connected successfully!")
            await fetchAnalyticsData()
            navigate("/blog-performance", { replace: true })
          } catch (err) {
            const errorMessage = err.message || err.error || "Failed to verify GSC connection"
            message.error(errorMessage)
            console.error("GSC verification error:", err)
          } finally {
            setIsConnecting(false)
            window.removeEventListener("message", handleMessage)
          }
        } else if (typeof event.data === "string") {
          message.error(event.data || "Authentication failed")
          setIsConnecting(false)
          window.removeEventListener("message", handleMessage)
        }
      }

      window.addEventListener("message", handleMessage)

      const checkPopupClosed = setInterval(() => {
        if (popup.closed && !isAuthenticated) {
          clearInterval(checkPopupClosed)
          setIsConnecting(false)
          window.removeEventListener("message", handleMessage)
          message.warning("Authentication canceled")
        }
      }, 1000)

      return () => {
        window.removeEventListener("message", handleMessage)
        clearInterval(checkPopupClosed)
      }
    } catch (err) {
      const errorMessage = err.message || err.error || "Failed to initiate GSC connection"
      message.error(errorMessage)
      console.error("GSC auth error:", err)
      setIsConnecting(false)
    }
  }, [dispatch, navigate, fetchAnalyticsData, isAuthenticated])

  // Clear search params
  useEffect(() => {
    if (searchParams.get("code") || searchParams.get("state")) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (user?.gsc) {
      fetchAnalyticsData()
    }
    return () => {
      dispatch(clearAnalytics())
    }
  }, [fetchAnalyticsData, user, dispatch])

  // Handle search trigger
  const handleSearch = (value) => {
    if (value.trim() !== "") {
      setCurrentPage(1)
      fetchAnalyticsData()
    }
  }

  // Reset all filters
  const resetAllFilters = () => {
    setSearchTerm("")
    setSelectedBlog("all")
    setSelectedCountries([])
    setIncludeCountry(true)
    setCustomDateRange([null, null])
    setDateRange("30d")
    setCurrentPage(1)
    fetchAnalyticsData()
  }

  // Check if filters are active
  const isDefaultDateRange = dateRange === "30d" && !customDateRange[0]
  const hasActiveFilters =
    searchTerm || selectedBlog !== "all" || selectedCountries.length > 0 || !isDefaultDateRange

  // Get blog title from URL
  const getBlogTitle = (blogUrl) => {
    if (blogUrl === "all") return "All Blogs"
    const blog = blogs.data?.find((b) => (b.url || b.title) === blogUrl)
    return blog?.title || blogUrl
  }

  // Export data as Excel
  const handleExport = useCallback(async () => {
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
        "Blog Title",
        "URL",
        ...(includeCountry ? ["Country"] : []),
      ]
      const rows = blogData.map((blog) => ({
        Keywords: Array.isArray(blog.keywords) ? blog.keywords.join(", ") : blog.keywords,
        Clicks: blog.clicks,
        Impressions: blog.impressions,
        "CTR (%)": blog.ctr,
        "Avg Position": blog.position,
        URL: blog.url,
        "Blog Title": blog.blogTitle,
        ...(includeCountry ? { Country: blog.countryName } : {}),
      }))
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Search Console Data")
      const fileName = `search_console_data_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
      message.success("Data exported successfully")
    } catch (err) {
      const errorMessage = err.message || err.error || "Failed to export data"
      message.error(errorMessage)
      console.error("Error exporting data:", err)
    }
  }, [blogData, includeCountry])

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

  // Get unique countries for filter
  const countries = useMemo(() => {
    const countrySet = new Set(blogData.map((blog) => blog.countryCode).filter(Boolean))
    return [...countrySet]
  }, [blogData])

  // Get unique blog URLs for selection
  const blogUrls = useMemo(() => {
    const seen = new Set()
    const uniqueTitles = []

    for (const item of analyticsData) {
      const title = item.blogTitle
      if (!seen.has(title)) {
        seen.add(title)
        uniqueTitles.push(title)
      }
    }

    return ["all", ...uniqueTitles]
  }, [analyticsData])

  // Ant Design Table Columns
  const columns = [
    {
      title: "Blog Title",
      dataIndex: "blogTitle",
      key: "blogTitle",
      render: (blogTitle) => <div className="font-medium">{blogTitle}</div>,
      sorter: (a, b) => a.blogTitle.localeCompare(b.blogTitle),
    },
    {
      title: "Keywords",
      dataIndex: "keywords",
      key: "keywords",
      render: (keywords) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {keywords.slice(0, 3).map((keyword, idx) => (
            <Tooltip key={idx} title={keyword.length > 50 ? keyword : null}>
              <Tag color="blue">{keyword}</Tag>
            </Tooltip>
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
    ...(includeCountry
      ? [
          {
            title: "Country",
            dataIndex: "countryName",
            key: "countryName",
            render: (countryName, record) =>
              countryName === "N/A" ? "N/A" : `${countryName} (${record.countryCode})`,
            sorter: (a, b) => a.countryName.localeCompare(b.countryName),
            filters: countries.map((country) => ({
              text: country === "N/A" ? "N/A" : country,
              value: country,
            })),
            onFilter: (value, record) => record.countryCode === value,
            filterMultiple: true,
            onFilterDropdownVisibleChange: (visible) => {
              if (!visible && selectedCountries.length > 0) {
                fetchAnalyticsData()
              }
            },
          },
        ]
      : []),
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

  // Render UpgradeModal if user is on free or basic plan
  if (userPlan === "free" || userPlan === "basic") {
    return <UpgradeModal featureName={"Google Search Console"} />
  }

  if (!user?.gsc && !error?.includes("No data found")) {
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
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <FcGoogle size={40} />
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
        <title>Blog Performance | GenWrite</title>
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
              Blog Performance
            </motion.h1>
            <p className="text-gray-600">Monitor your blog performance and search analytics</p>
          </div>
          <div className="flex items-center gap-3">
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
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="flex-1 flex items-center gap-2">
                <AntSearch
                  placeholder="Search by URL, keywords, or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onSearch={handleSearch}
                  enterButton={<Search className="w-5 h-5 text-white" />}
                  suffix={
                    searchTerm && (
                      <span
                        onClick={() => setSearchTerm("")}
                        className="cursor-pointer text-gray-400 text-xs transition"
                      >
                        <X className="w-4 h-4" />
                      </span>
                    )
                  }
                  className={`w-full ${searchTerm ? "border-orange-400 shadow-orange-100" : ""}`}
                />
              </div>

              {/* Blog Selector */}
              <div className="flex-1">
                <Select
                  value={selectedBlog}
                  onChange={(value) => {
                    setSelectedBlog(value)
                    setCurrentPage(1)
                    fetchAnalyticsData()
                  }}
                  className="w-full"
                  placeholder="Select Blog"
                  suffixIcon={<span>Blog: {getBlogTitle(selectedBlog)}</span>}
                >
                  {blogUrls.map((url) => (
                    <Option key={url} value={url}>
                      {url === "all" ? "All Blogs" : url}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Date Range Picker */}
              <div className="flex-1">
                <RangePicker
                  value={customDateRange}
                  onChange={(dates) => {
                    setCustomDateRange(dates)
                    setCurrentPage(1)
                    fetchAnalyticsData()
                  }}
                  disabledDate={(current) => current && current > moment().endOf("day")}
                  className="w-full"
                  placeholder={["Start Date", "End Date"]}
                />
              </div>

              {/* Date Selector */}
              <div className="w-fit">
                <Select
                  value={customDateRange[0] ? "custom" : dateRange}
                  onChange={(value) => {
                    setDateRange(value)
                    setCustomDateRange([null, null])
                    setCurrentPage(1)
                    fetchAnalyticsData()
                  }}
                >
                  <Option value="7d">Last 7 Days</Option>
                  <Option value="30d">Last 30 Days</Option>
                  <Option value="180d">Last 6 Months</Option>
                </Select>
              </div>

              {/* Country Switch */}
              <div className="flex-2 flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Include Country</label>
                <Switch
                  checked={includeCountry}
                  onChange={(checked) => {
                    setIncludeCountry(checked)
                    if (!checked) setSelectedCountries([])
                    setCurrentPage(1)
                    fetchAnalyticsData()
                  }}
                  className={`w-fit ${includeCountry ? "bg-blue-600" : "bg-gray-200"}`}
                />
              </div>

              {/* Reset Button */}
              <div className="flex-2">
                <Button
                  icon={<RotateCcw className="w-4 h-4" />}
                  onClick={resetAllFilters}
                  className={`w-full flex items-center gap-2 ${
                    hasActiveFilters ? "border-red-400 bg-red-50 text-red-600" : ""
                  }`}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && (
          <Table
            columns={columns}
            dataSource={blogData}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: itemsPerPage,
              total: blogData.length,
              onChange: (page, pageSize) => {
                setCurrentPage(page)
                setItemsPerPage(pageSize)
                fetchAnalyticsData()
              },
              pageSizeOptions: [10, 20, 50, 100],
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} results`,
            }}
            onChange={(pagination, filters) => {
              setSelectedCountries(filters.countryName || [])
              setCurrentPage(pagination.current)
              setItemsPerPage(pagination.pageSize)
            }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100"
            locale={{
              emptyText: error
                ? `Error: ${error}. Please try refreshing or reconnecting GSC.`
                : "No data available. Try adjusting your filters or refreshing the data.",
            }}
          />
        )}
      </div>

      {/* Custom CSS for Select highlighting */}
      <style jsx>{`
        .ant-select-highlighted-green .ant-select-selector {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1) !important;
        }
        .ant-select-highlighted-purple .ant-select-selector {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1) !important;
        }
        .ant-select-highlighted-indigo .ant-select-selector {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
        }
      `}</style>
    </div>
  )
}

export default SearchConsole
