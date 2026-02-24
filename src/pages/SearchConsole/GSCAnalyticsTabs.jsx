import { Pencil, ExternalLink, ChevronDown, MoreHorizontal, FileText } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"

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
                  <span className="text-gray-700 line-clamp-1 max-w-[200px] text-left">
                    {text + (tab === "country" ? ` (${row.country})` : "")}
                  </span>
                </div>
              ),
            },
          ]
        : []),
      ...(["page"].includes(tab)
        ? [
            {
              title: "Blog Title",
              dataIndex: "blogTitle",
              key: "blogTitle",
              render: text => (
                <div className="tooltip tooltip-right" data-tip={text}>
                  <span className="font-medium text-gray-700 line-clamp-1 max-w-[300px] text-left">
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
        render: ctr => (
          <span className="text-gray-700 font-medium">{`${Number(ctr).toFixed(2)}%`}</span>
        ),
      },
      {
        title: "Position",
        dataIndex: "position",
        key: "position",
        render: position => (
          <span className="text-gray-700 font-medium">{Number(position).toFixed(2)}</span>
        ),
      },
      ...(tab !== "country"
        ? [
            {
              title: "Actions",
              key: "actions",
              align: "right",
              render: (_, record) => (
                <div className="dropdown dropdown-left dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-xs rounded-lg">
                    <MoreHorizontal className="size-4 text-gray-600" />
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-50 menu p-2 shadow-sm bg-white rounded-box w-40 border border-gray-100"
                  >
                    <li>
                      <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:bg-slate-50 text-slate-700"
                      >
                        <ExternalLink className="size-4" />
                        Go to Blog
                      </a>
                    </li>
                    <li>
                      <a
                        href={`${import.meta.env.VITE_FRONTEND_URL}/blog/${record.blogId}`}
                        target="_blank"
                        className="flex items-center gap-2 hover:bg-slate-50 text-slate-700"
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
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200/60 shadow-sm">
      {/* Tabs Header */}
      <div className="bg-[#F8FAFC] border-b border-slate-100 flex items-center justify-between px-2">
        <div className="flex gap-8 px-4">
          {items.map(item => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`py-5 text-[15px] font-bold transition-all relative ${
                activeTab === item.key ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {item.label}
              {activeTab === item.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4 min-h-[400px]">
            <span className="loading loading-spinner loading-lg text-indigo-600"></span>
            <p className="text-sm font-bold text-slate-400 italic">
              Analyzing your performance data...
            </p>
          </div>
        ) : filteredData?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 text-center min-h-[400px]">
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
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-white hover:bg-white">
                {columns.map(col => (
                  <TableHead
                    key={col.key}
                    className={clsx(
                      "bg-white text-[11px] uppercase font-bold tracking-widest text-slate-500 py-4 px-4 h-auto align-middle",
                      col.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    <div
                      className={clsx(
                        "flex items-center gap-2",
                        col.align === "right" && "justify-end"
                      )}
                    >
                      {col.title}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record, index) => (
                <TableRow
                  key={record.id || index}
                  className="hover:bg-slate-50/80 transition-all border-b border-slate-50"
                >
                  {columns.map(col => (
                    <TableCell
                      key={col.key}
                      className={clsx("py-5 px-4", col.align === "right" && "text-right")}
                    >
                      <div
                        className={clsx(
                          "text-[14px] font-medium text-slate-700",
                          col.align === "right" && "flex justify-end"
                        )}
                      >
                        {col.render
                          ? col.render(record[col.dataIndex], record)
                          : record[col.dataIndex]}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
