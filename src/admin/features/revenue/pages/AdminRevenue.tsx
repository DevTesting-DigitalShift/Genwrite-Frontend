import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Package,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import type { AdminTransaction, RevenueAnalyticsResponse } from "@admin/types/admin"
import { AreaChart } from "@admin/shared/charts/AreaChart"
import { BarChart } from "@admin/shared/charts/BarChart"
import { PieChart } from "@admin/shared/charts/PieChart"
import { ErrorAlert } from "@admin/shared/components/ErrorAlert"
import LoadingState from "@admin/shared/components/LoadingState"
import { StatCard } from "@admin/shared/components/StatCard"
import { getAdminTransactions } from "../../transactions/api/transactionsApi"
import { getRevenueAnalytics } from "../api/revenueApi"

interface TransactionTableProps {
  transactions: AdminTransaction[]
  isLoading: boolean
  pagination: { page: number; total: number; totalPages: number }
  onPageChange: (page: number) => void
}

function TransactionTable({
  transactions,
  isLoading,
  pagination,
  onPageChange,
}: TransactionTableProps) {
  if (isLoading) return <LoadingState />

  if (!transactions.length) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
        No transactions found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto max-w-90 md:max-w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">User</TableHead>
              <TableHead className="w-[120px]">Amount</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx._id}>
                <TableCell>
                  <div className="font-medium text-gray-900">
                    {tx.user?.name || tx.userName || "Unknown"}
                  </div>
                  <div className="text-gray-500 text-xs">{tx.user?.email || tx.userEmail}</div>
                </TableCell>
                <TableCell className="font-medium">
                  {(tx.amount / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: tx.currency?.toUpperCase() || "USD",
                  })}
                </TableCell>
                <TableCell>
                  <span className="uppercase font-mono text-gray-400 text-xs">{tx.plan}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      tx.status === "success" || tx.status === "succeeded"
                        ? "bg-green-100 text-green-700"
                        : tx.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {tx.status}
                  </span>
                </TableCell>
                <TableCell className="text-gray-500 whitespace-nowrap">
                  {new Date(tx.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 sm:px-6 border-t border-gray-100">
          <span className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
            Showing Page <span className="font-semibold text-gray-900">{pagination.page}</span> of{" "}
            <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
          </span>
          <div className="flex gap-2 order-1 sm:order-2">
            <button
              type="button"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Previous Page"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Next Page"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminRevenue() {
  const [data, setData] = useState<RevenueAnalyticsResponse | null>(null)
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [analyticsData, transactionsData] = await Promise.all([
        getRevenueAnalytics(),
        getAdminTransactions({ page: pagination.page, limit: 10 }),
      ])

      setData(analyticsData)
      setTransactions(transactionsData.transactions)
      setPagination((prev) => ({
        ...prev,
        total: transactionsData.total,
        totalPages: transactionsData.pages,
      }))
    } catch (err) {
      console.error("Failed to fetch revenue analytics:", err)
      setError(err instanceof Error ? err.message : "Failed to load analytics data")
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  if (isLoading && !data) return <LoadingState />

  if (error && !data) {
    return (
      <div className="flex-1 p-8">
        <ErrorAlert
          message={error || "No data available"}
          onAction={() => fetchData()}
          actionLabel="Retry"
        />
      </div>
    )
  }

  const safeData = data || {
    mrr: 0,
    arr: 0,
    revenueGrowth: 0,
    repeatCustomers: 0,
    revenueByMonth: [],
    revenueByPlan: [],
    transactions: { total: 0, successful: 0, failed: 0, pending: 0 },
  }

  const revenueTrendData = safeData.revenueByMonth.map((item) => ({
    name: item.month,
    value: item.revenue,
  }))
  const revenueByPlanData =
    safeData.revenueByPlan?.map((item) => ({
      name: item.plan.toUpperCase(),
      value: item.revenue,
    })) || []
  const transactionStatusData = [
    { name: "Successful", value: safeData.transactions.successful },
    { name: "Failed", value: safeData.transactions.failed },
    { name: "Pending", value: safeData.transactions.pending },
  ]

  return (
    <main className="max-container mx-auto space-y-4 sm:space-y-6 md:space-y-8 overscroll-y-none">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="MRR"
          value={`$${safeData.mrr}`}
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="green"
          trend={{
            value: safeData.revenueGrowth,
            label: "growth",
            positive: safeData.revenueGrowth >= 0,
          }}
        />
        <StatCard
          label="ARR"
          value={`$${safeData.arr}`}
          icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="blue"
        />
        <StatCard
          label="Total Transactions"
          value={safeData.transactions.total}
          icon={<CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="purple"
        />
        <StatCard
          label="Repeat Customers"
          value={safeData.repeatCustomers}
          icon={<RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Revenue Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Monthly revenue over time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <AreaChart
              data={revenueTrendData}
              xKey="name"
              yKey="value"
              height={300}
              color="#10B981"
              yFormatter={(val) => `$${(val / 100).toLocaleString()}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg sm:text-xl">Revenue by Plan</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Total revenue breakdown by subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="bg-linear-to-br from-purple-50/50 to-pink-50/50 rounded-xl p-4 -mx-2">
              <BarChart
                data={revenueByPlanData}
                xKey="name"
                yKey="value"
                height={280}
                color="#A855F7"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Transaction Status</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Breakdown by status</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <PieChart
            data={transactionStatusData}
            height={300}
            colors={["#10B981", "#EF4444", "#F59E0B"]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              List of all payment transactions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <TransactionTable
            transactions={transactions}
            isLoading={isLoading && !transactions.length}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>
    </main>
  )
}
