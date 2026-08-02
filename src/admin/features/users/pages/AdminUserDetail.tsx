import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  Mail,
  Package,
  PieChart as PieChartIcon,
  Shield,
  Target,
  TrendingUp,
  X,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import type {
  UserAnalyticsResponse,
  UserBlogsResponse,
  UserBrandAnalyticsResponse,
  UserDetailsResponse,
  UserJobAnalyticsResponse,
  UserTransactionAnalyticsResponse,
} from "@admin/types/admin"
import { BarChart } from "@admin/shared/charts/BarChart"
import { PieChart } from "@admin/shared/charts/PieChart"
import { EmptyState } from "@admin/shared/components/EmptyState"
import { ErrorAlert } from "@admin/shared/components/ErrorAlert"
import LoadingState from "@admin/shared/components/LoadingState"
import {
  getUserAnalytics,
  getUserBlogs,
  getUserBrandAnalytics,
  getUserDetails,
  getUserJobAnalytics,
  getUserTransactionAnalytics,
  updateAdminUserCredits,
  updateAdminUserSubscription,
  updateUser,
} from "../api/usersApi"

const formatDate = (date: string | Date | undefined, includeTime = false): string => {
  if (!date) return "N/A"
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return "N/A"

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  }
  return new Intl.DateTimeFormat("en-US", options).format(d)
}

