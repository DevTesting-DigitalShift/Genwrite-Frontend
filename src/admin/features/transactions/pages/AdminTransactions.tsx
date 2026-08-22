import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Search,
  User,
  XCircle,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import { useViewport } from "@/hooks/useViewport"
import type { AdminTransaction } from "@admin/types/admin"
import { EmptyState } from "@admin/shared/components/EmptyState"
import { ErrorAlert } from "@admin/shared/components/ErrorAlert"
import LoadingState from "@admin/shared/components/LoadingState"
import { getAdminTransactions } from "../api/transactionsApi"

const formatDate = (date: string, short = false): string => {
  if (short) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatCurrency = (amount: number, currency: string): string => {
  const value = amount / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "inr" ? "INR" : "USD",
  }).format(value)
}

function getStatusBadge(status: string) {
  switch (status) {
    case "success":
      return <Badge className="bg-green-100 text-green-700 border border-green-200">Success</Badge>
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</Badge>
      )
    case "failed":
    case "error":
      return <Badge className="bg-red-100 text-red-700 border border-red-200">Failed</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{status}</Badge>
  }
}

export default function AdminTransactions() {
  const { isDesktop } = useViewport()
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchTransactions = useCallback(async (page: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getAdminTransactions({ page, limit: 20 })

      setTransactions(response.transactions)
      setTotal(response.total)
      setCurrentPage(response.page)
      setTotalPages(response.pages)
    } catch (err) {
      console.error("Failed to fetch transactions:", err)
      setError(err instanceof Error ? err.message : "Failed to load transactions")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions(currentPage)
  }, [currentPage, fetchTransactions])

  useEffect(() => {
    if (currentPage !== 1 && (searchQuery || statusFilter !== "all")) {
      setCurrentPage(1)
    }
  }, [searchQuery, statusFilter, currentPage])

  const filteredTransactions = transactions.filter((txn) => {
    if (searchQuery) {
      const matchesSearch =
        txn.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false
    }

    if (statusFilter !== "all" && txn.status !== statusFilter) return false

    return true
  })

  if (isLoading && transactions.length === 0) return <LoadingState />

  if (error && transactions.length === 0) {
    return (
      <div className="p-4 sm:p-8">
        <ErrorAlert message={error} onAction={() => fetchTransactions(currentPage)} />
      </div>
    )
  }

  return (
    <main className="max-container mx-auto space-y-4 sm:space-y-6">
      <div className="flex justify-between items-start gap-3 sm:gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Transactions</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage and monitor all payment transactions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-600 text-xs sm:text-sm font-medium">Total</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{total.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-600 text-xs sm:text-sm font-medium">Success</span>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {transactions.filter((t) => t.status === "success" || t.status === "succeeded").length}
          </p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-600 text-xs sm:text-sm font-medium">Failed</span>
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {transactions.filter((t) => t.status === "failed").length}
          </p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-gray-600 text-xs sm:text-sm font-medium">Pending</span>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {transactions.filter((t) => t.status === "pending").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <>
            {isDesktop ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">User</TableHead>
                      <TableHead className="min-w-[100px]">Type</TableHead>
                      <TableHead className="min-w-[100px]">Amount</TableHead>
                      <TableHead className="min-w-[80px]">Plan</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[80px]">Credits</TableHead>
                      <TableHead className="min-w-[140px]">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((txn) => (
                      <TableRow key={txn._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {txn.user?.name || txn.userName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[160px]">
                              {txn.user?.email || txn.userEmail || "N/A"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 capitalize">
                            {txn.type.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-gray-900 text-sm">
                            {formatCurrency(txn.amount, txn.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {txn.plan ? (
                            <Badge
                              className={`capitalize text-xs ${
                                txn.plan === "basic"
                                  ? "bg-gray-100 text-gray-700 border border-gray-200"
                                  : txn.plan === "pro"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-purple-100 text-purple-700 border border-purple-200"
                              }`}
                            >
                              {txn.plan}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(txn.status)}</TableCell>
                        <TableCell className="text-center">
                          {txn.creditsAdded ? (
                            <span className="text-sm font-medium text-green-600">
                              +{txn.creditsAdded}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-600">{formatDate(txn.createdAt)}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTransactions.map((txn) => (
                  <div key={txn._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <p className="font-medium text-gray-900 text-sm">
                            {txn.user?.name || txn.userName || "Unknown"}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 ml-6">
                          {txn.user?.email || txn.userEmail || "N/A"}
                        </p>
                      </div>
                      {getStatusBadge(txn.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {formatCurrency(txn.amount, txn.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {txn.type.replace("_", " ")}
                        </p>
                      </div>
                      {txn.plan && (
                        <div className="flex gap-2">
                          <p className="text-xs text-gray-500 mb-1">Plan:</p>
                          <span className="capitalize text-xs">{txn.plan}</span>
                        </div>
                      )}
                      {txn.creditsAdded && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Credits</p>
                          <span className="text-sm font-medium text-green-600">
                            +{txn.creditsAdded}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(txn.createdAt, true)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, total)} of{" "}
                {total}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <div className="hidden sm:flex items-center px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                  {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No transactions found"
              description="No transactions match your current filters."
              height="300px"
            />
          </div>
        )}
      </div>
    </main>
  )
}
