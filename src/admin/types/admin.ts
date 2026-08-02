/**
 * Admin Panel TypeScript Types
 * Defines interfaces for all admin API responses and entities
 */

// ============================================================================
// Auth Types
// ============================================================================

/**
 * Response from initial admin login
 */
export interface AdminLoginResponse {
  message: string
  mfaRequired: boolean
  mfaEnabled: boolean
  tempToken?: string
  accessToken?: string
  user?: AdminUser
}

/**
 * Response from 2FA verification
 */
export interface Admin2FAVerifyResponse {
  message: string
  accessToken: string
  user: AdminUser
}

/**
 * Response from MFA setup
 */
export interface AdminMFASetupResponse {
  secret: string
  qrCode: string
}

/**
 * Response from MFA enable
 */
export interface AdminMFAEnableResponse {
  message: string
}

/**
 * Response from token refresh
 */
export interface AdminRefreshResponse {
  accessToken: string
}

/**
 * Admin user entity
 */
export interface AdminUser {
  _id: string
  name: string
  email: string
  role: "admin" | "user"
}

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Overview stats response
 */
export interface AdminStatsResponse {
  users: {
    totalUsers: number
    totalPro: number
    totalBasic: number
    activeUsers: number
    totalCredits: number
  }
  blogs: { totalBlogs: number; generatedToday: number; generatedThisMonth: number }
  jobs: { totalJobs: number }
  brands: { totalBrands: number }
  transactions: { totalRevenue: number; totalTransactions: number; successfulTransactions: number }
}

/**
 * Detailed stats response
 */
export interface AdminDetailedStatsResponse {
  popularTemplates: Array<{ _id: string; count: number }>
  popularAIModels: Array<{ _id: string; count: number }>
  activeCreatorsCount: number
  financial?: {
    arpu: number
    creditHealth: { consumed: number; purchased: number; burnRate: number }
    churn: { cancelledInPeriod: number; activeAtPeriodStart: number; churnRate: number }
    ltv: number | string
  }
}

// ============================================================================
// User Management Types
// ============================================================================

/**
 * Extended User Details Response
 */
export interface UserDetailsResponse {
  _id: string
  name: string
  email: string
  role: "user" | "admin"
  credits: { base: number; extra: number }
  subscription: {
    plan: string
    status: string
    startDate?: string
    renewalDate?: string
    cancelAt?: string
    canceledAt?: string
    stripeSubscriptionId?: string
    stripeCustomerId?: string
    paymentFailedSince?: string
    scheduledPlanChange?: string
    trialOpted?: boolean
    billingPeriod?: string
    discountApplied?: number
  }
  usage: { aiImages: number; createdJobs: number }
  usageLimits: { aiImages: number; createdJobs: number }
  createdAt: string
  lastLogin: string | null
  avatar?: string
  country?: string
}

/**
 * User Analytics Response
 */
export interface UserAnalyticsResponse {
  userId: string
  userName: string
  userEmail: string
  accountType?: string
  retention?: { daysSinceLastLogin: number; daysSinceRegistration: number; recencyScore: number }
  ltv?: { totalSpend: number; transactionCount: number }
  blogs: {
    total: number
    daily: number
    monthly: number
    yearly: number
    branded: number
    byJobMonthly: Array<{ _id: string; count: number }>
    monthlyTrend: Array<{ _id: string; count: number }>
    byStatus: Array<{ _id: string; count: number }>
  }
  aiModelsUsed: Array<{ model: string; count: number }>
  templatesUsed: Array<{ template: string; count: number }>
  jobs: {
    total: number
    byStatus: Array<{ status: string; count: number }>
    list: Array<{
      _id: string
      name: string
      status: string
      lastRun: string
      createdAt: string
      createdBlogsCount: number
    }>
    monthlyTrend: Array<{ _id: string; count: number }>
  }
  brands: {
    total: number
    list: Array<{
      _id: string
      nameOfVoice: string
      postLink: string
      describeBrand: string
      createdAt: string
      blogCount: number
    }>
    monthlyTrend: Array<{ _id: string; count: number }>
  }
  transactions: {
    total: number
    totalSpent: number
    creditsPurchased: number
    byType: Array<{ type: string; count: number }>
    byStatus: Array<{ status: string; count: number }>
    monthlyTrend: Array<{ _id: string; count: number }>
    recent: Array<{
      _id: string
      type: string
      amount: number
      currency: string
      status: string
      plan?: string
      createdAt: string
    }>
  }
  postings: { total: number; byPlatform: Array<{ platform: string; count: number }> }
  creditHistory: Array<any>
  subscription: {
    currentPlan: string
    currentStatus: string
    billingPeriod: string | null
    startDate: string | null
    endDate: string | null
    stripeCustomerId?: string
    stripeSubscriptionId?: string
  }
  currentCredits: { base: number; extra: number; total: number }
}

