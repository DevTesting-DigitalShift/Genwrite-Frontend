import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import useAnalysisStore from "@store/useAnalysisStore"
import { toast } from "sonner"
import { X, ChevronLeft, ChevronRight, Search, Info } from "lucide-react"

const KeywordResearchModel = ({ closeFnc, openSecondStepModal, openJobModal, visible }) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [keywords, setKeywords] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [autoSelectVisible, setAutoSelectVisible] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

  const {
    keywordAnalysis: keywordAnalysisResult,
    loading: analyzing,
    selectedKeywords,
    clearKeywordAnalysis,
    setSelectedKeywords,
    analyzeKeywords: analyzeKeywordsAction,
  } = useAnalysisStore()

  const pageSize = 5

  useEffect(() => {
    if (keywords.length === 0) {
      setCurrentPage(1)
      clearKeywordAnalysis()
    }
  }, [keywords, clearKeywordAnalysis])

  const addKeyword = () => {
    const input = newKeyword.trim()
    if (!input) return

    const existing = keywords.map(k => k.toLowerCase())
    const seen = new Set()

    const newKeywords = input
      .split(",")
      .map(k => k.trim())
      .filter(
        k =>
          k &&
          !existing.includes(k.toLowerCase()) &&
          !seen.has(k.toLowerCase()) &&
          seen.add(k.toLowerCase())
      )

    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords])
      setNewKeyword("")
    }
  }

  const removeKeyword = index => {
    const keywordToRemove = keywords[index]
    const updatedKeywords = keywords.filter((_, i) => i !== index)
    setKeywords(updatedKeywords)
    if (updatedKeywords.length === 0) {
      clearKeywordAnalysis()
      setCurrentPage(1)
    }
    // Remove from selectedKeywords if present
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
    ].slice(0, 6) // Limit to 6 keywords
    setSelectedKeywords({
      focusKeywords: finalKeywords.slice(0, 3),
      keywords: finalKeywords,
      allKeywords: finalKeywords,
    })
    setAutoSelectVisible(false)
  }

  const proceedWithSelectedKeywords = async type => {
    const finalKeywords = selectedKeywords?.allKeywords || []
    setSelectedKeywords({
      focusKeywords: finalKeywords.slice(0, 3),
      keywords: finalKeywords.slice(3),
      allKeywords: finalKeywords,
    })
    closeFnc()
    setTimeout(() => {
      if (type === "blog") {
        openSecondStepModal()
      } else {
        openJobModal()
      }
    }, 100)
  }

  const handleCreateBlog = () => {
    proceedWithSelectedKeywords("blog")
  }

  const handleCreateJob = () => {
    proceedWithSelectedKeywords("job")
  }

  const requestSort = key => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const tableData =
    keywordAnalysisResult?.map((kw, idx) => ({
      key: idx,
      keyword: kw.keyword,
      avgMonthlySearches: kw.avgMonthlySearches,
      competition: kw.competition,
      competition_index: kw.competition_index,
      avgCpc: kw.avgCpc,
      lowBid: kw.lowBid,
      highBid: kw.highBid,
    })) || []

  // Sorting logic
  let sortedData = [...tableData]
  if (sortConfig.key) {
    sortedData.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }

  const filteredTableData = showSelectedOnly
    ? sortedData.filter(row => selectedKeywords?.allKeywords?.includes(row.keyword))
    : sortedData

  const totalPages = Math.ceil(filteredTableData.length / pageSize)
  const currentData = filteredTableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handlePageChange = page => setCurrentPage(page)

  const toggleSelectAll = checked => {
    if (checked) {
      const allKeys = filteredTableData.map(row => row.keyword)
      setSelectedKeywords({
        focusKeywords: allKeys.slice(0, 3),
        keywords: allKeys,
        allKeywords: allKeys,
      })
    } else {
      setSelectedKeywords({ focusKeywords: [], keywords: [], allKeywords: [] })
    }
  }

  const toggleSelectRow = (keyword, checked) => {
    const currentSelected = selectedKeywords?.allKeywords || []
    let newSelected
    if (checked) {
      newSelected = [...currentSelected, keyword]
    } else {
      newSelected = currentSelected.filter(kw => kw !== keyword)
    }

    setSelectedKeywords({
      focusKeywords: newSelected.slice(0, 3),
      keywords: newSelected,
      allKeywords: newSelected,
    })
  }

  useEffect(() => {
    return () => {
      setKeywords([])
      setNewKeyword("")
      setCurrentPage(1)
      setShowSelectedOnly(false)
    }
  }, [])

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [visible])

  const hasSelectedKeywords = (selectedKeywords?.allKeywords?.length || 0) > 0
  const isAllSelected =
    filteredTableData.length > 0 &&
    filteredTableData.every(row => selectedKeywords?.allKeywords?.includes(row.keyword))

  return (
    <>
      <Dialog open={visible} onOpenChange={open => !open && closeFnc()}>
        <DialogContent className="max-w-[1000px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-xl border-none">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Keyword Research
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">Find and analyze keywords for your blog</p>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  placeholder="Enter a keyword (e.g. digital marketing, seo)"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  aria-label="Enter keyword"
                />
              </div>
              <Button
                onClick={addKeyword}
                className="bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white font-medium px-6 py-2.5 h-auto transition-all"
              >
                Add Keyword
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              {keywords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  {keywords.map((keyword, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-white border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full flex items-center shadow-sm group hover:border-blue-300 transition-all"
                    >
                      <span className="text-xs font-semibold lowercase ml-0.5">{keyword}</span>
                      <button
                        onClick={() => removeKeyword(index)}
                        className="ml-2 p-0.5 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={analyzeKeywords}
              disabled={keywords.length === 0 || analyzing}
              className="w-full bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white text-base disabled:opacity-30 transition-all"
            >
              {analyzing ? (
                <span className="flex items-center gap-2">Analyzing Keywords...</span>
              ) : (
                "Analyze Keywords"
              )}
            </Button>

            {!analyzing && keywordAnalysisResult?.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="show-selected"
                      checked={showSelectedOnly}
                      onCheckedChange={setShowSelectedOnly}
                      disabled={!hasSelectedKeywords}
                    />
                    <label
                      htmlFor="show-selected"
                      className="text-sm font-medium text-slate-700 cursor-pointer"
                    >
                      Show Selected Only
                    </label>
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    {selectedKeywords?.allKeywords?.length || 0} keywords selected
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => requestSort("keyword")}
                          >
                            Keyword
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => requestSort("avgMonthlySearches")}
                          >
                            Monthly Searches
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => requestSort("competition")}
                          >
                            Competition
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:text-blue-600 transition-colors text-right"
                            onClick={() => requestSort("competition_index")}
                          >
                            Index
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentData.map(row => (
                          <TableRow
                            key={row.keyword}
                            className="group hover:bg-slate-50/80 transition-colors"
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedKeywords?.allKeywords?.includes(row.keyword)}
                                onCheckedChange={checked => toggleSelectRow(row.keyword, checked)}
                              />
                            </TableCell>
                            <TableCell className="font-semibold text-slate-800 capitalize">
                              {row.keyword}
                            </TableCell>
                            <TableCell className="text-slate-600 tabular-nums">
                              {new Intl.NumberFormat().format(row.avgMonthlySearches)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`
                                  ${
                                    row.competition === "LOW"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : row.competition === "MEDIUM"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                  }
                                `}
                              >
                                {row.competition}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-slate-500 italic">
                              {row.competition_index || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Manual Pagination */}
                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="text-xs text-slate-500">
                      Showing {(currentPage - 1) * pageSize + 1} to{" "}
                      {Math.min(currentPage * pageSize, filteredTableData.length)} of{" "}
                      {filteredTableData.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-1">
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
                                className="h-8 w-8 flex items-center justify-center text-slate-400 text-xs"
                              >
                                ...
                              </span>
                            ) : (
                              <Button
                                key={item}
                                variant={currentPage === item ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(item)}
                                className="h-8 w-8 p-0 text-xs"
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
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={showAutoKeywords}
              disabled={analyzing || !keywordAnalysisResult?.length}
              className="border-blue-200 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
            >
              <Info className="w-4 h-4 mr-2" />
              Auto-Select
            </Button>
            <div className="flex-1" />
            <Button
              variant="secondary"
              onClick={handleCreateBlog}
              disabled={!hasSelectedKeywords}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              Create Blog
            </Button>
            <Button
              variant="secondary"
              onClick={handleCreateJob}
              disabled={!hasSelectedKeywords}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              Create Job
            </Button>
            <Button
              variant="default"
              onClick={closeFnc}
              className="bg-[#1B6FC9] hover:bg-[#1B6FC9]/90"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Select Confirmation Dialog */}
      <Dialog open={autoSelectVisible} onOpenChange={setAutoSelectVisible}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Auto-Selected Keywords</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-500">
              We selected these keywords automatically based on competition index:
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {getAutoSelectedKeywords().map(kw => (
                <li
                  key={kw}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded capitalize font-medium"
                >
                  {kw}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium text-slate-700">
              Do you want to add these to your selection?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoSelectVisible(false)}>
              Decline
            </Button>
            <Button
              onClick={acceptAutoKeywords}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default KeywordResearchModel
