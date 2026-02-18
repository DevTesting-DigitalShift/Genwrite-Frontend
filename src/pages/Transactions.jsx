import { useEffect, useState } from "react"
import { Table, Tag, Tooltip, Progress, Card, Row, Col, Avatar, Statistic } from "antd"
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
} from "lucide-react"
import { Helmet } from "react-helmet"
import useAuthStore from "@store/useAuthStore"
import { useTransactionsQuery } from "@api/queries/userQueries"
import { useNavigate } from "react-router-dom"
import { ReloadOutlined } from "@ant-design/icons"
import { clsx } from "clsx"

const { Meta } = Card

const Transactions = () => {
  const { user, integration, loadAuthenticatedUser } = useAuthStore()
  const { data: transactions = [], isLoading: loading, refetch } = useTransactionsQuery()
  const navigate = useNavigate()

  const showTrialMessage =
    user?.subscription?.plan === "free" && user?.subscription?.status === "unpaid"

  useEffect(() => {
    loadAuthenticatedUser()
  }, [loadAuthenticatedUser])

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: date =>
        new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
      width: 140,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: type => (
        <Tag color={type === "subscription" ? "blue" : "gold"} className="text-xs">
          {type.replace(/_/g, " ").toUpperCase()}
        </Tag>
      ),
      width: 100,
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      render: plan =>
        plan ? (
          <Tag color="purple" className="text-xs">
            {plan.toUpperCase()}
          </Tag>
        ) : (
          "-"
        ),
      width: 80,
    },
    {
      title: "Credits",
      dataIndex: "creditsAdded",
      key: "creditsAdded",
      render: credits => <span className="text-sm font-medium">{credits || 0}</span>,
      width: 80,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt, record) => (
        <span className="text-sm font-semibold text-green-600">
          ${((amt || 0) / 100).toFixed(2)} {record.currency?.toUpperCase() || "USD"}
        </span>
      ),
      width: 100,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      responsive: ["md"],
      render: pm => <span className="text-sm">{pm?.toUpperCase() || "-"}</span>,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: status => {
        const colorMap = { success: "green", failed: "red", pending: "orange", default: "default" }
        const color = colorMap[status] || "default"
        return (
          <Tag color={color} className="text-xs font-medium">
            {status.toUpperCase()}
          </Tag>
        )
      },
      filters: [
        { text: "Success", value: "success" },
        { text: "Pending", value: "pending" },
        { text: "Failed", value: "failed" },
      ],
      onFilter: (value, record) => record.status === value,
      width: 100,
    },
    {
      title: "Invoice",
      dataIndex: "invoiceUrl",
      key: "invoiceUrl",
      responsive: ["md"],
      render: url =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            View
          </a>
        ) : (
          "-"
        ),
      width: 80,
    },
  ]

  const isProPlan = user?.subscription?.plan === "pro"
  const totalCredits = user?.totalCredits || 0
  const createdJobsUsage = user?.usage?.createdJobs || 0
  const aiImagesUsage = user?.usage?.aiImages || 0
  const createdJobsLimit = user?.usageLimits?.createdJobs || 100
  const aiImagesLimit = user?.usageLimits?.aiImages || 100

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <Helmet>
        <title>Subscription & Transactions | GenWrite</title>
      </Helmet>

      <div class="flex-1 mt-5 mb-10 p-2 md:mt-0 md:p-0">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Subscription & Transactions
        </h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md">
          Manage your active subscription, update billing details, and track your past transactions
          all in one place.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="p-3 md:p-6 bg-white mb-10 rounded-xl shadow-sm transition-all duration-300 border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Your Current Plan</h2>
        </div>

        {/* Plan Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${
                isProPlan ? "blue" : "green"
              }-100`}
            >
              <Zap className={`w-6 h-6 text-${isProPlan ? "blue" : "green"}-600`} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                <span className="capitalize">{user?.subscription?.plan}</span> Tier
              </h3>
              <Tag
                color={user?.subscription?.status === "active" ? "green" : "default"}
                className="mt-1"
              >
                {user?.subscription?.status?.toUpperCase() || "INACTIVE"}
              </Tag>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm text-gray-600 mb-1">Started on:</p>
            <p className="font-semibold text-gray-900">
              {user?.subscription?.startDate
                ? new Date(user.subscription.startDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>

        {/* Grid Info */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center space-x-3 text-gray-600">
            <Calendar className="w-5 h-5 text-purple-500" />
            <div>
              <span className="font-medium block">
                {user?.subscription?.cancelAt ? "Cancel At:" : "Renews on:"}
              </span>
              <span className="text-gray-800 font-semibold text-sm">
                {user?.subscription?.renewalDate
                  ? new Date(
                      user?.subscription?.cancelAt
                        ? user.subscription.cancelAt
                        : user.subscription.renewalDate
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Free Plan"}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-gray-600">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <span className="font-medium block">Total Credits:</span>
              <span className="text-gray-800 font-semibold text-sm">{user?.totalCredits || 0}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <button
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-150 transform hover:scale-[1.01] flex items-center justify-center space-x-2"
            onClick={() => navigate("/pricing")}
          >
            <span>Upgrade Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {user?.subscription?.status !== "trialing" && (
            <button
              disabled={showTrialMessage}
              onClick={() => navigate("/cancel-subscription")}
              className={`flex-1 px-4 py-2 font-semibold rounded-lg shadow-sm transition duration-150 
    ${
      showTrialMessage
        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
        : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
    }`}
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </motion.div>

      {Object.keys(user?.subscription?.scheduledPlanChange || {}).length === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-3 md:p-6 bg-white mb-10 rounded-xl shadow-sm transition-all duration-300 border border-gray-100"
        >
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Your Upcoming Plan</h2>
          </div>

          {/* Plan Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b pb-4">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${
                  isProPlan ? "blue" : "green"
                }-100`}
              >
                <Zap
                  className={`w-6 h-6 text-${
                    user.subscription.scheduledPlanChange.newPlan == "pro" ? "blue" : "green"
                  }-600`}
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  <span className="capitalize">
                    {user.subscription.scheduledPlanChange.newPlan}
                  </span>{" "}
                  Tier
                </h3>
                <Tag
                  color={user?.subscription?.status === "active" ? "green" : "default"}
                  className="mt-1"
                >
                  {user?.subscription?.scheduledPlanChange?.newBillingPeriod}
                </Tag>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-600 mb-1">Effective on:</p>
              <p className="font-semibold text-gray-900">
                {user?.subscription?.startDate
                  ? new Date(
                      user.subscription.scheduledPlanChange?.effectiveDate ||
                        user.subscription.renewalDate
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-xl shadow overflow-hidden"
      >
        <div className="flex flex-row justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
          </div>
          <Tooltip title="Refresh">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-sm flex items-center justify-center"
            >
              <ReloadOutlined className="w-4 h-4" />
            </motion.button>
          </Tooltip>
        </div>
        <div className="overflow-x-auto">
          <Table
            rowKey="_id"
            loading={loading}
            dataSource={transactions}
            columns={columns}
            pagination={{ pageSize: 10, showSizeChanger: false, showQuickJumper: false }}
            className="border-none"
            rowClassName={(record, index) =>
              index % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-50"
            }
            locale={{ emptyText: "No transactions yet. Your purchase history will appear here." }}
          />
        </div>
      </motion.div>
    </div>
  )
}

export default Transactions
