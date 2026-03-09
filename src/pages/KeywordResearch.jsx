import { useEffect, useState, lazy, Suspense } from "react"
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
import { X, ChevronLeft, ChevronRight, Search, Info, ArrowLeft, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"
import useJobStore from "@store/useJobStore"
import { useQueryClient } from "@tanstack/react-query"
import LoadingScreen from "@/components/ui/LoadingScreen"
import { Helmet } from "react-helmet"

const AdvancedBlogModal = lazy(() => import("@components/multipleStepModal/AdvancedBlogModal"))

const KeywordResearch = () => {
  const [newKeyword, setNewKeyword] = useState("")
  const [keywords, setKeywords] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [autoSelectVisible, setAutoSelectVisible] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })
  const [showAdvancedBlogModal, setShowAdvancedBlogModal] = useState(false)

  const navigate = useNavigate()
  const { openJobModal } = useJobStore()
  const queryClient = useQueryClient()

  const {
    keywordAnalysis: keywordAnalysisResult,
    loading: analyzing,
    selectedKeywords,
    clearKeywordAnalysis,
    setSelectedKeywords,
    analyzeKeywords: analyzeKeywordsAction,
  } = useAnalysisStore()

  const REAL_PAGE_SIZE = 10

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
    ].slice(0, 6)
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

  const totalPages = Math.ceil(filteredTableData.length / REAL_PAGE_SIZE)
  const currentData = filteredTableData.slice((currentPage - 1) * REAL_PAGE_SIZE, currentPage * REAL_PAGE_SIZE)

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

  const hasSelectedKeywords = (selectedKeywords?.allKeywords?.length || 0) > 0
  const isAllSelected =
    filteredTableData.length > 0 &&
    filteredTableData.every(row => selectedKeywords?.allKeywords?.includes(row.keyword))

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Keyword Research | GenWrite</title>
      </Helmet>
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-6 h-6 text-[#1B6FC9]" />
                Keyword Research
              </h1>
              <p className="text-sm text-slate-500 mt-1">Discover high-potential keywords and analyze their performance.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                placeholder="Enter keywords separated by commas..."
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]/20 focus:border-[#1B6FC9] transition-all text-sm"
              />
            </div>
            <Button
              onClick={addKeyword}
              className="bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white font-semibold px-8 py-3 h-auto rounded-lg transition-all shadow-md shadow-[#1B6FC9]/10"
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
                    className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all"
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
            className="w-full bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white text-base py-5 rounded-lg shadow-lg shadow-[#1B6FC9]/10 transition-all font-bold"
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
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
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1B6FC9] uppercase tracking-wider">
                    Selection Pool
                  </span>
                  <div className="text-sm text-blue-800 font-bold bg-blue-200/50 px-4 py-1.5 rounded-full border border-blue-300/30">
                    {selectedKeywords?.allKeywords?.length || 0} / {REAL_PAGE_SIZE} max
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="border-slate-200">
                        <TableHead className="w-[80px] text-center">
                          <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:text-blue-600 transition-colors py-4 font-bold text-slate-800"
                          onClick={() => requestSort("keyword")}
                        >
                          Keyword
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:text-blue-600 transition-colors py-4 font-bold text-slate-800"
                          onClick={() => requestSort("avgMonthlySearches")}
                        >
                          Searches (Mo)
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:text-blue-600 transition-colors py-4 font-bold text-slate-800"
                          onClick={() => requestSort("competition")}
                        >
                          Difficulty
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:text-blue-600 transition-colors text-right py-4 font-bold text-slate-800 pr-8"
                          onClick={() => requestSort("competition_index")}
                        >
                          Score
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.map(row => (
                        <TableRow
                          key={row.keyword}
                          className="group hover:bg-[#1B6FC9]/5 border-slate-100 transition-colors"
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedKeywords?.allKeywords?.includes(row.keyword)}
                              onCheckedChange={checked => toggleSelectRow(row.keyword, checked)}
                            />
                          </TableCell>
                          <TableCell className="font-bold text-slate-900 py-3.5 capitalize">
                            {row.keyword}
                          </TableCell>
                          <TableCell className="text-slate-600 font-medium tabular-nums py-3.5">
                            {new Intl.NumberFormat().format(row.avgMonthlySearches)}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <Badge
                              className={`
                                shadow-none font-bold rounded-lg px-2.5 py-0.5
                                ${
                                  row.competition === "LOW"
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"
                                    : row.competition === "MEDIUM"
                                      ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-none"
                                      : "bg-rose-100 text-rose-700 hover:bg-rose-100 border-none"
                                }
                              `}
                            >
                              {row.competition}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-400 tabular-nums py-3.5 pr-8">
                            {row.competition_index || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="text-sm text-slate-500 font-medium">
                    Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * REAL_PAGE_SIZE + 1}</span> to{" "}
                    <span className="text-slate-900 font-bold">{Math.min(currentPage * REAL_PAGE_SIZE, filteredTableData.length)}</span> of{" "}
                    <span className="text-slate-900 font-bold">{filteredTableData.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="h-9 w-9 p-0 rounded-lg"
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
                              className={`h-9 w-9 p-0 rounded-lg text-sm font-bold ${currentPage === item ? 'bg-[#1B6FC9] shadow-md shadow-[#1B6FC9]/20 text-white' : ''}`}
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
                      className="h-9 w-9 p-0 rounded-lg"
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
                  className="bg-white border-[#1B6FC9]/20 text-[#1B6FC9] hover:bg-[#1B6FC9]/5 py-5 px-6 text-base rounded-lg font-bold transition-all"
                >
                  <Info className="w-5 h-5 mr-3" />
                  Auto-Select
                </Button>
                <div className="hidden md:block" />
                <Button
                  onClick={handleCreateBlog}
                  disabled={!hasSelectedKeywords}
                  className="bg-[#1B6FC9]/10 hover:bg-[#1B6FC9]/20 text-[#1B6FC9] py-5 px-8 text-base font-bold rounded-lg transition-all border border-[#1B6FC9]/20"
                >
                  Create Blog
                </Button>
                <Button
                  onClick={handleCreateJob}
                  disabled={!hasSelectedKeywords}
                  className="bg-purple-100/50 hover:bg-purple-200/50 text-purple-700 py-5 px-8 text-base font-bold rounded-lg transition-all border border-purple-200/50"
                >
                  Create Job
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={autoSelectVisible} onOpenChange={setAutoSelectVisible}>
        <DialogContent className="max-w-[450px] rounded-2xl border-none p-0">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 rounded-t-2xl">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1B6FC9]" />
              Smart Auto-Selection
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Our AI has identified the most balanced keywords for your content strategy based on search volume and competitive indices.
            </p>
            <div className="flex flex-wrap gap-2">
              {getAutoSelectedKeywords().map(kw => (
                <div
                  key={kw}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 capitalize font-bold"
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
            <Button variant="ghost" className="font-bold flex-1" onClick={() => setAutoSelectVisible(false)}>
              Decline
            </Button>
            <Button
              onClick={acceptAutoKeywords}
              className="bg-[#1B6FC9] hover:bg-[#1B6FC9]/90 text-white font-bold flex-1 shadow-lg shadow-[#1B6FC9]/10"
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
