import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  BarChart3,
  Image,
  Zap,
  Globe,
  Clock,
  CreditCard,
  DollarSign,
  Calendar,
  ArrowRight,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import { useTransactionsQuery } from "@api/queries/userQueries"
import { useNavigate } from "react-router-dom"
import { clsx } from "clsx"

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

  const isProPlan = user?.subscription?.plan === "pro"

  const getStatusBadge = status => {
    switch (status) {
      case "success":
        return (
          <div className="badge badge-success gap-1 text-white font-bold text-xs border-none">
            <CheckCircle2 className="size-3" /> SUCCESS
          </div>
        )
      case "failed":
        return (
          <div className="badge badge-error gap-1 text-white font-bold text-xs border-none">
            <XCircle className="size-3" /> FAILED
          </div>
        )
      case "pending":
        return (
          <div className="badge badge-warning gap-1 text-white font-bold text-xs border-none">
            <Clock className="size-3" /> PENDING
          </div>
        )
      default:
        return <div className="badge badge-ghost font-bold text-xs">{status.toUpperCase()}</div>
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-linear-to-br from-slate-50 via-gray-50 to-indigo-50/20">
      <Helmet>
        <title>Subscription & Transactions | GenWrite</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Subscription & Transactions
            </h1>
            <p className="text-gray-500 font-medium text-lg mt-3 max-w-xl">
              Manage your premium access, track payments, and review your credit history in one
              unified dashboard.
            </p>
          </div>
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${isProPlan ? "indigo" : "emerald"}-100`}
            >
              <ShieldCheck className={`size-6 text-${isProPlan ? "indigo" : "emerald"}-600`} />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Current Tier
              </p>
              <p className="text-lg font-black text-gray-900 capitalize">
                {user?.subscription?.plan || "Free"}
              </p>
            </div>
          </div>
        </div>

        {/* Current Plan Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-[32px] shadow-xl shadow-blue-100/20 border border-gray-100 mb-10 overflow-hidden"
        >
          <div className="md:flex">
            {/* Left: Plan Summary */}
            <div className="p-8 md:p-10 md:w-2/3 border-b md:border-b-0 md:border-r border-gray-100">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${isProPlan ? "indigo" : "emerald"}-600 shadow-lg shadow-${isProPlan ? "indigo" : "emerald"}-100`}
                  >
                    <Zap className="size-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 leading-none">
                      <span className="capitalize">{user?.subscription?.plan}</span> Plan
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className={`badge ${user?.subscription?.status === "active" ? "badge-success" : "badge-ghost"} text-white border-none font-bold text-[10px] tracking-widest`}
                      >
                        {user?.subscription?.status?.toUpperCase() || "INACTIVE"}
                      </div>
                      {user?.subscription?.startDate && (
                        <span className="text-sm font-medium text-gray-400 italic">
                          Since {new Date(user.subscription.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">
                    Total Credits
                  </p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-emerald-500" />
                    <span className="text-3xl font-black text-gray-900">
                      {user?.totalCredits || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Calendar className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                      {user?.subscription?.cancelAt ? "Cancels On" : "Next Renewal"}
                    </p>
                    <p className="text-gray-900 font-bold">
                      {user?.subscription?.renewalDate
                        ? new Date(
                            user?.subscription?.cancelAt || user.subscription.renewalDate
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Free Plan"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <DollarSign className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                      Billing Details
                    </p>
                    <p className="text-gray-900 font-bold">Automatic Billing Secure</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="p-8 md:p-10 md:w-1/3 bg-gray-50/50 flex flex-col justify-center space-y-4">
              <button
                onClick={() => navigate("/pricing")}
                className="btn btn-primary btn-lg w-full rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 border-none text-white font-black text-lg h-16 shadow-xl shadow-blue-200 hover:scale-[1.02] transition-all normal-case gap-2"
              >
                Upgrade Plan <ChevronRight className="size-5" />
              </button>

              {user?.subscription?.status !== "trialing" && (
                <button
                  disabled={showTrialMessage}
                  onClick={() => navigate("/cancel-subscription")}
                  className="btn btn-ghost btn-lg w-full rounded-2xl font-bold text-gray-500 hover:text-rose-600 hover:bg-rose-50 normal-case h-16"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Scheduled Plan Change Notice */}
        {Object.keys(user?.subscription?.scheduledPlanChange || {}).length === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 bg-linear-to-r from-blue-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-xl shadow-blue-200 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
              <Clock className="size-32" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Zap className="size-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Plan Migration Scheduled</h3>
                  <p className="text-blue-100 font-medium">
                    Your plan will change to{" "}
                    <span className="text-white font-bold capitalize">
                      {user.subscription.scheduledPlanChange.newPlan}
                    </span>{" "}
                    on{" "}
                    {new Date(
                      user.subscription.scheduledPlanChange.effectiveDate ||
                        user.subscription.renewalDate
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="badge badge-lg bg-white/20 border-none text-white font-black p-4">
                {user.subscription.scheduledPlanChange.newBillingPeriod?.toUpperCase()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Transactions Section */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <CreditCard className="size-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Recent Transactions
              </h2>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input input-bordered w-full pl-10 h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white focus:border-indigo-500 font-medium text-sm transition-all"
                />
              </div>
              <button
                onClick={() => refetch()}
                className="btn btn-square btn-ghost hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                title="Refresh history"
              >
                <RefreshCw className={clsx("size-5", loading && "animate-spin")} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full overflow-hidden border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50/30">
                  <th
                    onClick={() => requestSort("createdAt")}
                    className="cursor-pointer hover:bg-gray-100 py-6 pl-8"
                  >
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                      Date{" "}
                      {sortConfig.key === "createdAt" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        ))}
                    </div>
                  </th>
                  <th className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Type
                  </th>
                  <th className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Plan
                  </th>
                  <th className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Credits
                  </th>
                  <th className="text-xs font-black uppercase tracking-widest text-gray-400 text-right">
                    Amount
                  </th>
                  <th className="text-xs font-black uppercase tracking-widest text-gray-400 text-center">
                    Status
                  </th>
                  <th className="py-6 pr-8 text-xs font-black uppercase tracking-widest text-gray-400 text-center">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-32 text-center">
                      <span className="loading loading-spinner loading-lg text-indigo-600"></span>
                      <p className="text-gray-400 mt-4 font-bold italic">
                        Gathering transaction data...
                      </p>
                    </td>
                  </tr>
                ) : sortedTransactions.length > 0 ? (
                  sortedTransactions.map((t, idx) => (
                    <tr
                      key={t._id || idx}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="py-5 pl-8 text-sm font-bold text-gray-900">
                        {new Date(t.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>
                        <div
                          className={`badge ${t.type === "subscription" ? "badge-info" : "badge-ghost"} text-[10px] font-black tracking-widest text-white border-none py-2.5`}
                        >
                          {t.type?.replace(/_/g, " ").toUpperCase()}
                        </div>
                      </td>
                      <td>
                        {t.plan ? (
                          <div className="badge badge-outline border-indigo-200 text-indigo-600 text-[10px] font-black tracking-widest py-2.5">
                            {t.plan.toUpperCase()}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="text-sm font-black text-gray-600">{t.creditsAdded || 0}</td>
                      <td className="text-right">
                        <span className="text-sm font-black text-emerald-600">
                          ${((t.amount || 0) / 100).toFixed(2)} {t.currency?.toUpperCase() || "USD"}
                        </span>
                      </td>
                      <td className="text-center">{getStatusBadge(t.status)}</td>
                      <td className="py-5 pr-8 text-center">
                        {t.invoiceUrl ? (
                          <a
                            href={t.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-sm group-hover:bg-white text-indigo-600 font-black rounded-lg gap-2 normal-case"
                          >
                            <FileText className="size-4" /> View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-24 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="size-8 text-gray-200" />
                      </div>
                      <h3 className="text-lg font-black text-gray-900 mb-1">
                        No Transactions Found
                      </h3>
                      <p className="text-gray-400 font-medium">
                        Your purchase history will appear here once you subscribe.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Transactions
