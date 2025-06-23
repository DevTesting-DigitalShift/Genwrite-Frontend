import { useEffect, useState } from "react"
import { Table, Tag, Tooltip, message } from "antd"
import { motion } from "framer-motion"
import { ReloadOutlined } from "@ant-design/icons"
import axiosInstance from "@api/index"
import { ToastContainer } from "react-toastify"
import { Helmet } from "react-helmet"

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get("/user/transactions")
      setTransactions(res.data || [])
    } catch (err) {
      console.error("Failed to fetch transactions:", err)
      toast.error("Failed to fetch transactions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) =>
        new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={type === "subscription" ? "blue" : "gold"}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      render: (plan) => (plan ? <Tag color="purple">{plan.toUpperCase()}</Tag> : "-"),
    },
    {
      title: "Credits",
      dataIndex: "creditsAdded",
      key: "creditsAdded",
      render: (credits) => <span>{credits || 0}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt, record) => `$${(amt / 100).toFixed(2)} ${record.currency?.toUpperCase()}`,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (pm) => pm?.toUpperCase() || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default"
        if (status === "success") color = "green"
        else if (status === "failed") color = "red"
        else if (status === "pending") color = "orange"
        return <Tag color={color}>{status.toUpperCase()}</Tag>
      },
      filters: [
        { text: "Success", value: "success" },
        { text: "Pending", value: "pending" },
        { text: "Failed", value: "failed" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Invoice",
      dataIndex: "invoiceUrl",
      key: "invoiceUrl",
      render: (url) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 underline hover:text-blue-700"
          >
            View Invoice
          </a>
        ) : (
          "-"
        ),
    },
  ]

  return (
    <>
      <Helmet>
        <title>Transactions | GenWrite</title>
      </Helmet>
      <ToastContainer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 bg-white rounded-xl shadow-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Transactions</h2>
          <Tooltip title="Refresh">
            <button
              onClick={fetchTransactions}
              className="px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <ReloadOutlined />
            </button>
          </Tooltip>
        </div>
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={transactions}
          columns={columns}
          pagination={{ pageSize: 10 }}
          className="custom-table rounded-lg overflow-hidden"
        />
      </motion.div>
    </>
  )
}

export default Transactions
