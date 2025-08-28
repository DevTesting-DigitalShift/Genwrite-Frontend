import { useState, useEffect, useCallback, useMemo } from "react"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import { fetchGscAnalytics, clearAnalytics } from "@store/slices/gscSlice"
import { selectUser } from "@store/slices/authSlice"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, message, Select, DatePicker, Card } from "antd"
import { RefreshCw, Search, Download } from "lucide-react"
import Fuse from "fuse.js"
import dayjs from "dayjs"
import * as ExcelJS from "exceljs"
import "@pages/SearchConsole/searchConsole.css"
import GSCLogin from "@pages/SearchConsole/GSCLogin"
import GSCAnalyticsTabs from "@pages/SearchConsole/GSCAnalyticsTabs"
import clsx from "clsx"

const { Option } = Select
const { RangePicker } = DatePicker

// Configure Fuse.js for frontend search
const fuseOptions = {
  keys: ["url", "query", "countryName", "blogTitle"],
  threshold: 0.3,
}

const SearchConsole = () => {
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("query")
  const [dateRange, setDateRange] = useState("7d")
  const [customDateRange, setCustomDateRange] = useState([dayjs().subtract(6, "days"), dayjs()])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [filterType, setFilterType] = useState("search")
  const [blogUrlFilter, setBlogUrlFilter] = useState(null)
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
    if (!user?.gsc) {
      dispatch(clearAnalytics())
      queryClient.clear()
    }
  }, [user, dispatch, queryClient])

  // Persist TanStack Query cache to IndexedDB
  // useEffect(() => {
  //   persistQueryClient({
  //     queryClient,
  //     persister,
  //     maxAge: 1000 * 60 * 60 * 24,
  //   })
  // }, [queryClient])

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
      to = dayjs().endOf("day")
      from = dayjs().startOf("day")
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
    const dimensions = ["page"]
    if (activeTab === "query") dimensions.push("query")
    else if (activeTab === "country") dimensions.push("country")
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
    enabled: !!user?.gsc,
    // staleTime: 1000 * 60 * 30,
    // cacheTime: 1000 * 60 * 60,
    retry: 1,
    onError: (err) => {
      setError(err.message || "Failed to fetch analytics data")
      if (err?.message?.includes("invalid_grant")) {
        message.error("Your Google Search Console session has expired. Please reconnect.")
        dispatch(clearAnalytics())
        queryClient.clear()
      }
    },
  })

  const blogTitles = useMemo(() => {
    return [...new Set(blogData.map((item) => item.blogTitle).filter((t) => t !== "Untitled"))]
  }, [blogData])

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

  // Handle blog title filter change
  const handleBlogTitleChange = (value) => {
    setBlogTitleFilter(value)
    // refetch()
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
    setCustomDateRange([dayjs().subtract(6, "days"), dayjs()])
    setShowDatePicker(false)
    setPageSize(10)
    refetch()
  }

  const aggregateData = (data) => {
    const grouped = {}

    data.forEach((row) => {
      // Group by country (code) or countryName depending on tab
      const key = row.country

      if (!grouped[key]) {
        grouped[key] = {
          ...row,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        }
      } else {
        // sum clicks + impressions
        grouped[key].clicks += row.clicks
        grouped[key].impressions += row.impressions

        // weighted avg position by impressions
        grouped[key].position =
          (grouped[key].position * (grouped[key].impressions - row.impressions) +
            row.position * row.impressions) /
          grouped[key].impressions

        // recompute CTR from totals
        grouped[key].ctr =
          grouped[key].impressions > 0
            ? ((grouped[key].clicks / grouped[key].impressions) * 100).toFixed(2)
            : 0
      }
    })

    return Object.values(grouped)
  }

  // Filter data with Fuse.js
  const filteredData = useMemo(() => {
    let result = blogData
    if (filterType === "blog" && blogUrlFilter) {
      result = result.filter((item) => item.url === blogUrlFilter)
    }
    if (blogTitleFilter) {
      result = result.filter((item) => item.blogTitle === blogTitleFilter)
    }
    if (activeTab === "country") {
      result = aggregateData(result)
    }
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
    a.download = `search_performance_${activeTab}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <Helmet>
        <title>Search Performance | GenWrite</title>
      </Helmet>

      {!!user?.gsc ? (
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Search Performance</h1>
              <div className="flex gap-3 items-center">
                <Button
                  icon={<Download className="size-4 mr-2" />}
                  title="Export"
                  onClick={handleExport}
                  disabled={isLoading}
                  type="dashed"
                  className="bg-gradient-to-l from-blue-400 to-purple-300 hover:!bg-gradient-to-r hover:!from-purple-500 hover:!to-blue-400 hover:!text-white rounded-lg h-10 text-base font-semibold"
                >
                  Export
                </Button>
                <Button
                  icon={<RefreshCw className={clsx("size-4 mr-2", isLoading && "animate-spin")} />}
                  onClick={() => refetch()}
                  disabled={isLoading}
                  type="dashed"
                  className="bg-gradient-to-l from-blue-300 to-purple-400 hover:!bg-gradient-to-r hover:!from-purple-600 hover:!to-blue-400 hover:!text-white rounded-lg h-10 text-base font-semibold"
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
                title={
                  <span className="text-sm font-semibold text-gray-600">Total Impressions</span>
                }
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
                title={
                  <span className="text-sm font-semibold text-gray-600">Average Position</span>
                }
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
                className={clsx("flex-1 max-w-36", dateRange && "border-blue-500")}
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
                  disabledDate={(current) => current && current > dayjs().endOf("day")}
                  className={clsx(
                    "flex-1 min-w-56",
                    customDateRange[0] && customDateRange[1] && "border-blue-500"
                  )}
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

              <Select
                value={blogTitleFilter}
                onChange={handleBlogTitleChange}
                className={clsx("flex-1 min-w-[200px]", blogTitleFilter && "border-blue-500")}
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

              {/* <Select
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
              </Select> */}
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
            </div>
          )}
          {blogTitleFilter && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Showing data for: <span className="text-blue-600">{blogTitleFilter}</span>
              </h2>
            </div>
          )}
          <GSCAnalyticsTabs
            items={[
              { key: "query", label: "Queries" },
              { key: "page", label: "Pages" },
              { key: "country", label: "Countries" },
            ]}
            filteredData={filteredData}
            activeTab={activeTab}
            handleTabChange={handleTabChange}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <GSCLogin />
      )}
    </>
  )
}

export default SearchConsole
