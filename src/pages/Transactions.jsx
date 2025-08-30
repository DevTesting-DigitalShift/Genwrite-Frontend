import { useEffect, useState } from "react"
import { Table, Tag, Tooltip } from "antd"
import { motion } from "framer-motion"
import { ReloadOutlined } from "@ant-design/icons"
import { Helmet } from "react-helmet"
import { useDispatch, useSelector } from "react-redux"
import { fetchTransactions } from "@store/slices/userSlice"

const Transactions = () => {
  const dispatch = useDispatch()
  const { transactions, loading } = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(fetchTransactions())
  }, [dispatch])

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
        <Tag color={type === "subscription" ? "blue" : "gold"} className="text-xs sm:text-sm">
          {type.replace(/_/g, " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      render: (plan) =>
        plan ? (
          <Tag color="purple" className="text-xs sm:text-sm">
            {plan.toUpperCase()}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Credits",
      dataIndex: "creditsAdded",
      key: "creditsAdded",
      render: (credits) => <span className="text-xs sm:text-sm">{credits || 0}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt, record) => (
        <span className="text-xs sm:text-sm">{`$${(amt / 100).toFixed(
          2
        )} ${record.currency?.toUpperCase()}`}</span>
      ),
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      responsive: ["md"], // Hide on small screens
      render: (pm) => <span className="text-xs sm:text-sm">{pm?.toUpperCase() || "-"}</span>,
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
        return (
          <Tag color={color} className="text-xs sm:text-sm">
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
    },
    {
      title: "Invoice",
      dataIndex: "invoiceUrl",
      key: "invoiceUrl",
      responsive: ["md"], // Hide on small screens
      render: (url) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 underline hover:text-blue-700 text-xs sm:text-sm"
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-8 bg-white rounded-xl shadow-md max-w-full"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
            Your Transactions
          </h2>
          <Tooltip title="Refresh">
            <button
              onClick={() => dispatch(fetchTransactions())}
              className="px-3 sm:px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-sm"
            >
              <ReloadOutlined className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </Tooltip>
        </div>
        <style>
          {`
            .ant-table-container {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
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
              .ant-tag {
                font-size: 12px !important;
                padding: 2px 6px !important;
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
          rowKey="_id"
          loading={loading}
          dataSource={transactions}
          columns={columns}
          pagination={{ pageSize: 10, responsive: true, showSizeChanger: false }}
          className="rounded-lg overflow-hidden"
          rowClassName="hover:bg-gray-50 transition-colors duration-200"
          scroll={{ x: "max-content" }}
        />
      </motion.div>
    </>
  )
}

export default Transactions
