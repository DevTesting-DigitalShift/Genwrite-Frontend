import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Button, Card, Input, Table, Tag, Modal } from "antd"
import { CloseOutlined } from "@ant-design/icons"
import { useDispatch, useSelector } from "react-redux"
import {
  analyzeKeywordsThunk,
  clearKeywordAnalysis,
  setSelectedKeywords,
} from "@store/slices/analysisSlice"

const KeywordResearchModel = ({ closeFnc, openSecondStepModal, openJobModal }) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [keywords, setKeywords] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [autoSelectedKeywords, setAutoSelectedKeywords] = useState([])

  const dispatch = useDispatch()
  const {
    keywordAnalysis: keywordAnalysisResult,
    loading: analyzing,
    error: analysisError,
    selectedKeywords,
  } = useSelector((state) => state.analysis)

  const addKeyword = () => {
    const input = newKeyword.trim()
    if (!input) return

    const existing = keywords.map((k) => k.toLowerCase())
    const seen = new Set()

    const newKeywords = input
      .split(",")
      .map((k) => k.trim())
      .filter(
        (k) =>
          k &&
          !existing.includes(k.toLowerCase()) &&
          !seen.has(k.toLowerCase()) &&
          seen.add(k.toLowerCase())
      )

    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords])
      setNewKeyword("") // clear input
    }
  }

  const removeKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  const analyzeKeywords = () => {
    dispatch(analyzeKeywordsThunk(keywords))
    setCurrentPage(1)
  }

  // Generate auto-selected keywords based on competition index
  const getAutoSelectedKeywords = () => {
    const byCompetition = { LOW: [], MEDIUM: [], HIGH: [] }
    keywordAnalysisResult?.forEach((kw) => {
      if (byCompetition[kw.competition]) {
        byCompetition[kw.competition].push({
          keyword: kw.keyword,
          competition_index: kw.competition_index,
        })
      }
    })

    // Sort by competition_index and select top 2 for each category
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
      ...sortedLow.map((item) => item.keyword),
      ...sortedMedium.map((item) => item.keyword),
      ...sortedHigh.map((item) => item.keyword),
    ]
  }

  const confirmAutoKeywords = (type) => {
    const autoKeywords = getAutoSelectedKeywords()
    setAutoSelectedKeywords(autoKeywords)

    Modal.confirm({
      title: "Auto-Selected Keywords",
      content: (
        <div>
          <p>We selected these keywords automatically based on competition index:</p>
          <ul className="list-disc ml-5 mt-2">
            {autoKeywords.map((kw) => (
              <li key={kw} className="capitalize">
                {kw}
              </li>
            ))}
          </ul>
          <p className="mt-3">Do you want to proceed with these?</p>
        </div>
      ),
      okText: "Accept",
      cancelText: "Decline",
      onOk() {
        // Combine user-selected and auto-generated keywords
        const finalKeywords = [
          ...(selectedKeywords?.focusKeywords || []),
          ...autoKeywords.filter((kw) => !selectedKeywords?.focusKeywords?.includes(kw)),
        ].slice(0, 6) // Limit to 6 keywords to avoid too many
        proceedWithSelectedKeywords(finalKeywords, type)
      },
      onCancel() {
        // Use only user-selected keywords
        const finalKeywords = selectedKeywords?.focusKeywords || []
        proceedWithSelectedKeywords(finalKeywords, type)
      },
    })
  }

  const handleCreateBlog = () => {
    if (selectedKeywords?.focusKeywords?.length > 0) {
      proceedWithSelectedKeywords(selectedKeywords.focusKeywords, "blog")
    } else {
      confirmAutoKeywords("blog")
    }
  }

  const handleCreateJob = () => {
    if (selectedKeywords?.focusKeywords?.length > 0) {
      proceedWithSelectedKeywords(selectedKeywords.focusKeywords, "job")
    } else {
      confirmAutoKeywords("job")
    }
  }

  const proceedWithSelectedKeywords = (finalSelectedKeywords, type) => {
    // Only send the final selected keywords, not all keywords
    dispatch(
      setSelectedKeywords({
        focusKeywords: finalSelectedKeywords,
        allKeywords: finalSelectedKeywords, // Only send selected keywords
      })
    )

    if (type === "blog") {
      openSecondStepModal()
    } else {
      openJobModal()
    }

    closeFnc()
  }

  const columns = [
    {
      title: "Keyword",
      dataIndex: "keyword",
      key: "keyword",
      sorter: (a, b) => a.keyword.localeCompare(b.keyword),
      render: (text) => <span className="font-medium capitalize">{text}</span>,
    },
    {
      title: "Monthly Searches",
      dataIndex: "avgMonthlySearches",
      key: "avgMonthlySearches",
      sorter: (a, b) => a.avgMonthlySearches - b.avgMonthlySearches,
      render: (value) => new Intl.NumberFormat().format(value),
    },
    {
      title: "Competition",
      dataIndex: "competition",
      key: "competition",
      sorter: (a, b) => a.competition_index - b.competition_index,
      render: (text) => (
        <Tag
          color={
            text === "LOW"
              ? "green"
              : text === "MEDIUM"
              ? "orange"
              : text === "HIGH"
              ? "red"
              : "gray"
          }
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Competition Index",
      dataIndex: "competition_index",
      key: "competition_index",
      sorter: (a, b) => a.competition_index - b.competition_index,
      render: (value) => (value ? value : "-"),
    },
  ]

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

  const handlePageChange = (page) => setCurrentPage(page)

  useEffect(() => {
    dispatch(clearKeywordAnalysis())
  }, [dispatch])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden border"
      >
        <Card
          title={
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Keyword Research</span>
              <button onClick={closeFnc} className="p-2 rounded-full hover:bg-gray-100">
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          }
          className="rounded-xl shadow-lg border-0"
        >
          <p className="mb-4 text-gray-600">Find and analyze keywords for your blog</p>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter a keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="primary" onClick={addKeyword}>
                Add
              </Button>
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {keywords.map((keyword, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
              >
                <span>{keyword}</span>
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  className="ml-2 cursor-pointer"
                  onClick={() => removeKeyword(index)}
                >
                  <CloseOutlined className="text-blue-800 text-xs" />
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              block
              type="primary"
              onClick={analyzeKeywords}
              loading={analyzing}
              disabled={keywords.length === 0}
            >
              Analyze Keywords
            </Button>
          </motion.div>

          {analysisError && <div className="text-red-500 mt-2">{analysisError}</div>}
          {keywordAnalysisResult && Array.isArray(keywordAnalysisResult) && (
            <div className="mt-6">
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={{
                  current: currentPage,
                  pageSize: 4,
                  showSizeChanger: false,
                  onChange: handlePageChange,
                  total: tableData.length,
                }}
                rowSelection={{
                  selectedRowKeys: selectedKeywords?.focusKeywords || [],
                  onChange: (selected) => {
                    dispatch(
                      setSelectedKeywords({
                        focusKeywords: selected,
                        allKeywords: selected, // Store only selected keywords
                      })
                    )
                  },
                  getCheckboxProps: (record) => ({
                    name: record.keyword,
                  }),
                }}
                rowKey={(record) => record.keyword}
                scroll={{ x: true }}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-5 border-t border-gray-100">
            <motion.button
              onClick={handleCreateBlog}
              className="px-5 py-2.5 text-sm font-medium mt-5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Create Blog
            </motion.button>
            <motion.button
              onClick={handleCreateJob}
              className="px-5 py-2.5 text-sm font-medium mt-5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Create New Job
            </motion.button>
            <motion.button
              onClick={closeFnc}
              className="px-5 py-2.5 text-sm font-medium mt-5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Close
            </motion.button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default KeywordResearchModel
