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

const KeywordResearchModel = ({ closeFnc, openSecondStepModal, openJobModal, visible }) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [keywords, setKeywords] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  const dispatch = useDispatch()

  const {
    keywordAnalysis: keywordAnalysisResult,
    loading: analyzing,
    selectedKeywords,
  } = useSelector((state) => state.analysis)
  
  // console.log({ selectedKeywords })

  useEffect(() => {
    if (keywords.length === 0) {
      setCurrentPage(1)
    }
  }, [keywords, dispatch])

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
      setNewKeyword("")
    }
  }

  const removeKeyword = (index) => {
    const updatedKeywords = keywords.filter((_, i) => i !== index)
    setKeywords(updatedKeywords)
    if (updatedKeywords.length === 0) {
      dispatch(clearKeywordAnalysis())
      setCurrentPage(1)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  const analyzeKeywords = () => {
    if (keywords.length > 0) {
      dispatch(analyzeKeywordsThunk(keywords))
      setCurrentPage(1)
    }
  }

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

    const modal = Modal.info({
      icon: null,
      title: (
        <div className="flex justify-between items-center">
          <span>Auto-Selected Keywords</span>
        </div>
      ),
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
      closable: true,
      onOk() {
        const finalKeywords = [
          ...(selectedKeywords?.focusKeywords || []),
          ...autoKeywords.filter((kw) => !selectedKeywords?.focusKeywords?.includes(kw)),
        ].slice(0, 6)
        proceedWithSelectedKeywords(finalKeywords, type)
      },
      onCancel() {
        const finalKeywords = selectedKeywords?.focusKeywords || []
        proceedWithSelectedKeywords(finalKeywords, type)
      },
      okButtonProps: { className: "bg-blue-600 text-white" },
    })
  }

  const handleCreateBlog = () => {
    confirmAutoKeywords("blog")
  }

  const handleCreateJob = () => {
    confirmAutoKeywords("job")
  }

  const proceedWithSelectedKeywords = async (finalSelectedKeywords, type) => {
    // Split into focusKeywords (first 3) and keywords (remaining)
    const focusKeywords = finalSelectedKeywords.slice(0, 3)
    const keywords = finalSelectedKeywords.slice(3)

    await dispatch(
      setSelectedKeywords({
        focusKeywords,
        allKeywords: finalSelectedKeywords,
        keywords,
      })
    )

    // Wait briefly to ensure Redux state updates
    setTimeout(() => {
      if (type === "blog") {
        openSecondStepModal({
          focusKeywords,
          keywords,
          allKeywords: finalSelectedKeywords,
        })
      } else {
        openJobModal()
      }
      closeFnc()
    }, 100)
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

  // Modified cleanup to avoid resetting selectedKeywords
  useEffect(() => {
    return () => {
      setKeywords([])
      setNewKeyword("")
      setCurrentPage(1)
    }
  }, [dispatch])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [open])

  return (
    <Modal
      open={visible}
      onCancel={closeFnc}
      closable={true}
      footer={[
        <>
          <div className="flex justify-end gap-3 pt-2 border-gray-100">
            <motion.button
              onClick={handleCreateBlog}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={!keywordAnalysisResult || analyzing || keywords.length === 0}
            >
              Create Blog
            </motion.button>
            <motion.button
              onClick={handleCreateJob}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={!keywordAnalysisResult || analyzing || keywords.length === 0}
            >
              Create New Job
            </motion.button>
            <motion.button
              onClick={closeFnc}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Close
            </motion.button>
          </div>
        </>,
      ]}
      width={1000}
      centered
      title="Keyword Research"
      maskClosable
    >
      <div>
        <p className="mb-4 text-gray-600">Find and analyze keywords for your blog</p>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter a keyword"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            aria-label="Enter keyword"
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
              animate={{ opacity: 1 }}
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

        {keywords.length > 0 &&
          !analyzing &&
          keywordAnalysisResult &&
          Array.isArray(keywordAnalysisResult) &&
          keywordAnalysisResult.length > 0 && (
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
                        allKeywords: selected,
                        keywords: selected.slice(3), // Update keywords for remaining
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
      </div>
    </Modal>
  )
}

export default KeywordResearchModel
