import { useEffect, useState, lazy, Suspense, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import useAnalysisStore from "@store/useAnalysisStore"
import { toast } from "sonner"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Info,
  ArrowLeft,
  Sparkles,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUp01,
} from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import useJobStore from "@store/useJobStore"
import { useQueryClient } from "@tanstack/react-query"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { Helmet } from "react-helmet"

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table"
import ExcelJS from "exceljs"
import clsx from "clsx"
import dayjs from "dayjs"
import ConnectedTools from "@components/ConnectedTools"
import { extractKeywordsFromClipboard } from "@utils/copyPasteUtil"

const AdvancedBlogModal = lazy(() => import("@components/multipleStepModal/AdvancedBlogModal"))
const KEYWORD_LIMIT = 20

const KeywordResearch = () => {
  const location = useLocation()
  const [newKeyword, setNewKeyword] = useState("")
  const [keywords, setKeywords] = useState(() => {
    const initial = location.state?.transferValue || ""
    if (!initial) return []

    return [...new Set(initial.split(/[,\t\n\r;]+/).map(k => k.trim()).filter(Boolean))].slice(
      0,
      KEYWORD_LIMIT
    )
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [autoSelectVisible, setAutoSelectVisible] = useState(false)
  const [showAdvancedBlogModal, setShowAdvancedBlogModal] = useState(false)
  const [sorting, setSorting] = useState([])
  const [rowSelection, setRowSelection] = useState({})

  const navigate = useNavigate()
  const { openJobModal } = useJobStore()
  const queryClient = useQueryClient()

  const {
    keywordAnalysis: keywordAnalysisResult,
    loading: analyzing,
    selectedKeywords,
    clearKeywordAnalysis,
    setSelectedKeywords,
    setPendingImport,
    analyzeKeywords: analyzeKeywordsAction,
  } = useAnalysisStore()

  const REAL_PAGE_SIZE = 10

  useEffect(() => {
    if (keywords.length === 0) {
      setCurrentPage(1)
      clearKeywordAnalysis()
    }
  }, [keywords, clearKeywordAnalysis])

  useEffect(() => {
    const initial = location.state?.transferValue || ""
    if (!initial) return

    const parsedKeywords = [...new Set(initial.split(/[,\t\n\r;]+/).map(k => k.trim()).filter(Boolean))]
    if (parsedKeywords.length > KEYWORD_LIMIT) {
      toast.warning(`Only the first ${KEYWORD_LIMIT} keywords will be used.`)
    }
  }, [location.state?.transferValue])

  const mergeKeywordsWithLimit = incomingKeywords => {
    const seen = new Set()
    const mergedKeywords = [...keywords, ...incomingKeywords].filter(keyword => {
      const normalizedKeyword = keyword.toLowerCase()
      if (!keyword || seen.has(normalizedKeyword)) return false
      seen.add(normalizedKeyword)
      return true
    })

    if (mergedKeywords.length > KEYWORD_LIMIT) {
      toast.warning(`Only the first ${KEYWORD_LIMIT} keywords will be used.`)
      return mergedKeywords.slice(0, KEYWORD_LIMIT)
    }

    return mergedKeywords
  }

  const addKeyword = forcedValue => {
    const input = typeof forcedValue === "string" ? forcedValue.trim() : newKeyword.trim()
    if (!input) return

    const existing = keywords.map(k => k.toLowerCase())
    const seen = new Set()

    const newKeywords = input
      .split(/[,\t\n\r;]+/)
      .map(k => k.trim())
      .filter(
        k =>
          k &&
          !existing.includes(k.toLowerCase()) &&
          !seen.has(k.toLowerCase()) &&
          seen.add(k.toLowerCase())
      )

    if (newKeywords.length > 0) {
      setKeywords(mergeKeywordsWithLimit(newKeywords))
      setNewKeyword("")
    }
  }

  const handlePasteKeywords = e => {
    extractKeywordsFromClipboard(e, {
      type: "keywords",
      cb: items => {
        setKeywords(mergeKeywordsWithLimit(items))
        setNewKeyword("")
      },
    })
  }

  const removeKeyword = index => {
    const keywordToRemove = keywords[index]
    const updatedKeywords = keywords.filter((_, i) => i !== index)
    setKeywords(updatedKeywords)
    if (updatedKeywords.length === 0) {
      clearKeywordAnalysis()
      setCurrentPage(1)
    }
    if (selectedKeywords?.allKeywords?.includes(keywordToRemove)) {
      const updatedSelectedKeywords = selectedKeywords.allKeywords.filter(
        kw => kw !== keywordToRemove
      )
      setSelectedKeywords({
        focusKeywords: updatedSelectedKeywords.slice(0, 3),
        keywords: updatedSelectedKeywords,
        allKeywords: updatedSelectedKeywords,
      })
    }
  }

  const handleKeyPress = e => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  const analyzeKeywords = () => {
    if (keywords.length > 0) {
      analyzeKeywordsAction(keywords)
      setCurrentPage(1)
    }
  }

  const getAutoSelectedKeywords = () => {
    const byCompetition = { LOW: [], MEDIUM: [], HIGH: [] }
    keywordAnalysisResult?.forEach(kw => {
      if (byCompetition[kw.competition]) {
        byCompetition[kw.competition].push({
          keyword: kw.keyword,
          competition_index: kw.competition_index,
        })
      }
    })

    const sortedLow = (byCompetition.LOW || [])
      .sort((a, b) => a.competition_index - b.competition_index)
      .slice(0, 2)
    const sortedMedium = (byCompetition.MEDIUM || [])
      .sort((a, b) => a.competition_index - b.competition_index)
      .slice(0, 2)
    const sortedHigh = (byCompetition.HIGH || [])
      .sort((a, b) => a.competition_index - b.competition_index)
      .slice(0, 2)

    return [
      ...sortedLow.map(item => item.keyword),
      ...sortedMedium.map(item => item.keyword),
      ...sortedHigh.map(item => item.keyword),
    ]
  }

  const showAutoKeywords = () => {
    const autoKeywords = getAutoSelectedKeywords()
    if (!autoKeywords.length || !keywordAnalysisResult?.length) {
      toast.error("No keywords available to auto-select. Please analyze keywords first.")
      return
    }
    setAutoSelectVisible(true)
  }

  const acceptAutoKeywords = () => {
    const autoKeywords = getAutoSelectedKeywords()
    const finalKeywords = [
      ...(selectedKeywords?.allKeywords || []),
      ...autoKeywords.filter(kw => !selectedKeywords?.allKeywords?.includes(kw)),
    ].slice(0, 35)
    setSelectedKeywords({
      focusKeywords: finalKeywords.slice(0, 3),
      keywords: finalKeywords,
      allKeywords: finalKeywords,
    })
    setAutoSelectVisible(false)
  }

  const handleExport = async () => {
    if (!keywordAnalysisResult?.length) return

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Keyword Analysis")

    worksheet.columns = [
      { header: "Keyword", key: "keyword", width: 30 },
      { header: "Monthly Searches", key: "avgMonthlySearches", width: 20 },
      { header: "Competition", key: "competition", width: 15 },
      { header: "Competition Index", key: "competition_index", width: 15 },
      { header: "Low Bid", key: "lowBid", width: 10 },
      { header: "High Bid", key: "highBid", width: 10 },
    ]

    keywordAnalysisResult.forEach(kw => {
      worksheet.addRow(kw)
    })

    worksheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `Keyword_Research_${dayjs().format("YYYY-MM-DD")}.xlsx`
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  const proceedWithSelectedKeywords = async type => {
    const finalKeywords = selectedKeywords?.allKeywords || []
    setSelectedKeywords({
      focusKeywords: finalKeywords.slice(0, 3),
      keywords: finalKeywords.slice(3),
      allKeywords: finalKeywords,
    })
    setPendingImport(type)

    if (type === "blog") {
      setShowAdvancedBlogModal(true)
    } else {
      navigate("/jobs")
      openJobModal()
    }
  }

  const handleCreateBlog = () => {
    proceedWithSelectedKeywords("blog")
  }

  const handleCreateJob = () => {
    proceedWithSelectedKeywords("job")
  }

  const tableData = useMemo(
    () =>
      keywordAnalysisResult?.map((kw, idx) => ({
        keyword: kw.keyword,
        avgMonthlySearches: kw.avgMonthlySearches,
        competition: kw.competition,
        competition_index: kw.competition_index,
        avgCpc: kw.avgCpc,
        lowBid: kw.lowBid,
        highBid: kw.highBid,
      })) || [],
    [keywordAnalysisResult]
  )

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const { rowSelection: stateSelection } = table.getState()
          const rows = table.getSortedRowModel().rows
          const pageRows = rows.slice(
            (currentPage - 1) * REAL_PAGE_SIZE,
            currentPage * REAL_PAGE_SIZE
          )
          const pageKeywords = pageRows.map(r => r.id)
          const selectedOnPage = pageKeywords.filter(k => stateSelection[k])
          const isAllPageSelected =
            pageKeywords.length > 0 && selectedOnPage.length === pageKeywords.length
          const isSomePageSelected =
            selectedOnPage.length > 0 && selectedOnPage.length < pageKeywords.length

          return (
            <Checkbox
              checked={isAllPageSelected || (isSomePageSelected && "indeterminate")}
              onCheckedChange={value => {
                if (value) {
                  // Select only current page keywords
                  const nextSelection = { ...stateSelection }
                  pageKeywords.forEach(k => {
                    nextSelection[k] = true
                  })
                  table.setRowSelection(nextSelection)
                } else {
                  // Deselect ALL keywords as per request
                  table.setRowSelection({})
                }
              }}
            />
          )
        },
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
          />
        ),
      },
      { accessorKey: "keyword", header: "Keyword" },
      { accessorKey: "avgMonthlySearches", header: "Searches (Mo)", sortingFn: "basic" },
      {
        accessorKey: "competition",
        header: "Difficulty",
        sortingFn: (rowA, rowB, columnId) => {
          const order = { low: 1, medium: 2, high: 3, hard: 3 }
          const valA = order[String(rowA.getValue(columnId)).toLowerCase()] || 0
          const valB = order[String(rowB.getValue(columnId)).toLowerCase()] || 0
          return valA - valB
        },
      },
      { accessorKey: "competition_index", header: "Score", sortingFn: "basic" },
      { accessorKey: "lowBid", header: "Low Bid", sortingFn: "basic" },
      { accessorKey: "highBid", header: "High Bid", sortingFn: "basic" },
    ],
    [currentPage]
  )

  const filteredData = useMemo(() => {
    if (!showSelectedOnly) return tableData
    const selectedKeys = selectedKeywords?.allKeywords || []
    return tableData.filter(row => selectedKeys.includes(row.keyword))
  }, [tableData, showSelectedOnly, selectedKeywords])

  // Sync rowSelection state from store when store changes
  useEffect(() => {
    const selection = {}
    const allSelected = selectedKeywords?.allKeywords || []
    allSelected.forEach(kw => {
      selection[kw] = true
    })
    setRowSelection(selection)
  }, [selectedKeywords?.allKeywords])

  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: row => row.keyword,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: updater => {
      const nextSelection = typeof updater === "function" ? updater(rowSelection) : updater
      const selectedKeys = Object.keys(nextSelection).filter(k => nextSelection[k])

      if (selectedKeys.length === 0) {
        setSelectedKeywords({ focusKeywords: [], keywords: [], allKeywords: [] })
        return
      }

      let final = selectedKeys
      if (selectedKeys.length > 35) {
        toast.error("Selection limit of 35 keywords reached")

        const currentInView = currentRows.map(r => r.id)
        const inViewSelected = selectedKeys.filter(k => currentInView.includes(k))
        const remainingSlots = 35 - inViewSelected.length

        if (remainingSlots > 0) {
          const sortedAll = table.getSortedRowModel().rows.map(r => r.id)
          const lastInViewIdx = Math.max(...currentInView.map(id => sortedAll.indexOf(id)))

          // Keywords after the current view
          const subsequent = sortedAll
            .slice(lastInViewIdx + 1)
            .filter(k => selectedKeys.includes(k))
          // Keywords before the current view
          const preceeding = sortedAll
            .slice(0, Math.min(...currentInView.map(id => sortedAll.indexOf(id))))
            .filter(k => selectedKeys.includes(k))

          final = [...inViewSelected, ...subsequent, ...preceeding].slice(0, 35)
        } else {
          final = inViewSelected.slice(0, 35)
        }
      }

      setSelectedKeywords({ focusKeywords: final.slice(0, 3), keywords: final, allKeywords: final })
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  })

  const totalPages = Math.ceil(table.getFilteredRowModel().rows.length / REAL_PAGE_SIZE)
  const currentRows = table
    .getSortedRowModel()
    .rows.slice((currentPage - 1) * REAL_PAGE_SIZE, currentPage * REAL_PAGE_SIZE)

  const handlePageChange = page => setCurrentPage(page)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  useEffect(() => {
    if (showSelectedOnly && (selectedKeywords?.allKeywords?.length || 0) === 0) {
      setShowSelectedOnly(false)
    }
  }, [selectedKeywords?.allKeywords?.length, showSelectedOnly])

  useEffect(() => {
    return () => {
      setKeywords([])
      setNewKeyword("")
      setCurrentPage(1)
      setShowSelectedOnly(false)
    }
  }, [])

  const hasSelectedKeywords = (selectedKeywords?.allKeywords?.length || 0) > 0
  const allFilteredKeywords = table.getFilteredRowModel().rows.map(r => r.original)
  const isAllSelected =
    allFilteredKeywords.length > 0 &&
    allFilteredKeywords.every(row => selectedKeywords?.allKeywords?.includes(row.keyword))

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Keyword Research | GenWrite</title>
      </Helmet>
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-none border border-gray-200 p-4 px-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Keyword Research
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Discover high-potential keywords and analyze their performance.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-none border border-gray-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                placeholder="Enter keywords separated by commas..."
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={handleKeyPress}
                onPaste={handlePasteKeywords}
                className="w-full px-4 py-3 bg-gray-50 border-0 border-b-2 border-transparent rounded-xl focus:outline-none focus:border-primary focus:ring-0 transition-all text-sm placeholder-gray-400"
              />
            </div>
            <Button
              onClick={addKeyword}
              className="bg-primary hover:bg-[#3B4BB8] text-white font-semibold px-8 py-3 rounded-md transition-all h-11 flex items-center justify-center"
            >
              Add Keywords
            </Button>
          </div>

          <AnimatePresence mode="popLayout">
            {keywords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100"
              >
                {keywords.map((keyword, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center shadow-none hover:border-primary hover:text-primary transition-all"
                  >
                    <span className="text-sm font-medium">{keyword}</span>
                    <button
                      onClick={() => removeKeyword(index)}
                      className="ml-3 p-1 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={analyzeKeywords}
            disabled={keywords.length === 0 || analyzing}
            shape="pill"
            className="w-full bg-primary hover:bg-[#3B4BB8] text-white text-base py-5 rounded-xl transition-all font-bold"
          >
            {analyzing ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Analyzing Keywords...
              </span>
            ) : (
              "Analyze Keywords"
            )}
          </Button>

          {!analyzing && keywordAnalysisResult?.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6 border-t border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-3 mr-4">
                    <Switch
                      id="show-selected"
                      checked={showSelectedOnly}
                      onCheckedChange={setShowSelectedOnly}
                      disabled={!hasSelectedKeywords}
                    />
                    <label
                      htmlFor="show-selected"
                      className="text-sm font-semibold text-slate-700 cursor-pointer"
                    >
                      Filter Selected
                    </label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50 rounded-lg h-9"
                  >
                    <Download size={16} />
                    Export
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Selection Pool
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-primary font-bold bg-primary/10 px-4 py-1.5 rounded-lg border border-primary/20">
                      {selectedKeywords?.allKeywords?.length || 0} / 35 max
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id} className="border-slate-200">
                          {headerGroup.headers.map(header => (
                            <TableHead
                              key={header.id}
                              className={clsx(
                                "py-4 font-bold text-slate-800 select-none",
                                header.column.getCanSort() && "cursor-pointer hover:text-primary"
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <div className="flex items-center gap-2">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getCanSort() && (
                                  <div className="flex flex-col text-[10px]">
                                    {header.column.getIsSorted() === "asc" ? (
                                      <ArrowUp size={14} className="text-primary opacity-100" />
                                    ) : header.column.getIsSorted() === "desc" ? (
                                      <ArrowDown size={14} className="text-primary opacity-100" />
                                    ) : (
                                      <ArrowUp01 size={14} className="opacity-20 translate-y-px" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {currentRows.map(row => (
                        <TableRow
                          key={row.id}
                          className="group hover:bg-primary/5 border-slate-100 transition-colors"
                        >
                          {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id} className="py-3.5">
                              {cell.column.id === "keyword" ? (
                                <span className="font-bold text-slate-900 capitalize">
                                  {cell.getValue()}
                                </span>
                              ) : cell.column.id === "avgMonthlySearches" ? (
                                <span className="text-slate-600 font-medium tabular-nums">
                                  {new Intl.NumberFormat().format(cell.getValue())}
                                </span>
                              ) : cell.column.id === "competition" ? (
                                <Badge
                                  className={clsx(
                                    "shadow-none font-bold rounded-lg px-2.5 py-0.5 border-none",
                                    cell.getValue() === "LOW"
                                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                      : cell.getValue() === "MEDIUM"
                                        ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                        : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                                  )}
                                >
                                  {cell.getValue()}
                                </Badge>
                              ) : cell.column.id === "competition_index" ? (
                                <div className="text-right font-bold text-slate-400 tabular-nums pr-8">
                                  {cell.getValue() || "-"}
                                </div>
                              ) : cell.column.id === "lowBid" || cell.column.id === "highBid" ? (
                                <span className="text-slate-600 font-bold tabular-nums">
                                  {cell.getValue() ? (
                                    <>
                                      <span className="text-slate-400 text-[10px] mr-0.5">$</span>
                                      {cell.getValue().toFixed(2)}
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </span>
                              ) : (
                                flexRender(cell.column.columnDef.cell, cell.getContext())
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="text-sm text-slate-500 font-medium">
                    Showing{" "}
                    <span className="text-slate-900 font-bold">
                      {(currentPage - 1) * REAL_PAGE_SIZE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="text-slate-900 font-bold">
                      {Math.min(
                        currentPage * REAL_PAGE_SIZE,
                        table.getFilteredRowModel().rows.length
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="text-slate-900 font-bold">
                      {table.getFilteredRowModel().rows.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-[#4C5BD6] hover:border-[#4C5BD6]/30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="hidden sm:flex items-center gap-1.5">
                      {(() => {
                        const items = []
                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) items.push(i)
                        } else {
                          if (currentPage <= 4) {
                            for (let i = 1; i <= 5; i++) items.push(i)
                            items.push("...")
                            items.push(totalPages)
                          } else if (currentPage >= totalPages - 3) {
                            items.push(1)
                            items.push("...")
                            for (let i = totalPages - 4; i <= totalPages; i++) items.push(i)
                          } else {
                            items.push(1)
                            items.push("...")
                            items.push(currentPage - 1)
                            items.push(currentPage)
                            items.push(currentPage + 1)
                            items.push("...")
                            items.push(totalPages)
                          }
                        }

                        return items.map((item, i) =>
                          item === "..." ? (
                            <span
                              key={`dots-${i}`}
                              className="w-8 flex justify-center text-slate-400 font-bold"
                            >
                              ...
                            </span>
                          ) : (
                            <Button
                              key={item}
                              variant={currentPage === item ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(item)}
                              className={`h-9 w-9 p-0 rounded-lg text-sm font-bold transition-all ${
                                currentPage === item
                                  ? "bg-primary shadow-md shadow-primary/20 text-white hover:bg-primary"
                                  : "hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                              }`}
                            >
                              {item}
                            </Button>
                          )
                        )
                      })()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="h-9 w-9 p-0 rounded-lg hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-8">
                <Button
                  variant="outline"
                  onClick={showAutoKeywords}
                  disabled={analyzing || !keywordAnalysisResult?.length}
                  shape="pill"
                  className="bg-white border-primary/20 text-primary hover:bg-primary/5 py-5 px-6 text-base rounded-xl font-bold transition-all"
                >
                  <Info className="w-5 h-5 mr-3" />
                  Auto-Select
                </Button>
                <div className="hidden md:block" />
                <Button
                  onClick={handleCreateBlog}
                  disabled={!hasSelectedKeywords}
                  shape="pill"
                  className="bg-primary/10 hover:bg-primary/20 text-primary py-5 px-8 text-base font-bold rounded-xl transition-all border border-primary/20"
                >
                  Create Blog
                </Button>
                <Button
                  onClick={handleCreateJob}
                  disabled={!hasSelectedKeywords}
                  shape="pill"
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 py-5 px-8 text-base font-bold rounded-xl transition-all border border-purple-200"
                >
                  Create Job
                </Button>
              </div>

              {/* Connected Tools Suggestion */}
              <div className="pt-8 bg-slate-50/50 -mx-6 px-6 pb-6 border-t border-slate-100">
                <ConnectedTools currentToolId="keyword" transferValue={keywords.join(", ")} />
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={autoSelectVisible} onOpenChange={setAutoSelectVisible}>
        <DialogContent className="max-w-[450px] rounded-2xl border-none p-0">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 rounded-t-2xl">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <Sparkles className="w-5 h-5 text-primary" />
              Smart Auto-Selection
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Our AI has identified the most balanced keywords for your content strategy based on
              search volume and competitive indices.
            </p>
            <div className="flex flex-wrap gap-2">
              {getAutoSelectedKeywords().map(kw => (
                <div
                  key={kw}
                  className="text-xs bg-primary/5 text-primary px-3 py-1.5 rounded-lg border border-primary/10 capitalize font-bold"
                >
                  {kw}
                </div>
              ))}
            </div>
            <p className="text-sm font-bold text-slate-800">
              Would you like to proceed with these selections?
            </p>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex gap-3">
            <Button
              variant="ghost"
              className="font-bold flex-1 hover:bg-gray-200"
              onClick={() => setAutoSelectVisible(false)}
            >
              Decline
            </Button>
            <Button
              onClick={acceptAutoKeywords}
              className="bg-[#4C5BD6] hover:bg-[#3B4BB8] text-white font-bold flex-1 rounded-md h-11"
            >
              Accept Recommendations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Suspense fallback={<LoadingScreen />}>
        {showAdvancedBlogModal && (
          <AdvancedBlogModal
            closeFnc={() => setShowAdvancedBlogModal(false)}
            queryClient={queryClient}
          />
        )}
      </Suspense>
    </div>
  )
}

export default KeywordResearch
