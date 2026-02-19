import toast from "@utils/toast"
import { RefreshCw, Search, Download, Calendar, Filter, X } from "lucide-react"
import Fuse from "fuse.js"
import dayjs from "dayjs"
import * as ExcelJS from "exceljs"
import "@pages/SearchConsole/searchConsole.css"
import clsx from "clsx"
import LoadingScreen from "@components/UI/LoadingScreen"

const GSCLogin = lazy(() => import("@pages/SearchConsole/GSCLogin"))
const GSCAnalyticsTabs = lazy(() => import("@pages/SearchConsole/GSCAnalyticsTabs"))

// Configure Fuse.js for frontend search
const fuseOptions = { keys: ["url", "query", "countryName", "blogTitle"], threshold: 0.3 }

const SearchConsole = () => {
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("query")
  const [dateRange, setDateRange] = useState("7d")
  const [customDateRange, setCustomDateRange] = useState([dayjs().subtract(6, "days"), dayjs()])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [filterType, setFilterType] = useState("search")
  const [blogUrlFilter, setBlogUrlFilter] = useState(null)
  const [blogTitleFilter, setBlogTitleFilter] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [userCountry, setUserCountry] = useState(navigator.language.split("-")[1] || "US")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const { user } = useAuthStore()
  const { clearAnalytics, fetchGscAnalytics } = useGscStore()
  const queryClient = useQueryClient()

  // Debounced search query - waits 5 seconds after user stops typing
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

  // Debounce effect for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 5000) // 5 second delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Check if filters are applied for Reset Filters button styling
  const isFilterApplied = useMemo(() => {
    return (
      dateRange !== "7d" ||
      customDateRange[0] !== null ||
      customDateRange[1] !== null ||
      blogUrlFilter ||
      blogTitleFilter ||
      searchQuery ||
      pageSize !== 10 ||
      currentPage !== 1
    )
  }, [
    dateRange,
    customDateRange,
    blogUrlFilter,
    blogTitleFilter,
    searchQuery,
    pageSize,
    currentPage,
  ])

  // Check authentication immediately on mount
  useEffect(() => {
    if (!user?.gsc) {
      clearAnalytics()
      queryClient.clear()
    }
  }, [user, clearAnalytics, queryClient])

  // Update session storage
  useEffect(() => {
    sessionStorage.setItem(
      "gscFilters",
      JSON.stringify({ filterType, blogUrlFilter, blogTitleFilter, userCountry })
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
    queryKey: ["gscAnalytics", activeTab, dateRange, customDateRange],
    queryFn: async () => {
      const dimensions = getDimensions()
      const { from, to } = getDateRangeParams()
      const params = { from, to, query: JSON.stringify(dimensions) }
      const data = await fetchGscAnalytics(params)
      return data.gscData.map((item, index) => ({
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
    retry: 1,
    onError: err => {
      setError(err.message || "Failed to fetch analytics data")
      if (err?.message?.includes("invalid_grant")) {
        toast.error("Your Google Search Console session has expired. Please reconnect.")
        clearAnalytics()
        queryClient.clear()
      }
    },
  })

  const blogTitles = useMemo(() => {
    return [...new Set(blogData.map(item => item.blogTitle).filter(t => t !== "Untitled"))]
  }, [blogData])

  // Handle tab change
  const handleTabChange = key => {
    setActiveTab(key)
    setSearchQuery("")
    setCurrentPage(1) // Reset to first page on tab change
  }

  // Handle date range change
  const handleDateRangeChange = value => {
    setDateRange(value)
    setCustomDateRange([null, null])
    setError(null)
    setShowDatePicker(value === "custom")
    setCurrentPage(1) // Reset to first page on date range change
    refetch()
  }

  // Handle custom date range change
  const handleCustomDateRangeChange = (type, val) => {
    const newRange = [...customDateRange]
    if (type === "start") newRange[0] = val ? dayjs(val) : null
    else newRange[1] = val ? dayjs(val) : null

    setCustomDateRange(newRange)
    if (newRange[0] && newRange[1]) {
      setDateRange("custom")
      setCurrentPage(1)
      refetch()
    }
  }

  // Handle blog title filter change
  const handleBlogTitleChange = value => {
    setBlogTitleFilter(value)
    setCurrentPage(1) // Reset to first page on filter change
  }

  // Handle search query change
  const handleSearch = value => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page on search
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilterType("search")
    setBlogUrlFilter("")
    setBlogTitleFilter(null)
    setSearchQuery("")
    setDateRange("7d")
    setCustomDateRange([dayjs().subtract(6, "days"), dayjs()])
    setShowDatePicker(false)
    setPageSize(10)
    setCurrentPage(1)
    refetch()
  }

  const aggregateData = data => {
    const grouped = {}

    data.forEach(row => {
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
        grouped[key].clicks += row.clicks
        grouped[key].impressions += row.impressions
        grouped[key].position =
          (grouped[key].position * (grouped[key].impressions - row.impressions) +
            row.position * row.impressions) /
          grouped[key].impressions
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
      result = result.filter(item => item.url === blogUrlFilter)
    }
    if (blogTitleFilter) {
      result = result.filter(item => item.blogTitle === blogTitleFilter)
    }
    if (activeTab === "country") {
      result = aggregateData(result)
    }
    if (debouncedSearchQuery && filterType === "search") {
      const fuse = new Fuse(result, fuseOptions)
      result = fuse.search(debouncedSearchQuery).map(({ item }) => item)
    }
    return result
  }, [blogData, filterType, blogUrlFilter, blogTitleFilter, debouncedSearchQuery, activeTab])

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, pageSize])

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
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0F0F0" } }

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

  // Handle pagination change
  const handlePaginationChange = (page, pageSizeValue) => {
    setCurrentPage(page)
    setPageSize(pageSizeValue)
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Helmet>
        <title>Search Performance | GenWrite</title>
      </Helmet>

      {!!user?.gsc ? (
        <div className="p-2 md:p-6 min-h-screen mt-5 md:mt-0 max-w-[1600px] mx-auto">
          {/* Dashboard Header & Stats */}
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8 mb-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                  Search <span className="text-blue-600">Performance</span>
                </h1>
                <p className="text-gray-500 mt-2 font-medium">
                  Track your organic growth and keyword rankings
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExport}
                  disabled={isLoading}
                  className="btn btn-outline btn-md border-gray-200 hover:bg-gray-50 hover:text-gray-900 gap-2 normal-case rounded-xl font-semibold"
                >
                  <Download className="size-4" />
                  Export Data
                </button>
                <button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="btn btn-primary btn-md shadow-lg shadow-blue-200 gap-2 normal-case rounded-xl font-semibold bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white"
                >
                  <RefreshCw className={clsx("size-4", isLoading && "animate-spin")} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="p-5 rounded-2xl border border-blue-50 bg-linear-to-br from-blue-50/50 to-white shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MousePointer2 className="size-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    Total Clicks
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">
                    {new Intl.NumberFormat().format(metrics.totalClicks)}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-purple-50 bg-linear-to-br from-purple-50/50 to-white shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="size-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    Impressions
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">
                  {new Intl.NumberFormat().format(metrics.totalImpressions)}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-teal-50 bg-linear-to-br from-teal-50/50 to-white shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <TrendingUp className="size-4 text-teal-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    Avg. CTR
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">
                    {metrics.avgCtr}
                  </p>
                  <span className="text-lg font-bold text-gray-400">%</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-amber-50 bg-linear-to-br from-amber-50/50 to-white shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <BarChart3 className="size-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                    Avg. Position
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">
                  {metrics.avgPosition}
                </p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Period</label>
                <select
                  value={dateRange}
                  onChange={e => handleDateRangeChange(e.target.value)}
                  className="select select-bordered select-sm w-full font-medium h-10 rounded-xl border-gray-200 focus:border-blue-500"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="180d">Last 6 Months</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {showDatePicker && (
                <div className="flex gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">
                      From
                    </label>
                    <input
                      type="date"
                      className="input input-bordered input-sm h-10 rounded-xl border-gray-200"
                      value={customDateRange[0]?.format("YYYY-MM-DD") || ""}
                      onChange={e => handleCustomDateRangeChange("start", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">To</label>
                    <input
                      type="date"
                      className="input input-bordered input-sm h-10 rounded-xl border-gray-200"
                      value={customDateRange[1]?.format("YYYY-MM-DD") || ""}
                      onChange={e => handleCustomDateRangeChange("end", e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 flex-1 min-w-[240px]">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">
                  Keyword Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search queries, titles..."
                    className="input input-bordered input-sm w-full pl-10 h-10 rounded-xl border-gray-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">
                  Filter by Blog
                </label>
                <select
                  value={blogTitleFilter || ""}
                  onChange={e => handleBlogTitleChange(e.target.value || null)}
                  className="select select-bordered select-sm w-full font-medium h-10 rounded-xl border-gray-200 focus:border-blue-500"
                >
                  <option value="">All blog posts</option>
                  {blogTitles.map(title => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end h-full">
                <button
                  onClick={handleResetFilters}
                  className={clsx(
                    "btn btn-sm h-10 px-6 normal-case rounded-xl font-bold transition-all",
                    isFilterApplied ? "btn-error btn-outline" : "btn-ghost text-gray-400"
                  )}
                >
                  {isFilterApplied ? (
                    <X className="size-4 mr-1" />
                  ) : (
                    <Filter className="size-4 mr-1" />
                  )}
                  Reset
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error shadow-sm mb-6 rounded-2xl border-none text-white font-medium">
              <AlertCircle className="size-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
            <GSCAnalyticsTabs
              items={[
                { key: "query", label: "Queries" },
                { key: "page", label: "Pages" },
                { key: "country", label: "Countries" },
              ]}
              filteredData={paginatedData}
              activeTab={activeTab}
              handleTabChange={handleTabChange}
              isLoading={isLoading}
            />
          </div>

          {/* Pagination */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
            <div className="text-sm font-medium text-gray-500">
              Showing {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)} to{" "}
              {Math.min(filteredData.length, currentPage * pageSize)} of {filteredData.length}{" "}
              records
            </div>
            <div className="join shadow-sm border border-gray-100">
              <button
                className="join-item btn btn-sm bg-white border-gray-200 hover:bg-gray-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <button className="join-item btn btn-sm bg-white border-gray-200 no-animation">
                Page {currentPage} of {Math.ceil(filteredData.length / pageSize) || 1}
              </button>
              <button
                className="join-item btn btn-sm bg-white border-gray-200 hover:bg-gray-50"
                disabled={currentPage >= Math.ceil(filteredData.length / pageSize)}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <GSCLogin />
      )}
    </Suspense>
  )
}

export default SearchConsole
