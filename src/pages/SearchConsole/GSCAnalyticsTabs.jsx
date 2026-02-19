import {
  Pencil,
  ExternalLink,
  ChevronDown,
  MoreHorizontal,
  FileText,
  Globe,
  MousePointer2,
  Eye,
  BarChart3,
} from "lucide-react"
import { useState } from "react"

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
  const getColumns = tab => {
    const baseColumns = [
      ...(tab !== "page"
        ? [
            {
              title: tab === "query" ? "Query" : "Country",
              dataIndex: tab === "query" ? "query" : "countryName",
              key: tab,
              render: (text, row) => (
                <div className="tooltip tooltip-right" data-tip={text}>
                  <span className="text-gray-700 line-clamp-1 max-w-[200px]">
                    {text + (tab === "country" ? ` (${row.country})` : "")}
                  </span>
                </div>
              ),
            },
          ]
        : []),
      ...(tab === "page"
        ? [
            {
              title: "Blog Title",
              dataIndex: "blogTitle",
              key: "blogTitle",
              render: text => (
                <div className="tooltip tooltip-right" data-tip={text}>
                  <span className="font-medium text-gray-700 line-clamp-1 max-w-[300px]">
                    {text}
                  </span>
                </div>
              ),
            },
          ]
        : []),
      {
        title: "Clicks",
        dataIndex: "clicks",
        key: "clicks",
        render: clicks => (
          <span className="text-blue-600 font-semibold">
            {new Intl.NumberFormat().format(clicks)}
          </span>
        ),
      },
      {
        title: "Impressions",
        dataIndex: "impressions",
        key: "impressions",
        render: impressions => (
          <span className="text-blue-600 font-semibold">
            {new Intl.NumberFormat().format(impressions)}
          </span>
        ),
      },
      {
        title: "CTR (%)",
        dataIndex: "ctr",
        key: "ctr",
        render: ctr => <span className="text-gray-700">{`${Number(ctr).toFixed(2)}%`}</span>,
      },
      {
        title: "Position",
        dataIndex: "position",
        key: "position",
        render: position => <span className="text-gray-700">{Number(position).toFixed(2)}</span>,
      },
      ...(tab !== "country"
        ? [
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <div className="dropdown dropdown-left dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                    <MoreHorizontal className="size-4 text-gray-600" />
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-50 menu p-2 shadow-sm bg-base-100 rounded-box w-40 border border-gray-100"
                  >
                    <li>
                      <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="size-4" />
                        Go to Blog
                      </a>
                    </li>
                    <li>
                      <a
                        href={`${import.meta.env.VITE_FRONTEND_URL}/blog/${record.blogId}`}
                        target="_blank"
                        className="flex items-center gap-2"
                      >
                        <Pencil className="size-4" />
                        Edit Blog
                      </a>
                    </li>
                  </ul>
                </div>
              ),
            },
          ]
        : []),
    ]
    return baseColumns
  }

  const columns = getColumns(activeTab)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-1 flex items-center justify-between">
        <div className="tabs tabs-boxed bg-transparent gap-1">
          {items.map(item => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`tab tab-sm md:tab-md font-medium transition-all ${
                activeTab === item.key
                  ? "tab-active bg-white! text-blue-600! shadow-xs"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {filteredData?.length > 0 && (
          <div className="px-4 text-xs font-medium text-gray-500 hidden sm:block">
            Total {filteredData.length} items
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-medium text-gray-500 italic">Fetching analytics data...</p>
          </div>
        ) : filteredData?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <BarChart3 className="size-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Data Available</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              We couldn't find any performance data for the selected filters.
            </p>
          </div>
        ) : (
          <table className="table table-zebra w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold py-4"
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-blue-50/30 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="py-4 border-b border-gray-50">
                      {col.render
                        ? col.render(record[col.dataIndex], record)
                        : record[col.dataIndex]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
