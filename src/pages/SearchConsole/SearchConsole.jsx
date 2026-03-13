import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import useGscStore from "@store/useGscStore"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCw, Search, Download } from "lucide-react"
import DateRangePicker from "@components/ui/DateRangePicker"
import dayjs from "dayjs"
import * as ExcelJS from "exceljs"
import "@pages/SearchConsole/searchConsole.css"
import clsx from "clsx"
import LoadingScreen from "@components/ui/LoadingScreen"
import { toast } from "sonner"

const GSCLogin = lazy(() => import("@pages/SearchConsole/GSCLogin"))
const GSCAnalyticsTabs = lazy(() => import("@pages/SearchConsole/GSCAnalyticsTabs"))

const SearchConsole = () => {
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("query")
  const [dateRange, setDateRange] = useState("7d")
  const [customDateRange, setCustomDateRange] = useState([dayjs().subtract(6, "days"), dayjs()])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [filterType, setFilterType] = useState("search")
  const [blogUrlFilter, setBlogUrlFilter] = useState(null)
  const [blogTitleFilter, setBlogTitleFilter] = useState(null)
  // searchQuery is passed directly to GSCAnalyticsTabs — Fuse runs inside the table
  const [searchQuery, setSearchQuery] = useState("")
  const [userCountry] = useState(navigator.language.split("-")[1] || "US")
  const [autoFallbackDone, setAutoFallbackDone] = useState(false)

  const { user } = useAuthStore()
  const { clearAnalytics, fetchGscAnalytics } = useGscStore()
  const queryClient = useQueryClient()

  const isFilterApplied = useMemo(
    () => dateRange !== "7d" || blogUrlFilter || blogTitleFilter || searchQuery,
    [dateRange, blogUrlFilter, blogTitleFilter, searchQuery]
  )

  useEffect(() => {
    if (!user?.gsc) {
      clearAnalytics()
      queryClient.clear()
    }
  }, [user, clearAnalytics, queryClient])

  useEffect(() => {
    sessionStorage.setItem(
      "gscFilters",
      JSON.stringify({ filterType, blogUrlFilter, blogTitleFilter, userCountry })
    )
  }, [filterType, blogUrlFilter, blogTitleFilter, userCountry])

  const getDateRangeParams = useCallback(() => {
    let from, to
    if (dateRange === "custom" && customDateRange[0] && customDateRange[1]) {
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

  const getDimensions = useCallback(() => {
    const dimensions = ["page"]
    if (activeTab === "query") dimensions.push("query")
    else if (activeTab === "country") dimensions.push("country")
    return dimensions
  }, [activeTab])

  const {
    data: blogData = [],
    isLoading,
    isFetching,
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

  const blogTitles = useMemo(
    () => [...new Set(blogData.map(item => item.blogTitle).filter(t => t !== "Untitled"))],
    [blogData]
  )

  useEffect(() => {
    if (!isLoading && !isFetching && blogData.length === 0 && !autoFallbackDone) {
      if (dateRange === "7d" || dateRange === "30d") {
        setAutoFallbackDone(true)
        setDateRange("180d")
      } else {
        setAutoFallbackDone(true)
      }
    }
  }, [isLoading, isFetching, blogData.length, autoFallbackDone, dateRange])

  const handleTabChange = key => {
    setActiveTab(key)
    setSearchQuery("")
  }

  const handleDateRangeChange = value => {
    setDateRange(value)
    setCustomDateRange([null, null])
    setError(null)
    setShowDatePicker(value === "custom")
    refetch()
  }

  const handleCustomDateRangeChange = dates => {
    if (dates && dates[0] && dates[1]) {
      setCustomDateRange(dates)
      setDateRange("custom")
      refetch()
    } else {
      setError("Please select both start and end dates.")
    }
  }

  const handleResetFilters = () => {
    setFilterType("search")
    setBlogUrlFilter("")
    setBlogTitleFilter(null)
    setSearchQuery("")
    setDateRange("7d")
    setCustomDateRange([dayjs().subtract(6, "days"), dayjs()])
    setShowDatePicker(false)
    refetch()
  }

  const aggregateData = data => {
    const grouped = {}
    data.forEach(row => {
      const key = row.country
      if (!grouped[key]) {
        grouped[key] = { ...row }
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

  // URL/title pre-filter (Fuse text search happens inside GSCAnalyticsTabs)
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
    return result
  }, [blogData, filterType, blogUrlFilter, blogTitleFilter, activeTab])

  // Metrics always calculated on full filteredData (before Fuse)
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
    filteredData.forEach(item => {
      worksheet.addRow({
        ...(isPageTab && !blogTitleFilter ? { blogTitle: item.blogTitle } : {}),
        ...(isPageTab ? { url: item.url } : {}),
        ...(isQueryTab ? { query: item.query } : {}),
        ...(isCountryTab ? { countryName: item.countryName } : {}),
        clicks: item.clicks,
        impressions: item.impressions,
        ctr: `${item.ctr}%`,
        position: item.position,
      })
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

  const renderEmptyState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center max-w-xl mx-auto mt-6">
      <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
        <Search className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        No Search Performance Data
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        We couldn't find any Google Search Console data. Here are a few possible reasons:
      </p>
      
      <div className="space-y-3 text-left w-full mx-auto">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">1</div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800">Recently Published?</h4>
            <p className="text-xs text-gray-600 mt-0.5">It takes 3-4 days for Google to rank new posts.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">2</div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800">Has it been deleted?</h4>
            <p className="text-xs text-gray-600 mt-0.5">Deleted content won't show metrics without prior traffic.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">3</div>
          <div>
            <h4 className="font-semibold text-sm text-gray-800">Check Date Range</h4>
            <p className="text-xs text-gray-600 mt-0.5">Ensure the selected filter matches an active timeline.</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Helmet>
        <title>Search Performance | GenWrite</title>
      </Helmet>

      {!!user?.gsc ? (
        <div className="px-3 sm:px-4 md:px-6 py-4 md:py-6 min-h-screen">

          {/* ── Page Header ─────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              Search Performance
            </h1>
            <div className="flex gap-2 shrink-0">
              <button
                title="Export to Excel"
                onClick={handleExport}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-linear-to-l from-blue-400 to-purple-400 text-white rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                title="Refresh data"
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-linear-to-l from-blue-400 to-purple-400 text-white rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* ── Metric Cards ─────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              {
                label: "Total Clicks",
                value: new Intl.NumberFormat().format(metrics.totalClicks),
                color: "text-blue-600",
                bg: "from-blue-100/70 to-blue-50/70",
                sub: "across filtered data",
              },
              {
                label: "Total Impressions",
                value: new Intl.NumberFormat().format(metrics.totalImpressions),
                color: "text-purple-600",
                bg: "from-purple-100/70 to-purple-50/70",
                sub: "across filtered data",
              },
              {
                label: "Avg. CTR",
                value: `${metrics.avgCtr}%`,
                color: "text-teal-600",
                bg: "from-teal-100/70 to-teal-50/70",
                sub: "click-through rate",
              },
              {
                label: "Avg. Position",
                value: metrics.avgPosition,
                color: "text-amber-600",
                bg: "from-amber-100/70 to-amber-50/70",
                sub: "search result rank",
              },
            ].map(card => (
              <div
                key={card.label}
                className={`rounded-xl text-center p-3 sm:p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow bg-linear-to-br ${card.bg}`}
              >
                <span className="text-[11px] sm:text-xs font-semibold text-gray-500 block mb-1.5 uppercase tracking-wide">
                  {card.label}
                </span>
                <p className={`text-lg sm:text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-[10px] text-gray-400 mt-1 hidden sm:block">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ──────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 border border-gray-200">
            {/* Row 1: Date + Blog title select */}
            <div className="flex flex-wrap gap-2 mb-2">
              <select
                value={dateRange}
                onChange={e => handleDateRangeChange(e.target.value)}
                className={clsx(
                  "select select-bordered select-sm h-9 border-gray-300 bg-white text-gray-600 focus:outline-none focus:border-blue-500 rounded-lg",
                  dateRange !== "7d" && "border-blue-500"
                )}
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="180d">Last 6 Months</option>
                <option value="custom">Custom Range</option>
              </select>

              {showDatePicker && (
                <div className={clsx(
                  "flex-1 min-w-[200px] rounded-lg transition-all duration-300",
                  dateRange === "custom" && (!customDateRange[0] || !customDateRange[1])
                    ? "ring-2 ring-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    : "ring-1 ring-transparent"
                )}>
                  <DateRangePicker
                    value={customDateRange}
                    onChange={handleCustomDateRangeChange}
                    maxDate={dayjs().endOf("day")}
                    className={clsx(
                      "w-full",
                      customDateRange[0] && customDateRange[1] && "border-blue-500 rounded-lg"
                    )}
                  />
                </div>
              )}

              <select
                value={blogTitleFilter || ""}
                onChange={e => setBlogTitleFilter(e.target.value || null)}
                className={clsx(
                  "select select-bordered select-sm h-9 border-gray-300 bg-white text-gray-600 focus:outline-none focus:border-blue-500 rounded-lg flex-1 min-w-[160px]",
                  blogTitleFilter && "border-blue-500"
                )}
              >
                <option value="">All Blog Titles</option>
                {blogTitles.map(title => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 2: Search + Reset */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Fuzzy search title, query, country…"
                  className={`pl-9 pr-4 py-1 h-9 w-full bg-white border ${
                    searchQuery ? "border-blue-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                />
              </div>
              <button
                onClick={handleResetFilters}
                className={`rounded-lg h-9 px-3 text-sm font-medium text-gray-700 whitespace-nowrap transition-colors ${
                  isFilterApplied
                    ? "bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700"
                    : "bg-gray-100 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                Reset
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg mb-4 flex items-center border border-red-200 text-sm">
              <span>{error}</span>
            </div>
          )}

          {blogTitleFilter && (
            <p className="mb-3 text-sm text-gray-600">
              Filtered by: <span className="font-semibold text-blue-600">{blogTitleFilter}</span>
            </p>
          )}

          {/* ── Table ────────────────────────────────────────── */}
          {!isLoading && !isFetching && blogData.length === 0 ? (
            renderEmptyState()
          ) : (
            <GSCAnalyticsTabs
              items={[
                { key: "query", label: "Queries" },
                { key: "page", label: "Pages" },
                { key: "country", label: "Countries" },
              ]}
              filteredData={filteredData}
              searchQuery={searchQuery}
              activeTab={activeTab}
              handleTabChange={handleTabChange}
              isLoading={isLoading || isFetching}
            />
          )}
        </div>
      ) : (
        <GSCLogin />
      )}
    </Suspense>
  )
}

export default SearchConsole
