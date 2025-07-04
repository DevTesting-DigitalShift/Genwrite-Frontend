import { useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Button, Card, Input, Table, Tag } from "antd"
import { CloseOutlined } from "@ant-design/icons"
import { useDispatch, useSelector } from "react-redux"
import { analyzeKeywordsThunk, setSelectedKeywords } from "@store/slices/analysisSlice"

const KeywordResearchModel = ({ closeFnc, openSecondStepModal, openJobModal }) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [keywords, setKeywords] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const dispatch = useDispatch()
  const {
    keywordAnalysis: keywordAnalysisResult,
    loading: analyzing,
    error: analysisError,
  } = useSelector((state) => state.analysis)

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()])
      setNewKeyword("")
    }
  }

  const removeKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addKeyword()
    }
  }

  const analyzeKeywords = async () => {
    dispatch(analyzeKeywordsThunk(keywords))
    setCurrentPage(1) // Reset to first page on new analysis
  }

  const handleCreateBlog = () => {
    dispatch(setSelectedKeywords(keywords))
    openSecondStepModal()
    closeFnc()
  }

  const handleCreateJob = () => {
    dispatch(setSelectedKeywords(keywords))
    openJobModal()
    closeFnc()
  }

  // Table columns for keyword analysis results
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
      title: "Avg CPC ($)",
      dataIndex: "avgCpc",
      key: "avgCpc",
      sorter: (a, b) => a.avgCpc - b.avgCpc,
      render: (value) => (value ? value.toFixed(2) : "-"),
    },
    {
      title: "Low Bid ($)",
      dataIndex: "lowBid",
      key: "lowBid",
      sorter: (a, b) => a.lowBid - b.lowBid,
      render: (value) => (value ? value.toFixed(2) : "N/-"),
    },
    {
      title: "High Bid ($)",
      dataIndex: "highBid",
      key: "highBid",
      sorter: (a, b) => a.highBid - b.highBid,
      render: (value) => (value ? value.toFixed(2) : "N/-"),
    },
  ]

  // Prepare table data from keywordAnalysisResult
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

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

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
              <button
                onClick={closeFnc}
                className="p-2 rounded-full hover:bg-gray-100 transition-all"
              >
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          }
          className="rounded-xl shadow-lg border-0 relative overflow-hidden transition-all duration-300 hover:shadow-xl"
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
                exit={{ opacity: 0, scale: 0.8 }}
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
                  pageSize: 4, // Limit to 4 rows per page
                  showSizeChanger: false, // Disable page size changer
                  onChange: handlePageChange,
                  total: tableData.length,
                }}
                rowKey="key"
                className="keyword-analysis-table"
                scroll={{ x: true }} // Enable horizontal scroll for small screens
              />
            </div>
          )}
          <div className="flex justify-end gap-3 mt-5 border-t border-gray-100">
            <motion.button
              onClick={handleCreateBlog}
              className="px-5 py-2.5 text-sm font-medium mt-5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Create Blog
            </motion.button>
            <motion.button
              onClick={handleCreateJob}
              className="px-5 py-2.5 text-sm font-medium mt-5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Create New Job
            </motion.button>
            <motion.button
              onClick={closeFnc}
              className="px-5 py-2.5 text-sm font-medium mt-5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300"
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
