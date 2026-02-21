import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import useAnalysisStore from "@store/useAnalysisStore"
import toast from "@utils/toast"

const KeywordResearchModel = ({ closeFnc, openSecondStepModal, openJobModal, visible }) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [keywords, setKeywords] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [showAutoSelectModal, setShowAutoSelectModal] = useState(false)
  const [autoSelectedList, setAutoSelectedList] = useState([])

  const {
    keywordAnalysis: keywordAnalysisResult,
    loading: analyzing,
    selectedKeywords,
    clearKeywordAnalysis,
    setSelectedKeywords,
    analyzeKeywords: analyzeKeywordsAction,
  } = useAnalysisStore()

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

    const sortedLow = byCompetition.LOW.sort(
      (a, b) => a.competition_index - b.competition_index
    ).slice(0, 2)
    const sortedMedium = byCompetition.MEDIUM.sort(
      (a, b) => a.competition_index - b.competition_index
    ).slice(0, 2)
    const sortedHigh = byCompetition.HIGH.sort(
      (a, b) => a.competition_index - b.competition_index
    ).slice(0, 2)

    return [
      ...sortedLow.map(item => item.keyword),
      ...sortedMedium.map(item => item.keyword),
      ...sortedHigh.map(item => item.keyword),
    ]
  }

  const handleShowAutoKeywords = () => {
    const autoKeywords = getAutoSelectedKeywords()
    if (!autoKeywords.length || !keywordAnalysisResult?.length) {
      toast.error("No keywords available to auto-select. Please analyze keywords first.")
      return
    }
    setAutoSelectedList(autoKeywords)
    setShowAutoSelectModal(true)
  }

  const confirmAutoSelect = () => {
    const finalKeywords = [
      ...(selectedKeywords?.allKeywords || []),
      ...autoSelectedList.filter(kw => !selectedKeywords?.allKeywords?.includes(kw)),
    ].slice(0, 6) // Limit to 6 keywords

    setSelectedKeywords({
      focusKeywords: finalKeywords.slice(0, 3),
      keywords: finalKeywords,
      allKeywords: finalKeywords,
    })
    setShowAutoSelectModal(false)
    toast.success("Keywords auto-selected successfully")
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

  const filteredTableData = showSelectedOnly
    ? tableData.filter(row => selectedKeywords?.allKeywords?.includes(row.keyword))
    : tableData

  const hasSelectedKeywords = selectedKeywords?.allKeywords?.length > 0

  // Manual Pagination Logic
  const pageSize = 5
  const totalPages = Math.ceil(filteredTableData.length / pageSize)
  const paginatedData = filteredTableData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Smart Pagination Logic
  const getPageNumbers = () => {
    const pages = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push("...")
        pages.push(totalPages)
      }
    }
    return pages
  }

  const toggleRowSelection = keyword => {
    const currentSelected = selectedKeywords?.allKeywords || []
    let newSelected
    if (currentSelected.includes(keyword)) {
      newSelected = currentSelected.filter(k => k !== keyword)
    } else {
      newSelected = [...currentSelected, keyword]
    }
    setSelectedKeywords({
      focusKeywords: newSelected.slice(0, 3),
      keywords: newSelected,
      allKeywords: newSelected,
    })
  }

  // Handle body scroll lock
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

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={closeFnc} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Keyword Research</h2>
              <p className="text-sm text-gray-500 font-medium">
                Find and analyze keywords for your blog
              </p>
            </div>
          </div>
          <button
            onClick={closeFnc}
            className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/50">
          {/* Input Area */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter keywords (comma separated)..."
                  className="input border border-gray-300 w-full pl-10 h-12 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white text-black"
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <button
                onClick={addKeyword}
                className="btn bg-blue-500 text-md text-white rounded-lg h-12 px-6 font-medium"
              >
                Add
              </button>
            </div>

            {/* Keyword Tags */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 max-h-32 overflow-y-auto px-1 py-1">
                {keywords.map((keyword, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="badge badge-lg bg-blue-50 text-blue-700 border-blue-100 gap-2 h-auto py-2 pl-3 pr-2"
                  >
                    <span className="text-sm font-medium">{keyword}</span>
                    <button
                      onClick={() => removeKeyword(index)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Analyze Button */}
            <div className="mt-4">
              <button
                onClick={analyzeKeywords}
                disabled={keywords.length === 0 || analyzing}
                className={`btn w-full h-12 text-base font-medium rounded-lg transition-all
                        ${
                          analyzing || keywords.length === 0
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none"
                            : "bg-blue-500 text-white"
                        }`}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" /> Analyzing...
                  </>
                ) : (
                  "Analyze Keywords"
                )}
              </button>
            </div>
          </div>

          {/* Results Area */}
          {!analyzing && keywordAnalysisResult?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="form-control">
                  <label className="label cursor-pointer gap-2 justify-start">
                    <input
                      type="checkbox"
                      className="toggle bg-gray-300 toggle-sm"
                      checked={showSelectedOnly}
                      onChange={e => setShowSelectedOnly(e.target.checked)}
                      disabled={!hasSelectedKeywords}
                    />
                    <span className="label-text font-medium text-gray-700">Show Selected Only</span>
                  </label>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Showing {paginatedData.length} of {filteredTableData.length} results
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="table w-full">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="w-12 text-center">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs rounded-sm"
                          disabled
                        />
                      </th>
                      <th className="py-4">Keyword</th>
                      <th className="py-4 text-center">Vol</th>
                      <th className="py-4 text-center">Comp</th>
                      <th className="py-4 text-center">Comp. Idx</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm">
                    {paginatedData.map(row => {
                      const isSelected = selectedKeywords?.allKeywords?.includes(row.keyword)
                      return (
                        <tr
                          key={row.keyword}
                          onClick={() => toggleRowSelection(row.keyword)}
                          className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${isSelected ? "bg-blue-50/30" : ""}`}
                        >
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm rounded-md"
                              checked={!!isSelected}
                              onChange={() => toggleRowSelection(row.keyword)}
                            />
                          </td>
                          <td className="font-medium">{row.keyword}</td>
                          <td className="text-center font-mono text-xs">
                            {new Intl.NumberFormat().format(row.avgMonthlySearches)}
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge rounded-sm font-medium text-sm border
                                                ${
                                                  row.competition === "LOW"
                                                    ? "bg-green-100 text-green-600 border-green-300"
                                                    : row.competition === "MEDIUM"
                                                      ? "bg-amber-100 text-amber-600 border-amber-300"
                                                      : "bg-red-100 text-red-600 border-red-300"
                                                }`}
                            >
                              {row.competition}
                            </span>
                          </td>
                          <td className="text-center font-mono text-xs">
                            {row.competition_index ?? "-"}
                          </td>
                        </tr>
                      )
                    })}
                    {paginatedData.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500">
                          No keywords found matching criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="join">
                    <button
                      className="join-item btn btn-sm bg-white border border-gray-200"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      «
                    </button>
                    {getPageNumbers().map((page, i) => (
                      <button
                        key={i}
                        className={`join-item btn btn-sm border border-gray-200 ${
                          page === currentPage
                            ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        } ${page === "..." ? "btn-disabled bg-transparent border-none text-gray-400 cursor-default" : ""}`}
                        disabled={page === "..."}
                        onClick={() => typeof page === "number" && setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="join-item btn btn-sm bg-white border border-gray-200"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <button
            onClick={handleShowAutoKeywords}
            disabled={analyzing || !keywordAnalysisResult?.length}
            className="btn btn-ghost text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium normal-case flex items-center gap-2"
          >
            <CheckCircle2 size={18} /> Auto-Select Keywords
          </button>

          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={closeFnc}
              className="btn bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 flex-1 sm:flex-none font-medium"
            >
              Close
            </button>

            <button
              onClick={handleCreateBlog}
              disabled={!hasSelectedKeywords}
              className="btn bg-blue-500 border-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 font-medium"
            >
              Create Blog
            </button>
            <button
              onClick={handleCreateJob}
              disabled={!hasSelectedKeywords}
              className="btn bg-blue-500 border-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 font-medium"
            >
              Job
            </button>
          </div>
        </div>
      </motion.div>

      {/* Auto Select Modal Overlay */}
      <AnimatePresence>
        {showAutoSelectModal && (
          <div className="fixed inset-0 z-1100 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowAutoSelectModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Auto-Selected Keywords</h3>
                <p className="text-sm text-gray-500 mb-4">
                  We found these low-competition keywords for you:
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-6 max-h-48 overflow-y-auto border border-gray-100">
                  <ul className="space-y-2">
                    {autoSelectedList.map(kw => (
                      <li
                        key={kw}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                      >
                        <CheckCircle2 size={16} className="text-green-500" />{" "}
                        <span className="capitalize">{kw}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowAutoSelectModal(false)}
                    className="btn btn-sm btn-ghost"
                  >
                    Cancel
                  </button>
                  <button onClick={confirmAutoSelect} className="btn btn-sm btn-primary">
                    Accept & Add
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default KeywordResearchModel
