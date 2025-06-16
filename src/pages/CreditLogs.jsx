import { Table, Tag, Tooltip } from "antd"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"

const CreditLogsTable = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLogs(user?.creditLogs)
      } catch (err) {
        console.error("Failed to load credit logs", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date) => (
        <span className="text-sm text-gray-600">
          {new Date(date).toLocaleString("en-IN", {dateStyle:"medium", timeStyle:"short"})}
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
        <Tag color={type === "DEDUCTION" ? "red" : "green"} className="font-medium">
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
        <div className="text-sm text-gray-800">
          {desc}
          {row.meta?.error && (
            <Tooltip title={row.meta.error}>
              <Tag color="volcano" className="ml-2 cursor-pointer">
                Error
              </Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Blog",
      dataIndex: ["meta", "blogTitle"],
      key: "blogTitle",
      render: (_, row) =>
        row.meta?.blogId ? (
          <span
            onClick={() => navigate(`/toolbox/${row.meta.blogId}`)}
            className="text-blue-500 cursor-pointer hover:underline"
          >
            {row.meta?.blogTitle}
          </span>
        ) : (
          "-"
        ),
    },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 bg-white rounded-xl"
      >
        <h2 className="text-xl font-semibold mb-4">Credit Logs</h2>
        <Table
          dataSource={logs}
          columns={columns}
          loading={loading}
          rowKey={(row, idx) => `${row.createdAt}-${idx}`}
          pagination={{ pageSize: 10 }}
          className="bg-white rounded-xl shadow-sm"
        />
      </motion.div>
    </AnimatePresence>
  )
}

export default CreditLogsTable