type EditMode = "role" | "credits" | "subscription" | "usage" | "usageLimits" | null
type TransactionView = "transactions" | "creditHistory"
type BlogRow = UserBlogsResponse["blogs"][number]

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserDetailsResponse | null>(null)
  const [analytics, setAnalytics] = useState<UserAnalyticsResponse | null>(null)
  const [blogs, setBlogs] = useState<BlogRow[]>([])
  const [brandAnalytics, setBrandAnalytics] = useState<UserBrandAnalyticsResponse | null>(null)
  const [jobAnalytics, setJobAnalytics] = useState<UserJobAnalyticsResponse | null>(null)
  const [transactionAnalytics, setTransactionAnalytics] =
    useState<UserTransactionAnalyticsResponse | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editRole, setEditRole] = useState<"user" | "admin">("user")
  const [editCreditsAction, setEditCreditsAction] = useState<"add" | "deduct" | "set">("add")
  const [editCreditsAmount, setEditCreditsAmount] = useState("")
  const [editSubPlan, setEditSubPlan] = useState<"free" | "basic" | "pro">("free")
  const [editSubStatus, setEditSubStatus] = useState("")
  const [editUsageBlogs, setEditUsageBlogs] = useState(0)
  const [editUsageImages, setEditUsageImages] = useState(0)
  const [editLimitBlogs, setEditLimitBlogs] = useState(0)
  const [editLimitImages, setEditLimitImages] = useState(0)
  const [transactionView, setTransactionView] = useState<TransactionView>("transactions")

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setIsLoading(true)
      const [userData, analyticsData, blogsData, brandData, jobData, transactionData] =
        await Promise.all([
          getUserDetails(userId),
          getUserAnalytics(userId),
          getUserBlogs(userId, { limit: 10 }),
          getUserBrandAnalytics(userId),
          getUserJobAnalytics(userId),
          getUserTransactionAnalytics(userId),
        ])

      setUser(userData)
      setAnalytics(analyticsData)
      setBlogs(blogsData.blogs || [])
      setBrandAnalytics(brandData)
      setJobAnalytics(jobData)
      setTransactionAnalytics(transactionData)
    } catch (err) {
      console.error("Failed to fetch user details:", err)
      setError(err instanceof Error ? err.message : "Failed to load user details")
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const startEditCredits = () => {
    setEditCreditsAction("add")
    setEditCreditsAmount("")
    setEditMode("credits")
  }

  const saveCredits = async () => {
    if (!userId) return
    try {
      setIsSubmitting(true)
      await updateAdminUserCredits(userId, {
        action: editCreditsAction,
        amount: Number.parseInt(editCreditsAmount, 10),
      })
      setEditMode(null)
      await fetchData()
    } catch (err) {
      console.error("Failed to update credits:", err)
      alert(err instanceof Error ? err.message : "Failed to update credits")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditSubscription = () => {
    if (!user) return
    setEditSubPlan(user.subscription.plan as "free" | "basic" | "pro")
    setEditSubStatus(user.subscription.status)
    setEditMode("subscription")
  }

  const saveSubscription = async () => {
    if (!userId) return
    try {
      setIsSubmitting(true)
      await updateAdminUserSubscription(userId, {
        plan: editSubPlan,
        status: editSubStatus as "active" | "cancelled" | "expired",
      })
      setEditMode(null)
      await fetchData()
    } catch (err) {
      console.error("Failed to update subscription:", err)
      alert(err instanceof Error ? err.message : "Failed to update subscription")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditRole = () => {
    if (!user) return
    setEditRole(user.role as "user" | "admin")
    setEditMode("role")
  }

  const saveRole = async () => {
    if (!userId) return
    try {
      setIsSubmitting(true)
      await updateUser(userId, { role: editRole })
      setEditMode(null)
      await fetchData()
    } catch (err) {
      console.error("Failed to update role:", err)
      alert(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditUsage = () => {
    if (!user) return
    setEditUsageBlogs(user.usage?.createdJobs || 0)
    setEditUsageImages(user.usage?.aiImages || 0)
    setEditMode("usage")
  }

  const saveUsage = async () => {
    if (!userId) return
    try {
      setIsSubmitting(true)
      await updateUser(userId, { usage: { blogs: editUsageBlogs, images: editUsageImages } })
      setEditMode(null)
      await fetchData()
    } catch (err) {
      console.error("Failed to update usage:", err)
      alert(err instanceof Error ? err.message : "Failed to update usage")
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditLimits = () => {
    if (!user) return
    setEditLimitBlogs(user.usageLimits?.createdJobs || 0)
    setEditLimitImages(user.usageLimits?.aiImages || 0)
    setEditMode("usageLimits")
  }

  const saveLimits = async () => {
    if (!userId) return
    try {
      setIsSubmitting(true)
      await updateUser(userId, { usageLimits: { blogs: editLimitBlogs, images: editLimitImages } })
      setEditMode(null)
      await fetchData()
    } catch (err) {
      console.error("Failed to update usage limits:", err)
      alert(err instanceof Error ? err.message : "Failed to update usage limits")
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelEdit = () => setEditMode(null)

  if (isLoading) return <LoadingState />

  if (error || !user) {
    return (
      <div className="p-4 sm:p-8">
        <ErrorAlert
          message={error || "User not found"}
          onAction={() => navigate("/admin/users")}
          actionLabel="Back to Users"
        />
      </div>
    )
  }

  const aiModelData =
    analytics?.aiModelsUsed.map((item) => ({ name: item.model, value: item.count })) || []
  const templateData =
    analytics?.templatesUsed.map((item) => ({ name: item.template, value: item.count })) || []

  return (
    <main className="max-container mx-auto space-y-6">
      <div className="rounded-xl p-6 border shadow bg-linear-to-r from-sky-200 to-purple-100 text-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-slate-900">{user.name}</h1>

            <div className="flex flex-wrap gap-3 text-sm text-slate-800">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-700" />
                {user.email}
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-700" />
                Joined {formatDate(user.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editMode === "role" ? (
              <div className="flex items-center gap-2 bg-white/40 rounded-lg p-2">
                <Select
                  value={editRole}
                  onValueChange={(v: string) => setEditRole(v as "user" | "admin")}
                >
                  <SelectTrigger className="w-32 h-8 bg-white text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-white/60 text-slate-900"
                  onClick={saveRole}
                  disabled={isSubmitting}
                >
                  <Check className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-white/60 text-slate-900"
                  onClick={cancelEdit}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Badge className="bg-white/50 text-slate-900 border border-white/60 capitalize">
                  <Shield className="w-3 h-3 mr-1 text-slate-800" />
                  {user.role}
                </Badge>

                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/40 text-slate-900 border-white/60 hover:bg-white/60"
                  onClick={startEditRole}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Blogs", value: analytics?.blogs.total || 0, icon: FileText },
            { label: "Credits", value: user.credits.base + user.credits.extra, icon: CreditCard },
            { label: "Jobs", value: jobAnalytics?.total || 0, icon: Briefcase },
            { label: "Brands", value: brandAnalytics?.total || 0, icon: Package },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/35 backdrop-blur-sm rounded-lg p-4 text-slate-900"
            >
              <div className="flex items-center gap-2 mb-1 text-slate-700">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-linear-to-br from-green-50 to-emerald-100 rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Credit Balance</h3>
                <p className="text-sm text-gray-600">Available credits</p>
              </div>
            </div>
            {editMode !== "credits" && (
              <Button size="sm" variant="outline" onClick={startEditCredits}>
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          {editMode === "credits" ? (
            <div className="space-y-3">
              <div className="bg-white/50 p-3 rounded-md">
                <p className="text-xs text-gray-600">Current Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {user.credits.base + user.credits.extra}
                </p>
              </div>
              <div>
                <label htmlFor="edit-credits-action" className="block text-xs text-gray-600 mb-1">
                  Action
                </label>
                <Select
                  value={editCreditsAction}
                  onValueChange={(v: string) => setEditCreditsAction(v as "add" | "deduct" | "set")}
                >
                  <SelectTrigger id="edit-credits-action" className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Credits</SelectItem>
                    <SelectItem value="deduct">Deduct Credits</SelectItem>
                    <SelectItem value="set">Set Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="edit-credits-amount" className="block text-xs text-gray-600 mb-1">
                  Amount
                </label>
                <input
                  id="edit-credits-amount"
                  type="number"
                  value={editCreditsAmount}
                  onChange={(e) => setEditCreditsAmount(e.target.value)}
                  min={0}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={saveCredits}
                  disabled={isSubmitting || !editCreditsAmount}
                  className="flex-1 bg-white"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1">
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Credits</span>
                <span className="font-semibold">{user.credits.base}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Extra Credits</span>
                <span className="font-semibold">{user.credits.extra}</span>
              </div>
              <div className="pt-2 border-t border-green-300 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-bold text-green-600">
                  {user.credits.base + user.credits.extra}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-linear-to-br from-purple-50 to-pink-100 rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Subscription</h3>
                <p className="text-sm text-gray-600">Current plan details</p>
              </div>
            </div>
            {editMode !== "subscription" && (
              <Button size="sm" variant="outline" onClick={startEditSubscription}>
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          {editMode === "subscription" ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-sub-plan" className="block text-xs text-gray-600 mb-1">
                  Plan
                </label>
                <Select
                  value={editSubPlan}
                  onValueChange={(v: string) => setEditSubPlan(v as "free" | "basic" | "pro")}
                >
                  <SelectTrigger id="edit-sub-plan" className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="edit-sub-status" className="block text-xs text-gray-600 mb-1">
                  Status
                </label>
                <Select value={editSubStatus} onValueChange={setEditSubStatus}>
                  <SelectTrigger id="edit-sub-status" className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={saveSubscription}
                  disabled={isSubmitting}
                  className="flex-1 bg-white"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1">
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold capitalize">{user.subscription.plan}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold capitalize">{user.subscription.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Renewal</span>
                <span className="font-semibold">
                  {user.subscription.renewalDate
                    ? formatDate(user.subscription.renewalDate)
                    : "N/A"}
                </span>
              </div>
              {user.subscription.canceledAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Canceled At</span>
                  <span className="font-semibold">{formatDate(user.subscription.canceledAt)}</span>
                </div>
              )}
              {user.subscription.paymentFailedSince && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Failed Since</span>
                  <span className="font-semibold text-red-600">
                    {formatDate(user.subscription.paymentFailedSince)}
                  </span>
                </div>
              )}
              {user.subscription.billingPeriod && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Billing Period</span>
                  <span className="font-semibold capitalize">
                    {user.subscription.billingPeriod}
                  </span>
                </div>
              )}
              {user.subscription.stripeCustomerId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stripe Customer ID</span>
                  <span
                    className="font-semibold text-xs mt-0.5 truncate max-w-[120px]"
                    title={user.subscription.stripeCustomerId}
                  >
                    {user.subscription.stripeCustomerId}
                  </span>
                </div>
              )}
              {user.subscription.stripeSubscriptionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stripe Sub ID</span>
                  <span
                    className="font-semibold text-xs mt-0.5 truncate max-w-[120px]"
                    title={user.subscription.stripeSubscriptionId}
                  >
                    {user.subscription.stripeSubscriptionId}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Current Usage (within a month)</h3>
                <p className="text-sm text-gray-600">Resources consumed</p>
              </div>
            </div>
            {editMode !== "usage" && (
              <Button size="sm" variant="outline" onClick={startEditUsage}>
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          {editMode === "usage" ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-usage-blogs" className="block text-xs text-gray-600 mb-1">
                  Jobs Created
                </label>
                <input
                  id="edit-usage-blogs"
                  type="number"
                  value={editUsageBlogs}
                  onChange={(e) => setEditUsageBlogs(Number.parseInt(e.target.value, 10) || 0)}
                  min={0}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label htmlFor="edit-usage-images" className="block text-xs text-gray-600 mb-1">
                  Images Generated
                </label>
                <input
                  id="edit-usage-images"
                  type="number"
                  value={editUsageImages}
                  onChange={(e) => setEditUsageImages(Number.parseInt(e.target.value, 10) || 0)}
                  min={0}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={saveUsage}
                  disabled={isSubmitting}
                  className="flex-1 bg-white"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1">
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Jobs Created</span>
                <span className="font-semibold">{user.usage?.createdJobs || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Images Generated</span>
                <span className="font-semibold">{user.usage?.aiImages || 0}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Usage Limits</h3>
                <p className="text-sm text-gray-600">Maximum allowed (0 = unlimited)</p>
              </div>
            </div>
            {editMode !== "usageLimits" && (
              <Button size="sm" variant="outline" onClick={startEditLimits}>
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          {editMode === "usageLimits" ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-limit-blogs" className="block text-xs text-gray-600 mb-1">
                  Blog Limit
                </label>
                <input
                  id="edit-limit-blogs"
                  type="number"
                  value={editLimitBlogs}
                  onChange={(e) => setEditLimitBlogs(Number.parseInt(e.target.value, 10) || 0)}
                  min={0}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label htmlFor="edit-limit-images" className="block text-xs text-gray-600 mb-1">
                  Image Limit
                </label>
                <input
                  id="edit-limit-images"
                  type="number"
                  value={editLimitImages}
                  onChange={(e) => setEditLimitImages(Number.parseInt(e.target.value, 10) || 0)}
                  min={0}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={saveLimits}
                  disabled={isSubmitting}
                  className="flex-1 bg-white"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1">
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Blog Limit</span>
                <span className="font-semibold">{user.usageLimits?.createdJobs || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Image Limit</span>
                <span className="font-semibold">{user.usageLimits?.aiImages || "-"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {(analytics?.ltv || analytics?.retention) && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Engagement & Value Analytics
            </h3>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {analytics.ltv && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Lifetime Value (LTV)</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${analytics.ltv.totalSpend.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.ltv.transactionCount}
                  </p>
                </div>
              </>
            )}
            {analytics.retention && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Recency Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-indigo-600">
                      {analytics.retention.recencyScore}/100
                    </p>
                    <span className="text-xs text-gray-500">
                      ({analytics.retention.daysSinceLastLogin} d ago)
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Age</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.retention.daysSinceRegistration} d
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">AI Model Usage</h3>
          </div>
          {aiModelData.length > 0 ? (
            <PieChart data={aiModelData} height={240} />
          ) : (
            <EmptyState
              title="No AI usage data"
              description="User hasn't used any AI models yet"
              height="240px"
            />
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Template Usage</h3>
          </div>
          {templateData.length > 0 ? (
            <BarChart data={templateData} xKey="name" yKey="value" height={240} color="#8B5CF6" />
          ) : (
            <EmptyState
              title="No template data"
              description="User hasn't used any templates yet"
              height="240px"
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Recent Blogs
          </h3>
        </div>
        <div className="divide-y">
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <div key={blog._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{blog.title || "Untitled"}</h4>
                    <div className="flex gap-3 mt-1 text-sm text-gray-500">
                      <span>Template: {blog.template || "Unknown"}</span>
                      <span>•</span>
                      <span>Model: {blog.aiModel || "N/A"}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(blog.createdAt, true)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8">
              <EmptyState
                title="No blogs"
                description="User hasn't created any blogs"
                height="120px"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-linear-to-r from-purple-50 to-blue-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Jobs ({jobAnalytics?.total || 0})
            </h3>
          </div>
          <div className="p-6">
            {jobAnalytics && jobAnalytics.jobs.length > 0 ? (
              <div className="space-y-3">
                {jobAnalytics.jobs.slice(0, 5).map((job) => (
                  <div
                    key={job._id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium capitalize">{job.name}</p>
                      <p className="text-xs text-gray-500">{job.createdBlogsCount} blogs created</p>
                    </div>
                    <Badge
                      variant={job.status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No jobs"
                description="User hasn't created any jobs"
                height="150px"
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-linear-to-r from-pink-50 to-orange-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-pink-600" />
              Brand Voices ({brandAnalytics?.total || 0})
            </h3>
          </div>
          <div className="p-6">
            {brandAnalytics && brandAnalytics.brands.length > 0 ? (
              <div className="space-y-3">
                {brandAnalytics.brands.slice(0, 5).map((brand) => (
                  <div key={brand._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{brand.nameOfVoice}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {brand.describeBrand || "No description"}
                        </p>
                      </div>
                      <Badge variant="secondary">{brand.blogCount}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No brands"
                description="User hasn't created any brand voices"
                height="150px"
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 sm:p-6 border-b bg-linear-to-r from-green-50 to-emerald-50">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                {transactionView === "transactions" ? "Transactions" : "Credit History"}
              </h3>
              <div className="flex gap-2 bg-green-200 border border-green-400 p-1 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => setTransactionView("transactions")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    transactionView === "transactions"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Transactions
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionView("creditHistory")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    transactionView === "creditHistory"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Credit History
                </button>
              </div>
            </div>
            <div className="flex gap-4 sm:gap-6 text-sm">
              <div className="text-left sm:text-right">
                <p className="text-gray-500 text-xs sm:text-sm">Total Spent</p>
                <p className="font-bold text-green-600">
                  ${transactionAnalytics?.totalSpent.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-gray-500 text-xs sm:text-sm">Count</p>
                <p className="font-bold">
                  {transactionView === "transactions"
                    ? transactionAnalytics?.total || 0
                    : analytics?.creditHistory?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="divide-y">
          {transactionView === "transactions" ? (
            transactionAnalytics && transactionAnalytics.recentTransactions.length > 0 ? (
              transactionAnalytics.recentTransactions.slice(0, 5).map((txn) => (
                <div key={txn._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <p className="font-medium capitalize">{txn.type}</p>
                      <p className="text-sm text-gray-500">{formatDate(txn.createdAt, true)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {txn.currency.toUpperCase()} ${(txn.amount / 100).toFixed(2)}
                      </span>
                      <Badge variant={txn.status === "succeeded" ? "default" : "destructive"}>
                        {txn.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8">
                <EmptyState
                  title="No transactions"
                  description="User hasn't made any transactions"
                  height="120px"
                />
              </div>
            )
          ) : analytics?.creditHistory && analytics.creditHistory.length > 0 ? (
            analytics.creditHistory.slice(0, 15).map((credit, index) => (
              <div
                key={credit._id || index}
                className="p-4 sm:p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge
                      className={
                        credit.category === "DEDUCTION"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : credit.category === "ADDITION"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                      }
                    >
                      {credit.category || "UNKNOWN"}
                    </Badge>
                    <span
                      className={`text-base sm:text-lg font-bold ${credit.amount > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {credit.amount > 0 ? "+" : ""}
                      {credit.amount} credits
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="sm:hidden">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Purpose:{" "}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {credit.purpose?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </div>

                      {credit.blog?.title && (
                        <div className="flex items-start gap-2 bg-blue-50 p-2 sm:p-3 rounded-md">
                          <FileText className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-blue-600 font-medium mb-0.5">Related Blog</p>
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {credit.blog.title}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(credit.createdAt, true)}
                      </div>
                    </div>

                    <div className="hidden sm:block text-right shrink-0">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Purpose:{" "}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {credit.purpose?.replace(/_/g, " ") || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8">
              <EmptyState
                title="No credit history"
                description="No credit changes recorded for this user"
                height="120px"
              />
            </div>
          )}
        </div>
      </div>

      {transactionAnalytics?.monthlyTrend && transactionAnalytics.monthlyTrend.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-linear-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Transaction Trends
            </h3>
            <p className="text-sm text-gray-600 mt-1">Monthly transaction activity</p>
          </div>
          <div className="p-6">
            <BarChart
              data={transactionAnalytics.monthlyTrend.map((item) => ({
                name: new Date(`${item._id}-01`).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                }),
                value: item.count,
              }))}
              xKey="name"
              yKey="value"
              height={280}
              color="#10B981"
            />
          </div>
        </div>
      )}
    </main>
  )
}
