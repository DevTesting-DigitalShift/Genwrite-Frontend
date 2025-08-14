import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import { fetchGscAuthUrl, fetchGscAnalytics, clearAnalytics } from "@store/slices/gscSlice"
import { selectUser } from "@store/slices/authSlice"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Table,
  message,
  Select,
  Input,
  DatePicker,
  Tabs,
  Card,
  Dropdown,
  Menu,
  Empty,
} from "antd"
import { RefreshCw, LogIn, Search, Link, Edit, Download } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import Fuse from "fuse.js"
import moment from "moment"
import * as ExcelJS from "exceljs"
import { persistQueryClient } from "@tanstack/react-query-persist-client"

const { Option } = Select
const { RangePicker } = DatePicker
const { TabPane } = Tabs

// Configure TanStack Query persister for IndexedDB
const persister = {
  storage: window.indexedDB,
  key: "gsc-analytics-cache",
}

// Configure Fuse.js for frontend search
const fuseOptions = {
  keys: ["url", "query", "countryName", "blogTitle"],
  threshold: 0.3,
}

const SearchConsole = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("query")
  const [dateRange, setDateRange] = useState("7d")
  const [customDateRange, setCustomDateRange] = useState([moment().subtract(6, "days"), moment()])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [filterType, setFilterType] = useState("search")
  const [blogUrlFilter, setBlogUrlFilter] = useState("")
  const [blogTitleFilter, setBlogTitleFilter] = useState(null)
  // const [countryFilter, setCountryFilter] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [userCountry, setUserCountry] = useState(navigator.language.split("-")[1] || "US")
  const [pageSize, setPageSize] = useState(10)

  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const user = useSelector(selectUser)

  // Check if filters are applied for Reset Filters button styling
  const isFilterApplied = useMemo(() => {
    return (
      dateRange !== "7d" ||
      customDateRange[0] !== null ||
      customDateRange[1] !== null ||
      blogUrlFilter ||
      blogTitleFilter ||
      // countryFilter ||
      searchQuery ||
      pageSize !== 10
    )
  }, [
    dateRange,
    customDateRange,
    blogUrlFilter,
    blogTitleFilter,
    // countryFilter,
    searchQuery,
    pageSize,
  ])

  // Check authentication immediately on mount
  useEffect(() => {
    if (user?.gsc) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
      dispatch(clearAnalytics())
      queryClient.clear()
    }
  }, [user, dispatch, queryClient])

  // Persist TanStack Query cache to IndexedDB
  useEffect(() => {
    persistQueryClient({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24,
    })
  }, [queryClient])

  // Update session storage
  useEffect(() => {
    sessionStorage.setItem(
      "gscFilters",
      JSON.stringify({
        filterType,
        blogUrlFilter,
        blogTitleFilter,
        // countryFilter,
        userCountry,
      })
    )
  }, [filterType, blogUrlFilter, blogTitleFilter, userCountry])

  // Calculate date range for API request
  const getDateRangeParams = useCallback(() => {
    let from, to
    if (customDateRange[0] && customDateRange[1]) {
      from = customDateRange[0].startOf("day").format("YYYY-MM-DD")
      to = customDateRange[1].endOf("day").format("YYYY-MM-DD")
    } else {
      to = moment().endOf("day")
      from = moment().startOf("day")
      switch (dateRange) {
        case "7d":
          from = from.subtract(6, "days")
          break
        case "30d":
          from = from.subtract(29, "days")
          break
        case "180d":
          from = from.subtract(179, "days")
          break
        default:
          from = from.subtract(6, "days")
      }
      from = from.format("YYYY-MM-DD")
      to = to.format("YYYY-MM-DD")
    }
    return { from, to }
  }, [dateRange, customDateRange])

  // Determine dimensions
  const getDimensions = useCallback(() => {
    const dimensions = []
    if (activeTab === "query") dimensions.push("query", "page")
    else if (activeTab === "country") dimensions.push("country")
    else dimensions.push("page")
    return dimensions
  }, [activeTab])

  // TanStack Query for fetching analytics data
  const {
    data: blogData = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "gscAnalytics",
      activeTab,
      dateRange,
      customDateRange,
      // blogUrlFilter,
      // blogTitleFilter,
      // countryFilter,
    ],
    queryFn: async () => {
      const dimensions = getDimensions()
      const { from, to } = getDateRangeParams()
      const params = {
        from,
        to,
        query: JSON.stringify(dimensions),
        // ...(filterType === "blog" && blogUrlFilter && { blogUrl: blogUrlFilter }),
        // ...(blogTitleFilter && { blogTitle: blogTitleFilter }),
        // ...(countryFilter && activeTab === "country" && { country: countryFilter }),
      }
      const data = await dispatch(fetchGscAnalytics(params)).unwrap()
      return data.map((item, index) => ({
        id: `${item.page || item.query || item.country}-${index}`,
        url: item.page || "-",
        query: item.query ? item.query.replace(/["+\-!@#$%^&*()]/g, "") : "-",
        country: item.country || "-",
        countryName: item.countryName || "-",
        clicks: item.clicks || 0,
        impressions: item.impressions || 0,
        ctr: (item.ctr * 100).toFixed(2) || "0.00",
        position: item.position?.toFixed(1) || "-",
        blogTitle: item.blogTitle || "Untitled",
        blogId: item.blogId || "-",
      }))
    },
    enabled: isAuthenticated,
    // staleTime: 1000 * 60 * 30,
    // cacheTime: 1000 * 60 * 60,
    refetchOnMount: false, // 👈 Don't auto refetch when switching tabs
    retry: 1,
    onError: (err) => {
      setError(err.message || "Failed to fetch analytics data")
      if (err?.message?.includes("invalid_grant")) {
        setIsAuthenticated(false)
        dispatch(clearAnalytics())
        queryClient.clear()
      }
    },
  })

  // Extract unique countries and blog titles
  const countries = useMemo(() => {
    return [...new Set(blogData.map((item) => item.countryName).filter((c) => c !== "-"))]
  }, [blogData])

  const blogTitles = useMemo(() => {
    return [...new Set(blogData.map((item) => item.blogTitle).filter((t) => t !== "Untitled"))]
  }, [blogData])

  // Connect to Google Search Console
  const connectGSC = useCallback(async () => {
    try {
      setIsConnecting(true)
      const authUrl = await dispatch(fetchGscAuthUrl()).unwrap()
      const popup = window.open(authUrl, "GSC Connect", "width=600,height=600")
      if (!popup) {
        throw new Error("Popup blocked. Please allow popups and try again.")
      }
      const popupCheck = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheck)
          window.removeEventListener("message", handleMessage)
          if (!isAuthenticated) {
            setError("Authentication window closed without completing.")
            setIsConnecting(false)
          }
        }
      }, 1000)

      const expectedOrigin = new URL(import.meta.env.VITE_BACKEND_URL).origin
      const handleMessage = (event) => {
        if (event.origin !== expectedOrigin) return
        const status = event.data || {}
        if (status === "GSC Connected") {
          setIsAuthenticated(true)
          message.success("Google Search Console connected!")
          clearInterval(popupCheck) // ✅ stop checking
          // window.location.reload()
        } else {
          message.error(status || "Authentication failed")
          setError(status || "Authentication failed")
        }
        window.removeEventListener("message", handleMessage)
      }

      window.addEventListener("message", handleMessage)
    } catch (err) {
      message.error(err.message || "Failed to connect to Google Search Console")
      setError(err.message || "Connection failed")
      setIsConnecting(false)
    }
  }, [dispatch, isAuthenticated])

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key)
    // setCountryFilter(null)
    setSearchQuery("")
  }

  // Handle date range change
  const handleDateRangeChange = (value) => {
    setDateRange(value)
    setCustomDateRange([null, null])
    setError(null)
    setShowDatePicker(value === "custom")
    refetch()
  }

  // Handle custom date range change
  const handleCustomDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setCustomDateRange(dates)
      setDateRange("custom")
      refetch()
    } else {
      setError("Please select both start and end dates.")
    }
  }

  // Handle filter type change
  const handleFilterTypeChange = (value) => {
    setFilterType(value)
    setBlogUrlFilter("")
    setBlogTitleFilter("")
    setSearchQuery("")
    refetch()
  }

  // Handle blog URL filter change
  const handleBlogUrlChange = (value) => {
    setBlogUrlFilter(value)
    refetch()
  }

  // Handle blog title filter change
  const handleBlogTitleChange = (value) => {
    setBlogTitleFilter(value)
    // refetch()
  }

  // Handle country filter change
  const handleCountryFilterChange = (value) => {
    setCountryFilter(value)
    refetch()
  }

  // Handle search query change
  const handleSearch = (value) => {
    setSearchQuery(value)
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilterType("search")
    setBlogUrlFilter("")
    setBlogTitleFilter(null)
    // setCountryFilter("")
    setSearchQuery("")
    setDateRange("7d")
    setCustomDateRange([moment().subtract(6, "days"), moment()])
    setShowDatePicker(false)
    setPageSize(10)
    refetch()
  }

  // Filter data with Fuse.js
  const filteredData = useMemo(() => {
    let result = blogData
    if (filterType === "blog" && blogUrlFilter) {
      result = result.filter((item) => item.url === blogUrlFilter)
    }
    if (blogTitleFilter && activeTab !== "country") {
      result = result.filter((item) => item.blogTitle === blogTitleFilter)
    }
    // if (countryFilter && activeTab === "country") {
    //   result = result.filter((item) => item.countryName === countryFilter)
    // }
    if (searchQuery && filterType === "search") {
      const fuse = new Fuse(result, fuseOptions)
      result = fuse.search(searchQuery).map(({ item }) => item)
    }
    return result
  }, [blogData, filterType, blogUrlFilter, blogTitleFilter, searchQuery, activeTab])

  // Calculate metrics for mini cards
  const metrics = useMemo(() => {
    const totalClicks = filteredData.reduce((sum, item) => sum + item.clicks, 0)
    const totalImpressions = filteredData.reduce((sum, item) => sum + item.impressions, 0)
    const avgCtr =
      filteredData.length > 0
        ? (
            filteredData.reduce((sum, item) => sum + parseFloat(item.ctr), 0) / filteredData.length
          ).toFixed(2)
        : "0.00"
    const avgPosition =
      filteredData.length > 0
        ? (
            filteredData.reduce((sum, item) => sum + (parseFloat(item.position) || 0), 0) /
            filteredData.length
          ).toFixed(1)
        : "0"
    return { totalClicks, totalImpressions, avgCtr, avgPosition }
  }, [filteredData])

  // Table columns
  const getColumns = (tab) => {
    const baseColumns = [
      ...(tab === "page" && !blogTitleFilter
        ? [
            {
              title: "Blog Title",
              dataIndex: "blogTitle",
              key: "blogTitle",
              sorter: (a, b) => a.blogTitle.localeCompare(b.blogTitle),
              width: 200,
              render: (text) => <span className="font-medium text-gray-800">{text}</span>,
            },
          ]
        : []),
      ...(tab !== "page"
        ? [
            {
              title: tab === "query" ? "Query" : "Country",
              dataIndex: tab === "query" ? "query" : "countryName",
              key: tab,
              render: (text) => (
                <span className="text-gray-700">
                  {text.length > 50 ? `${text.substring(0, 47)}...` : text}
                </span>
              ),
              sorter: (a, b) =>
                a[tab === "query" ? "query" : "countryName"].localeCompare(
                  b[tab === "query" ? "query" : "countryName"]
                ),
              width: 250,
            },
          ]
        : []),
      {
        title: "Clicks",
        dataIndex: "clicks",
        key: "clicks",
        sorter: (a, b) => a.clicks - b.clicks,
        render: (clicks) => (
          <span className="text-blue-600 font-semibold">
            {new Intl.NumberFormat().format(clicks)}
          </span>
        ),
        width: 100,
      },
      {
        title: "Impressions",
        dataIndex: "impressions",
        key: "impressions",
        sorter: (a, b) => a.impressions - b.impressions,
        render: (impressions) => (
          <span className="text-blue-600 font-semibold">
            {new Intl.NumberFormat().format(impressions)}
          </span>
        ),
        width: 120,
      },
      {
        title: "CTR (%)",
        dataIndex: "ctr",
        key: "ctr",
        sorter: (a, b) => a.ctr - b.ctr,
        render: (ctr) => <span className="text-gray-700">{`${ctr}%`}</span>,
        width: 100,
      },
      {
        title: "Position",
        dataIndex: "position",
        key: "position",
        sorter: (a, b) => a.position - b.position,
        render: (position) => <span className="text-gray-700">{position}</span>,
        width: 100,
      },
      ...(tab === "page"
        ? [
            {
              title: "Actions",
              key: "actions",
              width: 100,
              render: (_, record) => (
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item key="go">
                        <a
                          href={record.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <Link className="w-4 h-4 mr-2" />
                          Go to Blog
                        </a>
                      </Menu.Item>
                      <Menu.Item key="edit">
                        <a
                          href={`${import.meta.env.VITE_FRONTEND_URL}/toolbox/${record.blogId}`}
                          target="_blank"
                          className="flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Blog
                        </a>
                      </Menu.Item>
                    </Menu>
                  }
                  trigger={["click"]}
                >
                  <Button
                    type="text"
                    icon={<Link className="w-4 h-4 text-gray-600 hover:text-blue-600" />}
                  />
                </Dropdown>
              ),
            },
          ]
        : []),
    ]
    return baseColumns
  }

  // Export to Excel using ExcelJS
  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Search Performance")

    const isPageTab = activeTab === "page"
    const isQueryTab = activeTab === "query"
    const isCountryTab = activeTab === "country"

    const columns = [
      ...(isPageTab && !blogTitleFilter
        ? [{ header: "Blog Title", key: "blogTitle", width: 30 }]
        : []),
      {
        header: isPageTab ? "Page" : isQueryTab ? "Query" : "Country",
        key: isPageTab ? "url" : isQueryTab ? "query" : "countryName",
        width: 50,
      },
      { header: "Clicks", key: "clicks", width: 15 },
      { header: "Impressions", key: "impressions", width: 15 },
      { header: "CTR (%)", key: "ctr", width: 10 },
      { header: "Position", key: "position", width: 10 },
    ]

    worksheet.columns = columns

    console.log("Columns:", worksheet.columns)

    filteredData.forEach((item, index) => {
      const rowData = {
        ...(isPageTab && !blogTitleFilter ? { blogTitle: item.blogTitle } : {}),
        ...(isPageTab ? { url: item.url } : {}),
        ...(isQueryTab ? { query: item.query } : {}),
        ...(isCountryTab ? { countryName: item.countryName } : {}),
        clicks: item.clicks,
        impressions: item.impressions,
        ctr: `${item.ctr}%`,
        position: item.position,
      }

      console.log(`Row ${index + 1}:`, rowData)
      worksheet.addRow(rowData)
    })

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F0F0F0" },
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `search_performance_${activeTab}_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-250px)] flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
          <FcGoogle size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Connect Google Search Console</h2>
          <p className="text-gray-600 mb-6">
            Link your Google Search Console account to view performance data.
          </p>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}
          <Button
            onClick={connectGSC}
            disabled={isConnecting}
            icon={<LogIn className="w-4 h-4 mr-2" />}
            type="primary"
            loading={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg h-10 text-base font-medium"
          >
            {isConnecting ? "Connecting..." : "Connect GSC"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Helmet>
        <title>Search Performance | GenWrite</title>
      </Helmet>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Search Performance</h1>
          <div className="flex gap-3 items-center">
            <Button
              icon={<Download className="w-4 h-4 mr-2" />}
              onClick={handleExport}
              disabled={isLoading}
              type="primary"
              className="bg-blue-600 hover:bg-blue-700 rounded-lg h-10 text-base font-medium"
            >
              Export
            </Button>
            <Button
              icon={<RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />}
              onClick={() => refetch()}
              disabled={isLoading}
              type="primary"
              className="bg-blue-600 hover:bg-blue-700 rounded-lg h-10 text-base font-medium"
            >
              Refresh
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card
            title={<span className="text-sm font-semibold text-gray-600">Total Clicks</span>}
            className="rounded-lg text-center p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow bg-gradient-to-br from-blue-100/70 to-blue-50/70"
          >
            <p className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat().format(metrics.totalClicks)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total clicks on filtered data</p>
          </Card>
          <Card
            title={<span className="text-sm font-semibold text-gray-600">Total Impressions</span>}
            className="rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow bg-gradient-to-br from-purple-100/70 to-purple-50/70"
            style={{ padding: "16px", textAlign: "center" }}
          >
            <p className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat().format(metrics.totalImpressions)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total impressions on filtered data</p>
          </Card>
          <Card
            title={<span className="text-sm font-semibold text-gray-600">Average CTR</span>}
            className="rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow bg-gradient-to-br from-teal-100/70 to-teal-50/70"
            style={{ padding: "16px", textAlign: "center" }}
          >
            <p className="text-2xl font-bold text-blue-600">{metrics.avgCtr}%</p>
            <p className="text-xs text-gray-500 mt-1">Average click-through rate</p>
          </Card>
          <Card
            title={<span className="text-sm font-semibold text-gray-600">Average Position</span>}
            className="rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow bg-gradient-to-br from-amber-100/70 to-amber-50/70"
            style={{ padding: "16px", textAlign: "center" }}
          >
            <p className="text-2xl font-bold text-blue-600">{metrics.avgPosition}</p>
            <p className="text-xs text-gray-500 mt-1">Average search result position</p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between w-full">
          <Select
            value={dateRange}
            onChange={handleDateRangeChange}
            className={`flex-1 max-w-36 ${dateRange ? "border-blue-500" : ""}`}
            placeholder="Select Date Range"
            style={{ borderRadius: "8px" }}
          >
            <Option value="7d">Last 7 Days</Option>
            <Option value="30d">Last 30 Days</Option>
            <Option value="180d">Last 6 Months</Option>
            <Option value="custom">Custom Range</Option>
          </Select>
          {showDatePicker && (
            <RangePicker
              value={customDateRange}
              onChange={handleCustomDateRangeChange}
              disabledDate={(current) => current && current > moment().endOf("day")}
              className={`flex-1 min-w-56 max-w- ${
                customDateRange[0] && customDateRange[1] ? "border-blue-500" : ""
              }`}
              placeholder={["Start Date", "End Date"]}
              allowEmpty={[false, false]}
              style={{ borderRadius: "8px" }}
            />
          )}
          <div className="relative flex-1 min-w-[200px] max-w-1/2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search title, query, or country"
              className={`pl-9 pr-4 py-1 w-full bg-white border ${
                searchQuery ? "border-blue-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
            />
          </div>
          {activeTab !== "country" && (
            <Select
              value={blogTitleFilter}
              onChange={handleBlogTitleChange}
              className={`flex-1 min-w-[200px] ${blogTitleFilter ? "border-blue-500" : ""}`}
              placeholder="Select Blog Title"
              allowClear
              style={{ borderRadius: "8px" }}
            >
              {blogTitles.map((title) => (
                <Option key={title} value={title}>
                  {title}
                </Option>
              ))}
            </Select>
          )}
          {/* {activeTab === "country" && (
            <Select
              value={countryFilter}
              onChange={handleCountryFilterChange}
              className={`flex-1 min-w-[140px] ${countryFilter ? "border-blue-500" : ""}`}
              placeholder="Select Country"
              allowClear
              style={{ borderRadius: "8px" }}
            >
              {countries.map((countryName) => (
                <Option key={countryName} value={countryName}>
                  {countryName}
                </Option>
              ))}
            </Select>
          )} */}
          <Select
            value={pageSize}
            onChange={(value) => setPageSize(value)}
            className="flex-1 max-w-[100px]"
            placeholder="Rows per page"
            style={{ borderRadius: "8px" }}
          >
            <Option value={10}>10 rows</Option>
            <Option value={25}>25 rows</Option>
            <Option value={50}>50 rows</Option>
            <Option value={100}>100 rows</Option>
          </Select>
          <Button
            onClick={handleResetFilters}
            type="default"
            className={`flex-1 max-w-36 rounded-lg h-10 text-base font-medium text-gray-700 ${
              isFilterApplied
                ? "bg-blue-100 hover:bg-blue-200 border-blue-300"
                : "bg-gray-100 hover:bg-gray-200 border-gray-300"
            }`}
          >
            Reset Filters
          </Button>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center border border-red-200">
          <span>{error}</span>
          {error.includes("invalid_grant") && (
            <Button
              onClick={connectGSC}
              className="ml-4"
              type="link"
              icon={<LogIn className="w-4 h-4 mr-2 text-blue-600" />}
            >
              Reconnect GSC
            </Button>
          )}
        </div>
      )}
      {blogTitleFilter && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Showing data for: <span className="text-blue-600">{blogTitleFilter}</span>
          </h2>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Tabs
          items={[
            { key: "query", label: "Queries" },
            { key: "page", label: "Pages" },
            { key: "country", label: "Countries", disabled: Boolean(blogTitleFilter) },
          ].map((item) => ({
            key: item.key,
            label: <span className="text-base font-medium">{item.label}</span>,
            disabled: item?.disabled || false,
            children: (
              <Table
                columns={getColumns(item.key)}
                dataSource={filteredData}
                rowKey="id"
                pagination={{
                  pageSize,
                  showSizeChanger: false,
                  showTotal: (total) => `Total ${total} results`,
                }}
                loading={isLoading}
                locale={{
                  emptyText: error ? (
                    `Error: ${error}. Please try refreshing or reconnecting GSC.`
                  ) : (
                    <Empty />
                  ),
                }}
                className="custom-table"
              />
            ),
          }))}
          defaultActiveKey="query"
          activeKey={activeTab}
          onChange={handleTabChange}
          className="custom-tabs"
          tabBarStyle={{
            background: "#f8fafc",
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            margin: 0,
          }}
        ></Tabs>
      </div>
      <style jsx>{`
        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 16px;
        }
        .custom-table .ant-table-row:hover {
          background: #f9fafb;
        }
        .custom-table .ant-table-row {
          border-bottom: 1px solid #e5e7eb;
        }
        .custom-table .ant-table-cell {
          padding: 12px 16px;
        }
        .ant-select-selector,
        .ant-picker,
        .ant-input-search .ant-input {
          border-radius: 8px !important;
          border: 1px solid #d1d5db !important;
          box-shadow: none !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ant-select-selector:hover,
        .ant-picker:hover,
        .ant-input-search .ant-input:hover {
          border-color: #1a73e8 !important;
        }
        .ant-select-selector:focus,
        .ant-picker:focus,
        .ant-input-search .ant-input:focus {
          border-color: #1a73e8 !important;
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1) !important;
        }
        .border-blue-500 .ant-select-selector,
        .border-blue-500 .ant-picker,
        .border-blue-500 .ant-input {
          border-color: #1a73e8 !important;
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1) !important;
        }
        .ant-tabs-nav {
          margin: 0 !important;
        }
        .ant-tabs-tab {
          padding: 12px 24px !important;
          margin: 0 !important;
          border-radius: 8px 8px 0 0 !important;
          transition: background-color 0.2s, color 0.2s !important;
        }
        .ant-tabs-tab:hover {
          background: #e5e7eb !important;
          color: #1a73e8 !important;
        }
        .ant-tabs-tab-active {
          background: #ffffff !important;
          border-bottom: 2px solid #1a73e8 !important;
          font-weight: 600 !important;
          color: #1a73e8 !important;
        }
        .ant-tabs-ink-bar {
          background: #1a73e8 !important;
          height: 2px !important;
        }
        .ant-card {
          border-radius: 8px !important;
        }
        .ant-card-head {
          border-bottom: none !important;
          padding: 12px 16px !important;
        }
        .ant-card-body {
          padding: 16px !important;
        }
        .ant-btn-primary,
        .ant-btn-default {
          border-radius: 8px !important;
          height: 40px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
        }
        .ant-btn-primary:hover,
        .ant-btn-default:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .ant-table-pagination {
          padding: 16px !important;
        }
        .ant-dropdown-menu {
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        .ant-dropdown-menu-item:hover {
          background: #f9fafb !important;
          color: #1a73e8 !important;
        }import default from './../../postcss.config';

      `}</style>
    </div>
  )
}

export default SearchConsole
