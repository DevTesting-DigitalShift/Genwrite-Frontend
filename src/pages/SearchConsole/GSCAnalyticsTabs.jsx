import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import clsx from "clsx"
import {
  Pencil,
  ExternalLink,
  MoreHorizontal,
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import Fuse from "fuse.js"

const columnHelper = createColumnHelper()

// Fuse.js options — search across all meaningful text fields
const fuseOptions = {
  keys: ["url", "query", "countryName", "blogTitle"],
  threshold: 0.35,
  ignoreLocation: true,
}

// Sortable column header
const SortableHeader = ({ column, title }) => {
  const sorted = column.getIsSorted()
  return (
    <button
      className="flex items-center gap-1.5 group select-none"
      onClick={column.getToggleSortingHandler()}
      title={`Sort by ${title}`}
    >
      <span>{title}</span>
      <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
        {sorted === "asc" ? (
          <ChevronUp className="w-3 h-3 text-indigo-500" />
        ) : sorted === "desc" ? (
          <ChevronDown className="w-3 h-3 text-indigo-500" />
        ) : (
          <ChevronsUpDown className="w-3 h-3" />
        )}
      </span>
    </button>
  )
}

export default function GSCAnalyticsTabs({
  items,
  filteredData,
  activeTab,
  handleTabChange,
  isLoading,
  searchQuery = "",
}) {
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // Apply Fuse.js fuzzy search on top of already-filtered data
  const tableData = useMemo(() => {
    const raw = filteredData ?? []
    if (!searchQuery.trim()) return raw
    const fuse = new Fuse(raw, fuseOptions)
    return fuse.search(searchQuery.trim()).map(({ item }) => item)
  }, [filteredData, searchQuery])

  const columns = useMemo(() => {
    const base = []

    if (activeTab === "query") {
      base.push(
        columnHelper.accessor("query", {
          header: ({ column }) => <SortableHeader column={column} title="Query" />,
          cell: info => (
            <div className="tooltip tooltip-right" data-tip={info.getValue()}>
              <span className="text-gray-700 line-clamp-1 max-w-[180px] sm:max-w-[260px] text-left block">
                {info.getValue()}
              </span>
            </div>
          ),
          sortingFn: "alphanumeric",
        })
      )
    }

    if (activeTab === "country") {
      base.push(
        columnHelper.accessor("countryName", {
          header: ({ column }) => <SortableHeader column={column} title="Country" />,
          cell: info => (
            <div className="tooltip tooltip-right" data-tip={info.getValue()}>
              <span className="text-gray-700 line-clamp-1 max-w-[160px] text-left block">
                {info.getValue()} ({info.row.original.country})
              </span>
            </div>
          ),
          sortingFn: "alphanumeric",
        })
      )
    }

    if (activeTab === "page") {
      base.push(
        columnHelper.accessor("blogTitle", {
          header: ({ column }) => <SortableHeader column={column} title="Blog Title" />,
          cell: info => (
            <div className="tooltip tooltip-right" data-tip={info.getValue()}>
              <span className="font-medium text-gray-700 line-clamp-1 max-w-[180px] sm:max-w-[280px] text-left block">
                {info.getValue()}
              </span>
            </div>
          ),
          sortingFn: "alphanumeric",
        })
      )
    }

    base.push(
      columnHelper.accessor("clicks", {
        header: ({ column }) => <SortableHeader column={column} title="Clicks" />,
        cell: info => (
          <span className="text-blue-600 font-semibold">
            {new Intl.NumberFormat().format(info.getValue())}
          </span>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("impressions", {
        header: ({ column }) => <SortableHeader column={column} title="Impressions" />,
        cell: info => (
          <span className="text-indigo-600 font-semibold">
            {new Intl.NumberFormat().format(info.getValue())}
          </span>
        ),
        sortingFn: "basic",
      }),
      columnHelper.accessor("ctr", {
        header: ({ column }) => <SortableHeader column={column} title="CTR" />,
        cell: info => (
          <span className="text-gray-700 font-medium">{Number(info.getValue()).toFixed(2)}%</span>
        ),
        sortingFn: (rowA, rowB) =>
          parseFloat(rowA.original.ctr) - parseFloat(rowB.original.ctr),
      }),
      columnHelper.accessor("position", {
        header: ({ column }) => <SortableHeader column={column} title="Position" />,
        cell: info => (
          <span className="text-gray-700 font-medium">{Number(info.getValue()).toFixed(2)}</span>
        ),
        sortingFn: (rowA, rowB) =>
          parseFloat(rowA.original.position) - parseFloat(rowB.original.position),
      })
    )

    if (activeTab !== "country") {
      base.push(
        columnHelper.display({
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          cell: ({ row }) => (
            <div className="flex justify-end">
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
                      href={row.original.url}
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
                      href={`${import.meta.env.VITE_FRONTEND_URL}/blog/${row.original.blogId}`}
                      target="_blank"
                      className="flex items-center gap-2 hover:bg-slate-50 text-slate-700"
                    >
                      <Pencil className="size-4" />
                      Edit Blog
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          ),
        })
      )
    }

    return base
  }, [activeTab])

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const totalRows = tableData.length
  const { pageIndex, pageSize } = pagination
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min(startRow + pageSize - 1, totalRows)

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200/60 shadow-sm">
      {/* Tabs Header */}
      <div className="bg-[#F8FAFC] border-b border-slate-100 flex items-center px-2 overflow-x-auto">
        <div className="flex gap-4 sm:gap-8 px-2 sm:px-4 min-w-max">
          {items.map(item => (
            <button
              key={item.key}
              onClick={() => {
                handleTabChange(item.key)
                setSorting([])
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
              className={`py-4 sm:py-5 text-[13px] sm:text-[15px] font-bold transition-all relative whitespace-nowrap ${
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
        ) : tableData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 sm:p-24 text-center min-h-[400px]">
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
              {searchQuery
                ? `No results match "${searchQuery}". Try a different search.`
                : "We couldn't find any performance records for the current filters."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id} className="border-b border-slate-100 bg-white hover:bg-white">
                  {hg.headers.map(header => (
                    <TableHead
                      key={header.id}
                      className="bg-white text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-slate-500 py-4 px-3 sm:px-4 h-auto align-middle whitespace-nowrap"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className="hover:bg-slate-50/80 transition-all border-b border-slate-50"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className="py-4 sm:py-5 px-3 sm:px-4 text-[13px] sm:text-[14px] font-medium text-slate-700"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && tableData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 sm:py-4 px-3 sm:px-4 border-t border-slate-100 bg-white">
          <div className="text-xs sm:text-sm font-medium text-gray-500 order-2 sm:order-1">
            Showing {startRow}–{endRow} of {totalRows} records
          </div>
          <div className="flex items-center gap-3 order-1 sm:order-2">
            <div className="join border border-gray-100">
              <button
                className="join-item btn btn-xs sm:btn-sm bg-white border-gray-200 hover:bg-gray-50"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                Prev
              </button>
              <button className="join-item btn btn-xs sm:btn-sm bg-white border-gray-200 no-animation text-xs">
                {pageIndex + 1} / {table.getPageCount() || 1}
              </button>
              <button
                className="join-item btn btn-xs sm:btn-sm bg-white border-gray-200 hover:bg-gray-50"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Next
              </button>
            </div>
            <select
              className="select select-bordered select-xs sm:select-sm border-gray-200 rounded-lg"
              value={pageSize}
              onChange={e => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
            >
              <option value={10}>10 / pg</option>
              <option value={25}>25 / pg</option>
              <option value={50}>50 / pg</option>
              <option value={100}>100 / pg</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
