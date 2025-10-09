import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CloseOutlined } from "@ant-design/icons"
import { Button, Input, Table, Tag, Modal, Switch } from "antd"
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
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)

  const dispatch = useDispatch()
  const {
    keywordAnalysis: keywordAnalysisResult,
    loading: analyzing,
    selectedKeywords,
  } = useSelector((state) => state.analysis)

  useEffect(() => {
    if (keywords.length === 0) {
      setCurrentPage(1)
      dispatch(clearKeywordAnalysis())
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
    const keywordToRemove = keywords[index]
    const updatedKeywords = keywords.filter((_, i) => i !== index)
    setKeywords(updatedKeywords)
    if (updatedKeywords.length === 0) {
      dispatch(clearKeywordAnalysis())
      setCurrentPage(1)
    }
    // Remove from selectedKeywords if present
    if (selectedKeywords?.allKeywords?.includes(keywordToRemove)) {
      const updatedSelectedKeywords = selectedKeywords.allKeywords.filter(
        (kw) => kw !== keywordToRemove
      )
      dispatch(
        setSelectedKeywords({
          focusKeywords: updatedSelectedKeywords.slice(0, 3),
          keywords: updatedSelectedKeywords,
          allKeywords: updatedSelectedKeywords,
        })
      )
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

  const showAutoKeywords = () => {
    const autoKeywords = getAutoSelectedKeywords()
    if (!autoKeywords.length || !keywordAnalysisResult?.length) {
      Modal.error({
        title: "No Auto-Selected Keywords",
        content: "No keywords available to auto-select. Please analyze keywords first.",
      })
      return
    }

    Modal.info({
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
              <li key={kw} className="capitalize text-sm sm:text-base">
                {kw}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm sm:text-base">Do you want to add these too?</p>
        </div>
      ),
      okText: "Accept",
      cancelText: "Decline",
      closable: true,
      onOk() {
        const finalKeywords = [
          ...(selectedKeywords?.allKeywords || []),
          ...autoKeywords.filter((kw) => !selectedKeywords?.allKeywords?.includes(kw)),
        ].slice(0, 6) // Limit to 6 keywords
        dispatch(
          setSelectedKeywords({
            focusKeywords: finalKeywords.slice(0, 3),
            keywords: finalKeywords,
            allKeywords: finalKeywords,
          })
        )
      },
      onCancel() {
        // Keep existing selected keywords
        const finalKeywords = selectedKeywords?.allKeywords || []
        dispatch(
          setSelectedKeywords({
            focusKeywords: finalKeywords.slice(0, 3),
            keywords: finalKeywords,
            allKeywords: finalKeywords,
          })
        )
      },
      okButtonProps: { className: "bg-blue-600 text-white" },
    })
  }

  const proceedWithSelectedKeywords = async (type) => {
    const finalKeywords = selectedKeywords?.allKeywords || []
    await dispatch(
      setSelectedKeywords({
        focusKeywords: finalKeywords.slice(0, 3),
        keywords: finalKeywords.slice(3),
        allKeywords: finalKeywords,
      })
    )

    setTimeout(() => {
      if (type === "blog") {
        openSecondStepModal({
          focusKeywords: finalKeywords.slice(0, 3),
          keywords: finalKeywords.slice(3),
          allKeywords: finalKeywords,
        })
      } else {
        openJobModal()
      }
      closeFnc()
    }, 100)
  }

  const handleCreateBlog = () => {
    proceedWithSelectedKeywords("blog")
  }

  const handleCreateJob = () => {
    proceedWithSelectedKeywords("job")
  }

  const columns = [
    {
      title: "Keyword",
      dataIndex: "keyword",
      key: "keyword",
      sorter: (a, b) => a.keyword.localeCompare(b.keyword),
      render: (text) => <span className="font-medium capitalize text-sm sm:text-base">{text}</span>,
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
          className="text-xs sm:text-sm"
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

  const filteredTableData = showSelectedOnly
    ? tableData.filter((row) => selectedKeywords?.allKeywords?.includes(row.keyword))
    : tableData

  const handlePageChange = (page) => setCurrentPage(page)

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

  const hasSelectedKeywords = selectedKeywords?.allKeywords?.length > 0

  return (
    <Modal
      open={visible}
      onCancel={closeFnc}
      closable={true}
      footer={[
        <div
          key="footer-buttons"
          className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 border-t border-gray-100"
        >
          <motion.button
            onClick={showAutoKeywords}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={analyzing || !keywordAnalysisResult?.length}
            style={{
              opacity: analyzing || !keywordAnalysisResult?.length ? 0.5 : 1,
              cursor: analyzing || !keywordAnalysisResult?.length ? "not-allowed" : "pointer",
            }}
          >
            Show Auto-Selected Keywords
          </motion.button>
          <motion.button
            onClick={handleCreateBlog}
            className={`px-4 py-2 text-sm font-medium rounded-lg w-full sm:w-auto ${
              hasSelectedKeywords
                ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                : "text-gray-400 bg-gray-200 cursor-not-allowed"
            }`}
            whileHover={{ scale: hasSelectedKeywords ? 1.03 : 1 }}
            whileTap={{ scale: hasSelectedKeywords ? 0.97 : 1 }}
            disabled={!hasSelectedKeywords}
          >
            Create Blog
          </motion.button>
          <motion.button
            onClick={handleCreateJob}
            className={`px-4 py-2 text-sm font-medium rounded-lg w-full sm:w-auto ${
              hasSelectedKeywords
                ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
                : "text-gray-400 bg-gray-200 cursor-not-allowed"
            }`}
            whileHover={{ scale: hasSelectedKeywords ? 1.03 : 1 }}
            whileTap={{ scale: hasSelectedKeywords ? 0.97 : 1 }}
            disabled={!hasSelectedKeywords}
          >
            Create New Job
          </motion.button>
          <motion.button
            onClick={closeFnc}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 w-full sm:w-auto"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Close
          </motion.button>
        </div>,
      ]}
      width="90vw"
      centered
      title="Keyword Research"
      styles={{
        content: { maxWidth: "1000px", margin: "0 auto" },
        body: { padding: "16px" },
      }}
      className="rounded-lg sm:rounded-xl"
    >
      <div className="space-y-4 sm:space-y-6">
        <p className="mb-3 sm:mb-4 text-gray-600 text-sm sm:text-base">
          Find and analyze keywords for your blog
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
          <Input
            placeholder="Enter a keyword"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 text-sm sm:text-base"
            aria-label="Enter keyword"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button type="primary" onClick={addKeyword} className="w-full sm:w-auto">
              Add
            </Button>
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {keywords.map((keyword, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1 }}
              className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full flex items-center text-xs sm:text-sm"
            >
              <span className="capitalize">{keyword}</span>
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                className="ml-1 sm:ml-2 cursor-pointer"
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
            className="text-sm sm:text-base"
          >
            Analyze Keywords
          </Button>
        </motion.div>

        {!analyzing && keywordAnalysisResult?.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <div className="flex items-center mb-3 sm:mb-4">
              <Switch
                checked={showSelectedOnly}
                onChange={(checked) => setShowSelectedOnly(checked)}
                disabled={!hasSelectedKeywords}
                size="small"
              />
              <span className="ml-2 text-gray-600 text-sm sm:text-base">
                Show Selected Keywords Only
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={filteredTableData}
                pagination={{
                  current: currentPage,
                  pageSize: 5,
                  showSizeChanger: false,
                  onChange: handlePageChange,
                  total: filteredTableData.length,
                  responsive: true,
                }}
                rowSelection={{
                  selectedRowKeys: selectedKeywords?.allKeywords || [],
                  onChange: (selected) => {
                    dispatch(
                      setSelectedKeywords({
                        focusKeywords: selected.slice(0, 3),
                        keywords: selected,
                        allKeywords: selected,
                      })
                    )
                  },
                  getCheckboxProps: (record) => ({
                    name: record.keyword,
                  }),
                }}
                rowKey={(record) => record.keyword}
                scroll={{ x: 600 }}
                className="min-w-[600px]"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default KeywordResearchModel
