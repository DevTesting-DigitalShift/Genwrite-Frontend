import { Table, Tag, Tooltip, Input, Select, Spin, Empty } from "antd"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { SearchOutlined } from "@ant-design/icons"
import { Helmet } from "react-helmet"
import dayjs from "dayjs"
import { getCreditLogs } from "@store/slices/creditLogSlice"
import { debounce } from "lodash" // Assuming lodash for debouncing

const CreditLogsTable = () => {
  const dispatch = useDispatch()
  const { Option } = Select

  // Local State
  const [searchText, setSearchText] = useState("")
  const [dateRange, setDateRange] = useState("24h")
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  const pageSizeOptions = [10, 20, 50, 100]

  // Redux State
  const { logs, loading, totalLogs } = useSelector((state) => state.creditLogs)

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setSearchText(value)
        setPagination((prev) => ({ ...prev, current: 1 })) // Reset to first page on search
      }, 500),
    []
  )

  // Calculate date range based on selection
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

  // Fetch Logs
  useEffect(() => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...(searchText ? { search: searchText } : {}),
      ...getDateRangeParams(dateRange),
    }

    dispatch(getCreditLogs(params))
  }, [dispatch, searchText, dateRange, pagination])

  const purposeColorMap = {
    BLOG_GENERATION: "bg-blue-100 text-blue-700",
    QUICK_BLOG_GENERATION: "bg-indigo-100 text-indigo-700",
    AI_PROOFREADING: "bg-green-100 text-green-700",
    COMPETITOR_ANALYSIS: "bg-yellow-100 text-yellow-800",
    SUBSCRIPTION_PAYMENT: "bg-purple-100 text-purple-700",
    OTHER: "bg-gray-100 text-gray-700",
  }

  // Table Columns
  const columns = useMemo(
    () => [
      {
        title: "Blog Topic",
        dataIndex: ["metadata", "title"],
        key: "blogTitle",
        render: (title) => (
          <div>
            <span className="text-sm text-gray-700">{title || "N/A"}</span>
          </div>
        ),
      },
      {
        title: "Date",
        dataIndex: "createdAt",
        key: "createdAt",
        sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        render: (date) => (
          <span className="text-sm text-gray-600">
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
            className="font-medium px-3 py-1 rounded-full text-xs"
          >
            {category}
          </Tag>
        ),
      },
      {
        title: "Purpose",
        dataIndex: "purpose",
        key: "purpose",
        render: (purpose) => {
          const colorClass = purposeColorMap[purpose] || "bg-gray-100 text-gray-700"
          const label = purpose?.toLowerCase().replace(/_/g, " ") || "N/A"

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
          <span className={`font-semibold ${amount < 0 ? "text-red-500" : "text-green-600"}`}>
            {amount > 0 ? `+${amount}` : amount}
          </span>
        ),
      },
      {
        title: "Remaining Credits",
        dataIndex: "remainingCredits",
        key: "remainingCredits",
        render: (credits) => <span className="text-sm font-medium text-gray-800">{credits}</span>,
      },
    ],
    []
  )

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
        className="p-6 bg-white rounded-2xl shadow-md border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">Credit Logs</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Search by blog title"
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full sm:w-64 rounded-lg border-gray-300 hover:border-blue-400 transition-all"
            />
            <Select
              value={dateRange}
              onChange={(value) => {
                setDateRange(value)
                setPagination((prev) => ({ ...prev, current: 1 }))
              }}
              className="w-full sm:w-48 rounded-lg"
              popupClassName="rounded-lg"
            >
              <Option value="24h">Last 24 Hours</Option>
              <Option value="7d">Last 7 Days</Option>
              <Option value="30d">Last 30 Days</Option>
            </Select>
            <Select
              value={pagination.pageSize}
              onChange={(value) =>
                setPagination((prev) => ({ ...prev, pageSize: value, current: 1 }))
              }
              options={pageSizeOptions.map((size) => ({
                label: `${size} / page`,
                value: size,
              }))}
              className="w-full sm:w-32 rounded-lg"
              popupClassName="rounded-lg"
            />
          </div>
        </div>

        <Table
          dataSource={logs}
          columns={columns}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: totalLogs,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} logs`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize })
            },
          }}
          className="rounded-xl overflow-hidden"
          rowClassName="hover:bg-gray-50 transition-colors duration-200"
          bordered={false}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: loading ? (
              <Spin tip="Loading logs..." />
            ) : (
              <Empty description="No logs found" />
            ),
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}

export default CreditLogsTable
