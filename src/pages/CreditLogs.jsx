import { Table, Tag, Input, Select, Spin, Empty } from "antd"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Helmet } from "react-helmet"
import dayjs from "dayjs"
import { getCreditLogs } from "@store/slices/creditLogSlice"
import { getSocket } from "@utils/socket"
import { SearchOutlined } from "@ant-design/icons"
import { Search } from "lucide-react"
import Fuse from "fuse.js" // Import Fuse.js

const { Option } = Select

const CreditLogsTable = () => {
  const dispatch = useDispatch()
  const { logs, loading } = useSelector((state) => state.creditLogs)

  // Local State
  const [searchText, setSearchText] = useState("")
  const [dateRange, setDateRange] = useState("24h")
  const [purposeFilter, setPurposeFilter] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  const pageSizeOptions = [10, 20, 50, 100]
  const purposeOptions = [
    "BLOG_GENERATION",
    "QUICK_BLOG_GENERATION",
    "AI_PROOFREADING",
    "COMPETITOR_ANALYSIS",
    "SUBSCRIPTION_PAYMENT",
    "OTHER",
  ]

  // Initialize Fuse.js with logs data
  const fuse = useMemo(() => {
    return new Fuse(logs, {
      keys: ["metadata.title"], // Search in blog title
      threshold: 0.4, // Adjust for fuzzy search sensitivity (0 = exact match, 1 = very loose)
      ignoreLocation: true, // Allow matches anywhere in the string
      minMatchCharLength: 2, // Minimum characters to start matching
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
      result = result.filter((log) => purposeFilter.includes(log.purpose))
    }

    return result
  }, [logs, searchText, purposeFilter, fuse])

  // Calculate date range for backend fetch
  const getDateRangeParams = (range) => {
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

  // Fetch Logs from backend
  useEffect(() => {
    const params = {
      page: 1,
      limit: -1,
      ...getDateRangeParams(dateRange),
    }
    dispatch(getCreditLogs(params))
  }, [dispatch, dateRange])

  const purposeColorMap = {
    BLOG_GENERATION: "bg-blue-100 text-blue-700",
    QUICK_BLOG_GENERATION: "bg-indigo-100 text-indigo-700",
    AI_PROOFREADING: "bg-green-100 text-green-700",
    COMPETITOR_ANALYSIS: "bg-yellow-100 text-yellow-800",
    SUBSCRIPTION_PAYMENT: "bg-purple-100 text-purple-700",
    OTHER: "bg-gray-100 text-gray-700",
  }

  // Responsive Table Columns
  const columns = useMemo(
    () => [
      {
        title: "Blog Topic",
        dataIndex: ["metadata", "title"],
        key: "blogTitle",
        render: (title) => (
          <div>
            <span className="text-xs sm:text-sm text-gray-700 capitalize">{title || "-"}</span>
          </div>
        ),
      },
      {
        title: "Date",
        dataIndex: "createdAt",
        key: "createdAt",
        sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        render: (date) => (
          <span className="text-xs sm:text-sm text-gray-600">
            {dayjs(date).format("DD MMM YYYY, hh:mm A")}
          </span>
        ),
      },
      {
        title: "Type",
        dataIndex: "category",
        key: "category",
        filters: [
          { text: "Deduction", value: "DEDUCTION" },
          { text: "Adjustment", value: "ADJUSTMENT" },
        ],
        onFilter: (value, record) => record.category === value,
        render: (category) => (
          <Tag
            color={category === "DEDUCTION" ? "red" : "green"}
            className="font-medium px-2 sm:px-3 py-1 rounded-full text-xs"
          >
            {category}
          </Tag>
        ),
      },
      {
        title: "Purpose",
        dataIndex: "purpose",
        key: "purpose",
        filters: purposeOptions.map((purpose) => ({
          text: purpose.toLowerCase().replace(/_/g, " "),
          value: purpose,
        })),
        filterMultiple: true,
        onFilter: (value, record) => record.purpose === value,
        render: (purpose) => {
          const colorClass = purposeColorMap[purpose] || "bg-gray-100 text-gray-700"
          const label = purpose?.toLowerCase().replace(/_/g, " ") || "-"
          return (
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold capitalize ${colorClass}`}
            >
              {label}
            </span>
          )
        },
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        sorter: (a, b) => a.amount - b.amount,
        render: (amount) => (
          <span
            className={`font-semibold text-xs sm:text-sm ${
              amount < 0 ? "text-red-500" : "text-green-600"
            }`}
          >
            {amount > 0 ? `+${amount}` : amount}
          </span>
        ),
      },
      {
        title: "Remaining Credits",
        dataIndex: "remainingCredits",
        key: "remainingCredits",
        responsive: ["md"],
        render: (credits) => (
          <span className="text-xs sm:text-sm font-medium text-gray-800">{credits}</span>
        ),
      },
    ],
    [purposeColorMap]
  )

  // WebSocket for real-time updates
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleCreditLogUpdate = () => {
      dispatch(
        getCreditLogs({
          page: 1,
          limit: -1,
          ...getDateRangeParams(dateRange),
        })
      )
    }

    socket.on("credit-log", handleCreditLogUpdate)

    return () => {
      socket.off("credit-log", handleCreditLogUpdate)
    }
  }, [dispatch, dateRange])

  // Paginate filtered data client-side
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    return filteredLogs.slice(startIndex, endIndex)
  }, [filteredLogs, pagination.current, pagination.pageSize])

  return (
    <AnimatePresence>
      <Helmet>
        <title>Credit Logs | GenWrite</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="p-8 bg-white rounded-2xl w-full max-w-full"
      >
        <div className="flex flex-col gap-4 mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Credit Logs
          </h2>
          <p className="text-gray-500 text-sm max-w-lg" style={{ opacity: 1 }}>
            All your credits, all in one spot. Check your activity, track your transactions, and
            never miss a beat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative w-full">
              <input
                placeholder="Search by blog title"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  setPagination((prev) => ({ ...prev, current: 1 }))
                }}
                className="w-full rounded-lg border border-gray-300 px-10 py-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Search credit logs by blog title"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <Select
              value={dateRange}
              onChange={(value) => {
                setDateRange(value)
                setPagination((prev) => ({ ...prev, current: 1 }))
                dispatch(
                  getCreditLogs({
                    page: 1,
                    limit: -1,
                    ...getDateRangeParams(value),
                  })
                )
              }}
              className="w-full sm:w-48 rounded-lg text-xs sm:text-sm"
              popupClassName="rounded-lg"
              aria-label="Select date range"
            >
              <Option value="24h">Last 24 Hours</Option>
              <Option value="7d">Last 7 Days</Option>
              <Option value="30d">Last 30 Days</Option>
            </Select>
            <Select
              value={pagination.pageSize}
              onChange={(value) => {
                setPagination((prev) => ({ ...prev, pageSize: value, current: 1 }))
              }}
              options={pageSizeOptions.map((size) => ({
                label: `${size} / page`,
                value: size,
              }))}
              className="w-full sm:w-32 rounded-lg text-xs sm:text-sm"
              popupClassName="rounded-lg"
              aria-label="Select page size"
            />
          </div>
        </div>

        <style>
          {`
            .ant-table-container {
              overflow-x: auto;
              -webkit-overflow: auto;
            }
            .ant-table-thead {
              position: sticky;
              top: 0;
              z-index: 10;
              background: #fafafa;
            }
            .ant-table-thead > tr > th {
              background: #fafafa !important;
              white-space: nowrap;
            }
            .ant-table-cell {
              white-space: nowrap;
            }
            @media (max-width: 640px) {
              .ant-table-tbody > tr > td {
                padding: 8px !important;
                font-size: 12px !important;
              }
              .ant-table-thead > tr > th {
                padding: 8px !important;
                font-size: 12px !important;
              }
            }
            @media (max-width: 768px) {
              .ant-table-tbody > tr > td {
                padding: 10px !important;
              }
              .ant-table-thead > tr > th {
                padding: 10px !important;
              }
            }
          `}
        </style>
        <Table
          dataSource={paginatedData}
          columns={columns}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredLogs.length, // Use filteredLogs length for pagination
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} logs`,
            onChange: (page) => {
              setPagination((prev) => ({ ...prev, current: page }))
            },
            responsive: true,
            pageSizeOptions: pageSizeOptions,
            className: "text-xs sm:text-sm",
          }}
          className="rounded-xl overflow-hidden w-full"
          rowClassName="hover:bg-gray-50 transition-colors duration-200"
          bordered={false}
          locale={{
            emptyText: loading ? (
              <Spin tip="Loading logs..." />
            ) : (
              <Empty
                description={
                  searchText || purposeFilter.length > 0
                    ? "No logs match the filters"
                    : "No Logs Found"
                }
              />
            ),
          }}
          onChange={(paginationInfo, filters, sorter, extra) => {
            const newPurposeFilter = filters.purpose || []
            setPurposeFilter(newPurposeFilter)
            setPagination({
              current: paginationInfo.current,
              pageSize: paginationInfo.pageSize,
            })
          }}
          scroll={{ x: "max-content" }}
        />
      </motion.div>
    </AnimatePresence>
  )
}

export default CreditLogsTable
