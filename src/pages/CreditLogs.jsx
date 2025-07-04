import { Table, Tag, Tooltip, Input, DatePicker, Select, message } from "antd"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { SearchOutlined } from "@ant-design/icons"
import { loadUser } from "@api/authApi"
import { Helmet } from "react-helmet"

// [s ] DONE filter in blogs to search functionality
// [ s] DONE link if the status is completed else not
// [s ] DONE date range filter near to search - add line blog this to this and date this use from ant design

const CreditLogsTable = () => {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [dateRange, setDateRange] = useState([])
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const { RangePicker } = DatePicker
  const dispatch = useDispatch()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  })

  const pageSizeOptions = [10, 20, 50, 100]

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await loadUser(navigate)
        dispatch(setUser(user?.user))
      } catch (err) {
        console.error("User load failed:", err)
      }
    }

    fetchCurrentUser()
  }, [dispatch, navigate])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLogs(user?.creditLogs)
        setFilteredLogs(user?.creditLogs)
      } catch (err) {
        message.error("Failed to load credit logs")
        console.error("Failed to load credit logs", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [user])

  // Handle search and date filter
  useEffect(() => {
    let filtered = logs

    // Search filter
    if (searchText) {
      filtered = filtered?.filter((log) =>
        log.meta?.blogTitle?.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    // Date range filter
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day").toDate()
      const end = dateRange[1].endOf("day").toDate()

      filtered = filtered.filter((log) => {
        const logDate = new Date(log.createdAt)
        return logDate >= start && logDate <= end
      })
    }

    setFilteredLogs(filtered)
  }, [searchText, dateRange, logs])

  const handleBlogClick = (blog) => {
    navigate(`/toolbox/${blog._id}`, { state: { blog } })
  }

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date) => (
        <span className="text-sm text-gray-600">
          {new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      filters: [
        { text: "Deduction", value: "DEDUCTION" },
        { text: "Adjustment", value: "ADJUSTMENT" },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type) => (
        <Tag
          color={type === "DEDUCTION" ? "red" : "green"}
          className="font-medium px-2 py-0.5 rounded-full"
        >
          {type}
        </Tag>
      ),
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
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc, row) => (
        <div className="text-sm text-gray-800 flex items-center">
          {desc}
          {row.meta?.error && (
            <Tooltip title={row.meta.error}>
              <Tag color="volcano" className="ml-2 cursor-pointer px-2 py-0.5 rounded-full">
                Error
              </Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Blog Topic",
      dataIndex: ["meta", "blogTitle"],
      key: "blogTitle",
      render: (_, row) => (
        <span
          // onClick={() => navigate(`/toolbox/${row.meta.blogId}`)}
          // className="text-blue-500 cursor-pointer hover:underline"
        >
          {row.meta?.blogTitle}
        </span>
      ),
    },
  ]

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
        className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Credit Logs</h2>
          <div className="flex gap-4">
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="Search by blog title"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64 rounded-lg border-gray-200 hover:border-blue-300"
            />
            <RangePicker
              onChange={(dates) => setDateRange(dates || [])}
              className="rounded-lg border-gray-200 hover:border-blue-300"
              format="YYYY-MM-DD"
            />
            <Select
              value={pagination.pageSize}
              onChange={(value) => setPagination({ ...pagination, pageSize: value })}
              options={pageSizeOptions.map((size) => ({ label: `${size} / page`, value: size }))}
              style={{ width: 120 }}
            />
          </div>
        </div>
        <Table
          dataSource={filteredLogs}
          columns={columns}
          loading={loading}
          rowKey={(row, idx) => `${row.createdAt}-${idx}`}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            showSizeChanger: false,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize })
            },
          }}
          className="rounded-xl overflow-hidden"
          rowClassName="hover:bg-gray-50 transition-colors"
          bordered={false}
          scroll={{ x: "max-content" }}
        />
      </motion.div>
    </AnimatePresence>
  )
}

export default CreditLogsTable
