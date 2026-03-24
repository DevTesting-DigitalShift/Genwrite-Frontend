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
  ChevronDown,
  ArrowUpDown,
} from "lucide-react"
import Fuse from "fuse.js"
import { clsx } from "clsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"

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
    <div className="min-h-screen p-6">
      <Helmet>
        <title>Credit Logs | GenWrite</title>
      </Helmet>

      <div className="space-y-8">
        {/* Simple Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-blue-600 tracking-tight">Credit Logs</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-md">
            All your credits, all in one spot. Check your activity, track your transactions, and
            never miss a beat.
          </p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by blog title"
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value)
                setPage(1)
              }}
              className="input input-bordered w-full h-11 pl-11 rounded-lg bg-white border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-sm transition-all text-slate-700"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={e => {
                setDateRange(e.target.value)
                setPage(1)
              }}
              className="select select-bordered select-sm h-11 rounded-lg border-slate-200 font-medium text-slate-600 focus:border-blue-500 outline-none w-40"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="select select-bordered select-sm h-11 rounded-lg border-slate-200 font-medium text-slate-600 focus:border-blue-500 outline-none w-32"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 border-y border-slate-100 hover:bg-slate-50/50">
                  <TableHead className="py-5 pl-8 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Blog Topic
                  </TableHead>
                  <TableHead className="py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-2">
                      Date <ArrowUpDown size={12} />
                    </div>
                  </TableHead>
                  <TableHead className="py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-2">
                      Type <Filter size={12} />
                    </div>
                  </TableHead>
                  <TableHead className="py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-2">
                      Purpose <Filter size={12} />
                    </div>
                  </TableHead>
                  <TableHead className="py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-2">
                      Amount <ArrowUpDown size={12} />
                    </div>
                  </TableHead>
                  <TableHead className="py-5 pr-8 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Remaining Credits
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-32 text-center">
                      <span className="loading loading-spinner text-blue-600"></span>
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <img src="/Images/trash-can.webp" alt="Empty" className="w-20 opacity-40" />
                        <p className="text-slate-400 font-medium text-sm">No Logs Found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map(log => (
                    <TableRow
                      key={log._id}
                      className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <TableCell className="py-4 pl-8">
                        <span className="font-semibold text-slate-700 text-sm">
                          {log.metadata?.title || "System Transaction"}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 font-medium text-slate-600 text-sm whitespace-nowrap">
                        {dayjs(log.createdAt).format("MMM DD, YYYY")}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm font-medium text-slate-500 capitalize">
                          {log.amount < 0 ? "Debit" : "Credit"}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm font-medium text-slate-600 capitalize">
                          {log.purpose?.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span
                          className={clsx(
                            "text-sm font-bold",
                            log.amount < 0 ? "text-rose-500" : "text-emerald-500"
                          )}
                        >
                          {log.amount < 0 ? "" : "+"}
                          {log.amount}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 pr-8 font-semibold text-slate-700 text-sm">
                        {log.remainingCredits}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && paginatedData.length > 0 && (
            <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Showing {Math.min(filteredLogs.length, (page - 1) * pageSize + 1)}-
                {Math.min(filteredLogs.length, page * pageSize)} of {filteredLogs.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn btn-sm btn-square bg-white border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn btn-sm btn-square bg-white border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreditLogsTable
