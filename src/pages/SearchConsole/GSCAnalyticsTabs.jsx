import { EditOutlined, LinkOutlined } from "@ant-design/icons"
import { Tabs, Table, Tooltip, Empty, Dropdown, Menu, Button } from "antd"

/**
 *
 * @param {Object} props
 * @param {Array} props.items - Array of tab items with keys and labels.
 * @param {Array} props.filteredData - Data to be displayed in the table.
 * @param {string} props.activeTab - Currently active tab key.
 * @returns
 */
export default function GSCAnalyticsTabs({
  items,
  filteredData,
  activeTab,
  handleTabChange,
  isLoading,
}) {
  // Table columns
  const getColumns = (tab) => {
    const baseColumns = [
      ...(tab !== "page"
        ? [
            {
              title: tab === "query" ? "Query" : "Country",
              dataIndex: tab === "query" ? "query" : "countryName",
              key: tab,
              render: (text, row) => (
                <Tooltip title={text} className="text-gray-700 px-8 line-clamp-1 tracking-normal">
                  {text + (tab === "country" ? ` (${row.country})` : "")}
                </Tooltip>
              ),
              sorter: (a, b) =>
                a[tab === "query" ? "query" : "countryName"].localeCompare(
                  b[tab === "query" ? "query" : "countryName"]
                ),
              width: "30%",
            },
          ]
        : []),
      ...(["page"].includes(tab)
        ? [
            {
              title: "Blog Title",
              dataIndex: "blogTitle",
              key: "blogTitle",
              sorter: (a, b) => a.blogTitle.localeCompare(b.blogTitle),
              width: "40%",
              render: (text) => (
                <Tooltip title={text} className="font-medium text-gray-700">
                  {text}
                </Tooltip>
              ),
            },
          ]
        : []),
      {
        title: "Clicks",
        dataIndex: "clicks",
        key: "clicks",
        sorter: (a, b) => a.clicks - b.clicks,
        render: (clicks) => (
          <span className="text-blue-600 font-semibold">
            {new Intl.NumberFormat().format(clicks)}
          </span>
        ),
      },
      {
        title: "Impressions",
        dataIndex: "impressions",
        key: "impressions",
        sorter: (a, b) => a.impressions - b.impressions,
        render: (impressions) => (
          <span className="text-blue-600 font-semibold">
            {new Intl.NumberFormat().format(impressions)}
          </span>
        ),
      },
      {
        title: "CTR (%)",
        dataIndex: "ctr",
        key: "ctr",
        sorter: (a, b) => a.ctr - b.ctr,
        render: (ctr) => <span className="text-gray-700">{`${Number(ctr).toFixed(2)}%`}</span>,
      },
      {
        title: "Position",
        dataIndex: "position",
        key: "position",
        sorter: (a, b) => a.position - b.position,
        render: (position) => <span className="text-gray-700">{Number(position).toFixed(2)}</span>,
      },
      ...(tab !== "country"
        ? [
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "go",
                        label: (
                          <a
                            href={record.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <LinkOutlined className="size-4 mr-2" />
                            Go to Blog
                          </a>
                        ),
                      },
                      {
                        key: "edit",
                        label: (
                          <a
                            href={`${import.meta.env.VITE_FRONTEND_URL}/toolbox/${record.blogId}`}
                            target="_blank"
                            className="flex items-center"
                          >
                            <EditOutlined className="size-4 mr-2" />
                            Edit Blog
                          </a>
                        ),
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <Button
                    type="text"
                    icon={<LinkOutlined className="size-4 text-gray-600 hover:text-blue-600" />}
                  />
                </Dropdown>
              ),
            },
          ]
        : []),
    ]
    return baseColumns
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <Tabs
        items={items.map((item) => ({
          key: item.key,
          label: <span className="text-base font-medium">{item.label}</span>,
          children: (
            <Table
              columns={getColumns(item.key)}
              dataSource={filteredData}
              rowKey="id"
              loading={isLoading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`,
                position: ["topRight"],
                rootClassName: `absolute z-10 right-4 -top-[${activeTab == "country" ? "14.5%" : "12.5%"}] bg-white rounded-xl`
              }}
              locale={{
                emptyText: <Empty />,
              }}
              className="custom-table relative"
            />
          ),
        }))}
        defaultActiveKey={items[0].key}
        activeKey={activeTab}
        onChange={handleTabChange}
        className="custom-tabs"
        tabBarStyle={{
          background: "#f8fafc",
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
          margin: 0,
        }}
      ></Tabs>
    </div>
  )
}
