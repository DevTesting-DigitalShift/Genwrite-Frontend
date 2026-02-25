import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Zap,
  Clock,
  CreditCard,
  DollarSign,
  Calendar,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Filter,
} from "lucide-react"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import { useTransactionsQuery } from "@api/queries/userQueries"
import { useNavigate } from "react-router-dom"
import { clsx } from "clsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"

const Transactions = () => {
  const { user, loadAuthenticatedUser } = useAuthStore()
  const { data: transactions = [], isLoading: loading, refetch } = useTransactionsQuery()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" })

  const showTrialMessage =
    user?.subscription?.plan === "free" && user?.subscription?.status === "unpaid"

  useEffect(() => {
    loadAuthenticatedUser()
  }, [loadAuthenticatedUser])

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch =
        t.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.status?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || t.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [transactions, searchTerm, statusFilter])

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      if (sortConfig.key === "createdAt") {
        aVal = new Date(a.createdAt).getTime()
        bVal = new Date(b.createdAt).getTime()
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [filteredTransactions, sortConfig])

  const requestSort = key => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const getStatusBadge = status => {
    switch (status) {
      case "success":
        return (
          <div className="badge badge-success bg-emerald-100 text-emerald-700 font-bold border-none text-[10px] uppercase">
            SUCCESS
          </div>
        )
      case "failed":
        return (
          <div className="badge badge-error bg-rose-100 text-rose-700 font-bold border-none text-[10px] uppercase">
            FAILED
          </div>
        )
      case "pending":
        return (
          <div className="badge badge-warning bg-amber-100 text-amber-700 font-bold border-none text-[10px] uppercase">
            PENDING
          </div>
        )
      default:
        return (
          <div className="badge badge-ghost font-bold text-[10px] uppercase">
            {status.toUpperCase()}
          </div>
        )
    }
  }

  const totalCreditsValue = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  return (
    <div className="min-h-screen p-6">
      <Helmet>
        <title>Subscription & Transactions | GenWrite</title>
      </Helmet>

      <div className="space-y-12">
        {/* Simple Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-blue-600 tracking-tight">
            Subscription & Transactions
          </h1>
          <p className="text-gray-500 text-sm mt-2 max-w-md">
            Manage your active subscription, update billing details, and track your past
            transactions all in one place.
          </p>
        </div>

        {/* Current Plan Section */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
          >
            <div className="p-8 space-y-8">
              {/* Plan Identity Row */}
              <h2 className="text-xl font-semibold text-gray-800">Your Current Plan</h2>
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                    <Zap size={28} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-900 capitalize">
                      {user?.subscription?.plan || "Free"} Tier
                    </h3>
                    <div className="badge text-sm bg-green-50 text-green-700 rounded-sm border border-green-200 uppercase">
                      {user?.subscription?.status || "ACTIVE"}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Started on:
                  </span>
                  <p className="text-slate-900 font-bold">
                    {user?.subscription?.startDate
                      ? new Date(user.subscription.startDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Not started"}
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-50 w-full" />

              {/* Renewal & Credits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                      Renews on:
                    </span>
                    <p className="text-slate-800 font-bold">
                      {user?.subscription?.renewalDate
                        ? new Date(user.subscription.renewalDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Free Plan"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                      Total Credits:
                    </span>
                    <p className="text-slate-800 font-bold">{totalCreditsValue}</p>
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={() => navigate("/pricing")}
                  className="flex-1 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  Upgrade Plan <ChevronRight size={18} />
                </button>
                <button
                  disabled={showTrialMessage}
                  onClick={() => navigate("/cancel-subscription")}
                  className="flex-1 px-4 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl h-14 font-bold normal-case text-base transition-all"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 md:p-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
              </div>
              <button
                onClick={() => refetch()}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                title="Refresh history"
              >
                <RefreshCw className={clsx("size-5", loading && "animate-spin")} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 border-y border-slate-100 hover:bg-slate-50/50">
                    <TableHead
                      onClick={() => requestSort("createdAt")}
                      className="cursor-pointer hover:text-blue-600 py-5 pl-8 text-sm text-slate-400 font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        Date{" "}
                        {sortConfig.key === "createdAt" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="text-sm font-bold text-slate-400">
                      Type
                    </TableHead>
                    <TableHead className="text-sm font-bold text-slate-400">
                      Plan
                    </TableHead>
                    <TableHead className="text-sm font-bold text-slate-400">
                      Credits
                    </TableHead>
                    <TableHead className="text-sm font-bold text-slate-400 text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-sm font-bold text-slate-400">
                      Payment Method
                    </TableHead>
                    <TableHead className="text-sm font-bold text-slate-400 text-center">
                      Status
                    </TableHead>
                    <TableHead className="text-sm font-bold text-slate-400 text-center pr-8">
                      Invoice
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan="8" className="py-24 text-center">
                        <span className="loading loading-spinner text-blue-600"></span>
                      </TableCell>
                    </TableRow>
                  ) : sortedTransactions.length > 0 ? (
                    sortedTransactions.map((t, idx) => (
                      <TableRow
                        key={t._id || idx}
                        className="hover:bg-slate-50/50 transition-colors border-b border-slate-50"
                      >
                        <TableCell className="py-4 pl-8 text-sm font-semibold text-slate-700 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-slate-600 capitalize">
                            {t.type?.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-slate-600 capitalize">
                            {t.plan || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-slate-600">
                          {t.creditsAdded || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold text-slate-900">
                            ${((t.amount || 0) / 100).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-slate-500 italic">Card</span>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(t.status)}</TableCell>
                        <TableCell className="text-center pr-8">
                          {t.invoiceUrl ? (
                            <a
                              href={t.invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-600 transition-colors"
                              title="View Invoice"
                            >
                              <FileText size={18} className="mx-auto" />
                            </a>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="8" className="py-32 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <p className="text-slate-400 font-medium italic">
                            No transactions yet. Your purchase history will appear here.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Transactions