/**
 * Admin Managed User (List Item)
 */
export interface AdminManagedUser {
  _id: string
  name: string
  email: string
  role: string
  plan?: string
  credits?: { base: number; extra: number }
  subscription?: { plan: string; status: string }
  createdAt: string
  lastLogin?: string
}

/**
 * User list query parameters
 */
export interface AdminUserListParams {
  page?: number
  limit?: number
  search?: string
  userType?: "normal" | "trial" | "subscribed" | "test"
}

/**
 * User list response
 */
export interface AdminUserListResponse {
  users: AdminManagedUser[]
  total: number
  page: number
  totalPages: number
}

/**
 * Create user request body
 */
export interface AdminCreateUserInput {
  name: string
  email: string
  password: string
  role?: "user" | "admin"
  plan?: "free" | "basic" | "pro"
}

/**
 * Update user request body
 */
export interface UpdateUserInput {
  credits?: { base?: number; extra?: number }
  subscription?: {
    plan?: "free" | "basic" | "pro"
    status?: "active" | "cancelled" | "expired" | "trialing"
  }
  role?: "user" | "admin"
  usage?: { blogs?: number; images?: number }
  usageLimits?: { blogs?: number; images?: number }
}

/**
 * Update credits request body
 */
export interface AdminUpdateCreditsInput {
  action: "add" | "deduct" | "set"
  amount: number
}

/**
 * Update subscription request body
 */
export interface AdminUpdateSubscriptionInput {
  plan: "free" | "basic" | "pro"
  status?: "active" | "cancelled" | "expired"
}

/**
 * User Blogs Query
 */
export interface UserBlogsQuery {
  period?: "daily" | "monthly" | "yearly"
  page?: number
  limit?: number
}

/**
 * User Blogs Response
 */
export interface UserBlogsResponse {
  blogs: Array<{
    _id: string
    title: string
    slug: string
    template: string
    aiModel: string
    category: string
    createdAt: string
    status: string
  }>
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  aggregatedCounts: Array<{ period: string; count: number }>
}

/**
 * User Blog Analytics Response
 */
export interface UserBlogAnalyticsResponse {
  total: number
  daily: number
  monthly: number
  yearly: number
  branded: number
  aiModelsUsed: Array<{ model: string; count: number }>
  templatesUsed: Array<{ template: string; count: number }>
  byJobMonthly: Array<{ _id: string; count: number }>
  monthlyTrend: Array<{ _id: string; count: number }>
  byStatus: Array<{ _id: string; count: number }>
}

/**
 * User Brand Analytics Response
 */
export interface UserBrandAnalyticsResponse {
  total: number
  brands: Array<{
    _id: string
    nameOfVoice: string
    postLink: string
    describeBrand: string
    createdAt: string
    blogCount: number
  }>
  monthlyTrend: Array<{ _id: string; count: number }>
}

/**
 * User Job Analytics Response
 */
export interface UserJobAnalyticsResponse {
  total: number
  byStatus: Array<{ status: string; count: number }>
  jobs: Array<{
    _id: string
    name: string
    status: string
    lastRun: string
    createdAt: string
    createdBlogsCount: number
  }>
  blogsByJobMonthly: Array<{ _id: string; count: number }>
  monthlyTrend: Array<{ _id: string; count: number }>
}

