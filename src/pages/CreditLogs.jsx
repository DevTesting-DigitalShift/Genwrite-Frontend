import { motion, AnimatePresence } from "framer-motion"
import React, { useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet"
import dayjs from "dayjs"
import useCreditLogStore from "@store/useCreditLogStore"
import { useCreditLogsQuery } from "@api/queries/creditLogsQueries"
import { getSocket } from "@utils/socket"
import {
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  MinusCircle,
  PlusCircle,
} from "lucide-react"
import Fuse from "fuse.js"

const CreditLogsTable = () => {
  const {
    page,
    pageSize,
    searchText,
    dateRange,
    purposeFilter,
    setPage,
    setPageSize,
    setSearchText,
    setDateRange,
    setPurposeFilter,
  } = useCreditLogStore()

  // Calculate date range for backend fetch
  const getDateRangeParams = range => {
    const now = dayjs()
    switch (range) {
      case "24h":
        return {
          start: now.subtract(24, "hours").startOf("hour").toISOString(),
          end: now.endOf("hour").toISOString(),
        }
      case "7d":
        return {
          start: now.subtract(7, "days").startOf("day").toISOString(),
          end: now.endOf("day").toISOString(),
        }
      case "30d":
        return {
          start: now.subtract(30, "days").startOf("day").toISOString(),
          end: now.endOf("day").toISOString(),
        }
      default:
        return {}
    }
  }

  const queryParams = { page: 1, limit: -1, ...getDateRangeParams(dateRange) }

  const { data: logsData, isLoading: loading, refetch } = useCreditLogsQuery(queryParams)
  const logs = logsData?.data || []

  const pageSizeOptions = [10, 20, 50, 100]
  const purposeOptions = [
    { label: "Blog Generation", value: "BLOG_GENERATION" },
    { label: "Quick Blog", value: "QUICK_BLOG_GENERATION" },
    { label: "Proofreading", value: "AI_PROOFREADING" },
    { label: "Competitor Analysis", value: "COMPETITOR_ANALYSIS" },
    { label: "Subscription", value: "SUBSCRIPTION_PAYMENT" },
    { label: "Other", value: "OTHER" },
  ]

  // Initialize Fuse.js with logs data
  const fuse = useMemo(() => {
    return new Fuse(logs, {
      keys: ["metadata.title"],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    })
  }, [logs])

  // Filter logs based on search text and purpose filter
  const filteredLogs = useMemo(() => {
    let result = logs

    // Apply search filter using Fuse.js
    if (searchText) {
      result = fuse.search(searchText).map(({ item }) => item)
    }

    // Apply purpose filter
    if (purposeFilter.length > 0) {
      result = result.filter(log => purposeFilter.includes(log.purpose))
    }

    return result
  }, [logs, searchText, purposeFilter, fuse])

  const purposeColorMap = {
    BLOG_GENERATION: "badge-primary",
    QUICK_BLOG_GENERATION: "badge-secondary",
    AI_PROOFREADING: "badge-accent",
    COMPETITOR_ANALYSIS: "badge-warning",
    SUBSCRIPTION_PAYMENT: "badge-info",
    OTHER: "badge-ghost",
  }

  // WebSocket for real-time updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleCreditLogUpdate = () => {
      refetch()
    }

    socket.on("credit-log", handleCreditLogUpdate)

    return () => {
      socket.off("credit-log", handleCreditLogUpdate)
    }
  }, [refetch])

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredLogs.slice(startIndex, endIndex)
  }, [filteredLogs, page, pageSize])

  const totalPages = Math.ceil(filteredLogs.length / pageSize)

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen font-inter">
      <Helmet>
        <title>Credit Intelligence | GenWrite</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header Section */}
        <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.06)] border border-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-50 -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-110" />

          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">
                Credit <span className="text-blue-600">Intelligence</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-xl">
                Comprehensive audit trail of your resource consumption and credit lifecycle.
              </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                <input
                  type="text"
                  placeholder="Query by blog title or keyword..."
                  value={searchText}
                  onChange={e => {
                    setSearchText(e.target.value)
                    setPage(1)
                  }}
                  className="input input-bordered w-full h-16 pl-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-800"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="relative min-w-[200px]">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <select
                    value={dateRange}
                    onChange={e => {
                      setDateRange(e.target.value)
                      setPage(1)
                    }}
                    className="select select-bordered h-16 w-full pl-12 rounded-2xl bg-white border-slate-100 font-bold text-slate-700 focus:border-blue-500"
                  >
                    <option value="all">All Time History</option>
                    <option value="24h">Recent 24 Hours</option>
                    <option value="7d">Last 7 Sessions</option>
                    <option value="30d">Last 30 Active Days</option>
                  </select>
                </div>

                <div className="relative min-w-[160px]">
                  <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="select select-bordered h-16 w-full pl-12 rounded-2xl bg-white border-slate-100 font-bold text-slate-700 focus:border-blue-500"
                  >
                    {pageSizeOptions.map(size => (
                      <option key={size} value={size}>
                        {size} items / page
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purpose Filters */}
        <div className="flex flex-wrap gap-2 px-2">
          {purposeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => {
                const newFilters = purposeFilter.includes(option.value)
                  ? purposeFilter.filter(f => f !== option.value)
                  : [...purposeFilter, option.value]
                setPurposeFilter(newFilters)
                setPage(1)
              }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                purposeFilter.includes(option.value)
                  ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105"
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
          {purposeFilter.length > 0 && (
            <button
              onClick={() => setPurposeFilter([])}
              className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 overflow-hidden">
          <div className="overflow-x-auto custom-scroll">
            <table className="table table-lg w-full">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Blog Intel
                  </th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Timestamp
                  </th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Intent
                  </th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Impact
                  </th>
                  <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                          Retrieving Audit Logs...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                        <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center border border-slate-100">
                          <Inbox className="w-8 h-8 text-slate-200" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-900 font-black text-lg">No records found</p>
                          <p className="text-slate-400 text-sm font-medium">
                            Try adjusting your spectral filters or search query.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map(log => (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-2 h-10 rounded-full ${log.amount < 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                          />
                          <div className="max-w-xs sm:max-w-md">
                            <p className="font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {log.metadata?.title || "System Transaction"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              ID: {log._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8 whitespace-nowrap">
                        <p className="font-bold text-slate-700 text-sm">
                          {dayjs(log.createdAt).format("MMM DD, YYYY")}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {dayjs(log.createdAt).format("hh:mm A")}
                        </p>
                      </td>
                      <td className="py-6 px-8">
                        <span
                          className={`badge h-7 border-none text-[10px] font-black uppercase tracking-widest px-4 rounded-lg bg-opacity-10 ${purposeColorMap[log.purpose] || "badge-ghost"} ${log.purpose === "BLOG_GENERATION" ? "text-primary" : "text-slate-600"}`}
                        >
                          {log.purpose?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-6 px-8 text-center whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl font-black text-sm ${
                            log.amount < 0
                              ? "bg-rose-50 text-rose-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {log.amount < 0 ? (
                            <MinusCircle className="w-4 h-4" />
                          ) : (
                            <PlusCircle className="w-4 h-4" />
                          )}
                          {Math.abs(log.amount)}
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right whitespace-nowrap">
                        <p className="text-slate-900 font-black text-lg tracking-tight">
                          {log.remainingCredits}
                        </p>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          Credits Left
                        </p>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && paginatedData.length > 0 && (
            <div className="bg-slate-50/50 border-t border-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Page {page} of {totalPages} • {filteredLogs.length} Records Detected
              </p>

              <div className="join gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn btn-square bg-white border-slate-100 hover:bg-slate-900 hover:text-white rounded-xl shadow-sm disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="join gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum = page
                    if (page <= 3) pageNum = i + 1
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = page - 2 + i

                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`btn btn-square rounded-xl shadow-sm ${
                            page === pageNum
                              ? "bg-slate-900 text-white border-slate-900 scale-110 z-10"
                              : "bg-white border-slate-100 hover:border-slate-300 text-slate-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn btn-square bg-white border-slate-100 hover:bg-slate-900 hover:text-white rounded-xl shadow-sm disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default CreditLogsTable
