import { Table, Tag, Tooltip, Input, Select, Spin, Empty } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SearchOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";
import { getCreditLogs } from "@store/slices/creditLogSlice";

const CreditLogsTable = () => {
  const dispatch = useDispatch();
  const { Option } = Select;

  // Local State
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState("24h"); // Default to "Last 24 Hours"
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const pageSizeOptions = [10, 20, 50, 100];

  // Redux State
  const { logs, loading, totalLogs } = useSelector((state) => state.creditLogs);

  // Calculate date range based on selection
  const getDateRangeParams = (range) => {
    const now = dayjs();
    switch (range) {
      case "24h":
        return {
          start: now.subtract(24, "hours").startOf("hour").toISOString(),
          end: now.endOf("hour").toISOString(),
        };
      case "7d":
        return {
          start: now.subtract(7, "days").startOf("day").toISOString(),
          end: now.endOf("day").toISOString(),
        };
      case "30d":
        return {
          start: now.subtract(30, "days").startOf("day").toISOString(),
          end: now.endOf("day").toISOString(),
        };
      default:
        return {};
    }
  };

  // Fetch Logs
  useEffect(() => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...(searchText ? { search: searchText } : {}),
      ...getDateRangeParams(dateRange),
    };

    dispatch(getCreditLogs(params));
  }, [dispatch, searchText, dateRange, pagination]);

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => (
        <span className="text-sm text-gray-600">
          {new Date(date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
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
          className="font-medium px-2 py-0.5 rounded-full"
        >
          {category}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => a.amount - b.amount,
      render: (amount) => (
        <span
          className={`font-semibold ${
            amount < 0 ? "text-red-500" : "text-green-600"
          }`}
        >
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
              <Tag
                color="volcano"
                className="ml-2 cursor-pointer px-2 py-0.5 rounded-full"
              >
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
      render: (blogTitle) => <span>{blogTitle || "N/A"}</span>,
    },
  ];

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
            <Select
              value={dateRange}
              onChange={(value) => setDateRange(value)}
              className="w-48 rounded-lg border-gray-200 hover:border-blue-300"
              placeholder="Select date range"
            >
              <Option value="24h">Last 24 Hours</Option>
              <Option value="7d">Last 7 Days</Option>
              <Option value="30d">Last 30 Days</Option>
            </Select>
            <Select
              value={pagination.pageSize}
              onChange={(value) => setPagination({ ...pagination, pageSize: value })}
              options={pageSizeOptions.map((size) => ({
                label: `${size} / page`,
                value: size,
              }))}
              className="w-32 rounded-lg border-gray-200 hover:border-blue-300"
            />
          </div>
        </div>

        <Table
          dataSource={logs}
          columns={columns}
          loading={loading}
          rowKey={(row, idx) => `${row._id}-${idx}`}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: totalLogs,
            showSizeChanger: false, // Already handled by separate page size selector
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize });
            },
          }}
          className="rounded-xl overflow-hidden"
          rowClassName="hover:bg-gray-50 transition-colors"
          bordered={false}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: loading ? <Spin /> : <Empty description="No logs found" />,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default CreditLogsTable;