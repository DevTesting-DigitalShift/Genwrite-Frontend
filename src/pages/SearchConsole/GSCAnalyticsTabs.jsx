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
import { motion } from "framer-motion"
import clsx from "clsx"

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
        render: clicks => <span>{new Intl.NumberFormat().format(clicks)}</span>,
      },
      {
        title: "Impressions",
        dataIndex: "impressions",
        key: "impressions",
        render: impressions => <span>{new Intl.NumberFormat().format(impressions)}</span>,
      },
      {
        title: "CTR (%)",
        dataIndex: "ctr",
        key: "ctr",
        render: ctr => (
          <span className="text-slate-500 font-medium">{`${Number(ctr).toFixed(2)}%`}</span>
        ),
      },
      {
        title: "Position",
        dataIndex: "position",
        key: "position",
        render: position => (
          <span className="text-slate-500 font-medium">{Number(position).toFixed(2)}</span>
        ),
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
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm">
      {/* Tabs Header */}
      <div className="bg-[#F8FAFC] border-b border-slate-100 flex items-center justify-between px-2">
        <div className="flex gap-8 px-4">
          {items.map(item => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`py-6 text-sm font-bold transition-all relative ${
                activeTab === item.key ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {item.label}
              {activeTab === item.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <span className="loading loading-spinner loading-lg text-indigo-600"></span>
            <p className="text-sm font-bold text-slate-400 italic">
              Analyzing your performance data...
            </p>
          </div>
        ) : filteredData?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-slate-50 rounded-full blur-xl opacity-50" />
              <div className="relative w-20 h-20 bg-white shadow-xl shadow-slate-200/50 rounded-2xl flex items-center justify-center border border-slate-100">
                <FileText className="size-10 text-slate-200" strokeWidth={1} />
                <div className="absolute -top-2 -right-2 bg-slate-100 rounded-lg p-1 border border-white">
                  <MoreHorizontal className="size-4 text-slate-400" />
                </div>
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">No data available</h3>
            <p className="text-sm text-slate-400 font-medium max-w-[240px]">
              We couldn't find any performance records for the current filters.
            </p>
          </div>
        ) : (
          <table className="table w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`bg-white border-b border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-500 py-6 px-4 ${
                      col.key === "actions" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={clsx(
                        "flex items-center gap-2",
                        col.key === "actions" && "justify-end"
                      )}
                    >
                      {col.title}
                      {col.key !== "actions" && (
                        <div className="flex flex-col -gap-1 opacity-30 group-hover:opacity-100">
                          <ChevronDown className="size-3 rotate-180" />
                          <ChevronDown className="size-3 -mt-1.5" />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-slate-50 group transition-all">
                  {columns.map(col => (
                    <td key={col.key} className="py-6 px-4 border-b border-slate-50">
                      <div
                        className={clsx(
                          "text-[13px] font-bold text-slate-700",
                          col.key === "actions" && "flex justify-end"
                        )}
                      >
                        {col.render
                          ? col.render(record[col.dataIndex], record)
                          : record[col.dataIndex]}
                      </div>
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