/**
 * User Transaction Analytics Response
 */
export interface UserTransactionAnalyticsResponse {
  total: number
  byType: Array<{ type: string; count: number }>
  byStatus: Array<{ status: string; count: number }>
  totalSpent: number
  totalCreditsPurchased: number
  monthlyTrend: Array<{ _id: string; count: number }>
  recentTransactions: Array<{
    _id: string
    type: string
    amount: number
    currency: string
    status: string
    plan?: string
    createdAt: string
  }>
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Blog Analytics Query
 */
export interface BlogAnalyticsQuery {
  startDate?: string
  endDate?: string
}

/**
 * Blog Analytics Response
 */
export interface BlogAnalyticsResponse {
  total: number
  modelBreakdown: Array<{ model: string; count: number }>
  templateBreakdown: Array<{ template: string; count: number }>
  brandedBlogs: number
  categoryBreakdown: Array<{ category: string; count: number }>
  trends: {
    daily: Array<{ date: string; count: number }>
    monthly: Array<{ month: string; count: number }>
  }
  dateRange: { startDate: string; endDate: string }
  postedBlogs: number
  platformBreakdown: Array<{ platform: string; count: number }>
}

/**
 * Brand Analytics Query
 */
export interface BrandAnalyticsQuery {
  startDate?: string
  endDate?: string
}

/**
 * Brand Analytics Response
 */
export interface BrandAnalyticsResponse {
  totalBrands: number
  brandsWithBlogs: number
  topBrands: Array<{
    _id: string
    nameOfVoice: string
    postLink: string
    describeBrand: string
    createdAt: string
    blogCount: number
  }>
  brandsByUser: Array<{ userId: string; userName?: string; userEmail?: string; brandCount: number }>
  dateRange: { startDate: string; endDate: string }
}

/**
 * Job Analytics Query
 */
export interface JobAnalyticsQuery {
  startDate?: string
  endDate?: string
}

/**
 * Job Analytics Response
 */
export interface JobAnalyticsResponse {
  totalJobs: number
  jobsByStatus: Array<{ status: string; count: number }>
  jobsByType: Array<{ type: string | null; count: number }>
  jobsByUser: Array<{ user?: string; jobCount: number }>
  totalBlogsCreatedByJobs: number
  avgCompletionTimeMs: number
  avgCompletionTimeMinutes: string
  failureRate: number
  dateRange: { startDate: string; endDate: string }
}

/**
 * Revenue Analytics Query
 */
export interface RevenueAnalyticsQuery {
  startDate?: string
  endDate?: string
}

/**
 * Revenue Analytics Response
 */
export interface RevenueAnalyticsResponse {
  mrr: number
  arr: number
  transactions: { total: number; successful: number; failed: number; pending: number }
  repeatCustomers: number
  revenueByMonth: Array<{ month: string; revenue: number }>
  revenueByPlan: Array<{ plan: string; revenue: number; count: number }>
  revenueGrowth: number
  dateRange: { startDate: string; endDate: string }
}

// ============================================================================
// Transaction Types (Legacy/Support)
// ============================================================================

/**
 * Transaction entity
 */
export interface AdminTransaction {
  _id: string
  user?: { _id: string; name: string; email: string }
  userName?: string // Legacy support
  userEmail?: string // Legacy support
  amount: number
  currency: string
  type: string
  status: string
  createdAt: string
  creditsAdded?: number
  invoiceUrl?: string
  paymentMethod?: string
  plan?: string
  updatedAt?: string
}

/**
 * Transaction list query parameters
 */
export interface AdminTransactionListParams {
  page?: number
  limit?: number
  userId?: string
}

/**
 * Transaction list response
 */
export interface AdminTransactionListResponse {
  transactions: AdminTransaction[]
  total: number
  page: number
  pages: number
  [x: string]: any
}

// ============================================================================
// API Error Types
// ============================================================================

/**
 * Standard API error response
 */
export interface AdminAPIError {
  message: string
  statusCode?: number
  error?: string
}
