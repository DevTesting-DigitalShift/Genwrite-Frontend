import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, Tabs, Input, Button, Table, Tag, message } from "antd"
import {
  SearchOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  CloseOutlined,
  DownloadOutlined,
  ThunderboltTwoTone,
  CrownTwoTone,
} from "@ant-design/icons"
import { motion } from "framer-motion"
import CompetitiveAnalysisModal from "../multipleStepModal/CompetitiveAnalysisModal"
import { useDispatch, useSelector } from "react-redux"
import { analyzeKeywordsThunk, clearKeywordAnalysis } from "@store/slices/analysisSlice"
import { Helmet } from "react-helmet"
import { ImMagicWand } from "react-icons/im"
import { Keyboard, WholeWord, Workflow } from "lucide-react"
import { selectUser } from "@store/slices/authSlice"
import { Crown } from "lucide-react"
import { Flex } from "antd"
import { Rocket } from "lucide-react"
import { Layers } from "lucide-react"

export default function ToolboxPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("content")
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState("")
  const [competitiveAnalysisModalOpen, setCompetitiveAnalysisModalOpen] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const { allBlogs } = useSelector((state) => state.blog)
  const dispatch = useDispatch()
  const { keywordAnalysis: keywordAnalysisResult, loading: analyzing } = useSelector(
    (state) => state.analysis
  )

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
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
  }

  const analyzeKeywords = async () => {
    dispatch(analyzeKeywordsThunk(keywords))
    setCurrentPage(1)
    setSelectedRowKeys([])
  }

  const deselectKeyword = (index) => {
    setSelectedRowKeys(selectedRowKeys.filter((key) => key !== index))
  }

  const clearSelectedKeywords = () => {
    setSelectedRowKeys([])
  }

  const downloadAsCSV = () => {
    if (
      !keywordAnalysisResult ||
      !Array.isArray(keywordAnalysisResult) ||
      keywordAnalysisResult.length === 0
    ) {
      message.error("No keyword analysis results available to download.")
      return
    }

    if (selectedRowKeys.length === 0) {
      message.error("Please select at least one keyword to download.")
      return
    }

    const selectedKeywords = keywordAnalysisResult.filter((_, idx) => selectedRowKeys.includes(idx))

    if (selectedKeywords.length === 0) {
      message.error("No valid keywords selected for export.")
      return
    }

    const headers = ["keyword"]
    const csvContent = [
      headers.join(","),
      ...selectedKeywords.map((kw) => [`${kw.keyword.replace(/"/g, '""')}`].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "selected_keywords.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      title: "Keyword",
      dataIndex: "keyword",
      key: "keyword",
      sorter: (a, b) => a.keyword.localeCompare(b.keyword),
      render: (text) => <span className="font-medium capitalize text-xs sm:text-sm">{text}</span>,
    },
    {
      title: "Monthly Searches",
      dataIndex: "avgMonthlySearches",
      key: "avgMonthlySearches",
      sorter: (a, b) => a.avgMonthlySearches - b.avgMonthlySearches,
      render: (value) => (
        <span className="text-xs sm:text-sm">{new Intl.NumberFormat().format(value)}</span>
      ),
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
      title: "Avg CPC ($)",
      dataIndex: "avgCpc",
      key: "avgCpc",
      sorter: (a, b) => a.avgCpc - b.avgCpc,
      render: (value) => (
        <span className="text-xs sm:text-sm">{value ? value.toFixed(2) : "N/A"}</span>
      ),
    },
    {
      title: "Low Bid ($)",
      dataIndex: "lowBid",
      key: "lowBid",
      responsive: ["md"], // Hide on small screens
      sorter: (a, b) => a.lowBid - b.lowBid,
      render: (value) => (
        <span className="text-xs sm:text-sm">{value ? value.toFixed(2) : "N/A"}</span>
      ),
    },
    {
      title: "High Bid ($)",
      dataIndex: "highBid",
      key: "highBid",
      responsive: ["md"], // Hide on small screens
      sorter: (a, b) => a.highBid - b.highBid,
      render: (value) => (
        <span className="text-xs sm:text-sm">{value ? value.toFixed(2) : "N/A"}</span>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
    getCheckboxProps: (record) => ({
      name: record.keyword,
    }),
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

  const selectedKeywordsDisplay = keywordAnalysisResult
    ? selectedRowKeys.map((idx) => keywordAnalysisResult[idx]?.keyword).filter(Boolean)
    : []

  const handlePageSizeChange = (current, size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const cardItems = [
    {
      key: "ai-writer",
      title: "AI Writer",
      icon: <ThunderboltTwoTone className="text-xl sm:text-2xl size-4 sm:size-5 text-yellow-500" />,
      description: "Generate blog content with AI assistance",
      action: () => navigate("/editor"),
      actionText: "Open Editor",
      color: "from-blue-500 to-indigo-600",
    },
    {
      key: "humanize-content",
      title: "Humanize Content",
      icon: <ImMagicWand className="size-4 sm:size-5 text-blue-500" />,
      description:
        "Transform AI-generated text into natural, human-sounding content while preserving intent and clarity.",
      action: () => navigate("/humanize-content"),
      actionText: "Let's Convert",
      color: "from-blue-500 to-indigo-600",
    },
    {
      key: "outline",
      title: "AI Outline",
      icon: <Workflow className="size-4 sm:size-5 text-green-500" />,
      description:
        "Craft high-impact blog outlines with SEO keywords, structure, and brand voice in seconds using AI.",
      action: () => navigate("/outline"),
      actionText: "Let's Outline",
      color: "from-green-500 to-emerald-600",
    },
    {
      key: "competitor-analysis",
      title: "Competitor Analysis",
      icon: <GlobalOutlined className="text-purple-500 size-4 sm:size-5" />,
      description: "Analyze top performing content in your niche",
      action: () => setCompetitiveAnalysisModalOpen(true),
      actionText: "Start Analysis",
      color: "from-rose-500 to-pink-600",
    },
    {
      key: "generated-metadata",
      title: "Generate Metadata",
      icon: <Layers className="text-purple-500 size-4 sm:size-5" />,
      description: "Turn content into SEO-friendly metadata",
      action: () => navigate("/generate-metadata"),
      actionText: "Boost SEO",
      color: "from-rose-500 to-pink-600",
    },
    {
      key: "prompt-content",
      title: "Boost Your Content",
      icon: <Rocket className="text-purple-500 size-4 sm:size-5" />,
      description: "Transform your content into SEO-optimized metadata in seconds",
      action: () => navigate("/prompt-content"),
      actionText: "Boost SEO",
      color: "from-rose-500 to-pink-600",
    },
  ]

  useEffect(() => {
    return () => {
      dispatch(clearKeywordAnalysis())
    }
  }, [dispatch])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-8 max-w-full"
      >
        <Helmet>
          <title>Toolbox | GenWrite</title>
        </Helmet>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sm:mb-8"
        >
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Toolbox
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 max-w-xl mt-2 text-sm"
            >
              All your content creation tools in one place. Streamline your workflow with our
              powerful suite of tools.
            </motion.p>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-tabs"
          tabBarStyle={{
            background: "#f9fafb",
            padding: "0 8px sm:0 16px",
            borderRadius: "12px",
            marginBottom: "16px sm:24px",
          }}
          items={[
            {
              key: "content",
              label: (
                <motion.div
                  className="flex items-center gap-2 font-medium text-xs sm:text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <ThunderboltOutlined className="text-blue-500 size-4 sm:size-5" />
                  <span>Content Tools</span>
                </motion.div>
              ),
              children: (
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mt-4 px-2 sm:px-4">
                  {cardItems
                    .filter((item) =>
                      ["ai-writer", "humanize-content", "outline", "prompt-content"].includes(
                        item.key
                      )
                    )
                    .map((item) => (
                      <AnimatedCard key={item.key} item={item} />
                    ))}
                </div>
              ),
            },
            {
              key: "seo",
              label: (
                <motion.div
                  className="flex items-center gap-2 font-medium text-xs sm:text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <SearchOutlined className="text-purple-500 size-4 sm:size-5" />
                  <span>SEO Tools</span>
                </motion.div>
              ),
              children: (
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mt-4 px-2 sm:px-4">
                  {cardItems
                    .filter(
                      (item) =>
                        item.key === "competitor-analysis" || item.key === "generated-metadata"
                    )
                    .map((item) => (
                      <AnimatedCard key={item.key} item={item} />
                    ))}
                </div>
              ),
            },
            {
              key: "keyword",
              label: (
                <motion.div
                  className="flex items-center gap-2 font-medium text-xs sm:text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <Keyboard className="text-green-500 size-4 sm:size-5" />
                  <span>Keyword Tools</span>
                </motion.div>
              ),
              children: (
                <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6 px-2 sm:px-4">
                  {/* Keyword Research Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                    className="relative"
                  >
                    <Card
                      title={
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700 text-sm sm:text-base">
                            Keyword Research
                          </span>
                          <WholeWord className="text-green-500 size-4 sm:size-5" />
                        </div>
                      }
                      className="rounded-xl shadow-lg border-0 relative overflow-hidden transition-all duration-300 hover:shadow-xl"
                    >
                      <p className="mb-4 text-gray-600 text-xs sm:text-sm">
                        Find and analyze keywords for your blog
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <Input
                          placeholder="Enter a keyword (e.g., tech)"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 text-xs sm:text-sm"
                        />
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            type="primary"
                            onClick={addKeyword}
                            className="text-xs sm:text-sm"
                          >
                            Add
                          </Button>
                        </motion.div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                        {keywords.map((keyword, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full flex items-center text-xs sm:text-sm"
                          >
                            <span>{keyword}</span>
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
                      <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            block
                            type="primary"
                            onClick={analyzeKeywords}
                            loading={analyzing}
                            disabled={keywords.length === 0}
                            className="text-xs sm:text-sm"
                          >
                            Analyze Keywords
                          </Button>
                        </motion.div>
                        {keywordAnalysisResult &&
                          Array.isArray(keywordAnalysisResult) &&
                          keywordAnalysisResult.length > 0 && (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                type="default"
                                icon={<DownloadOutlined />}
                                onClick={downloadAsCSV}
                                disabled={selectedRowKeys.length === 0}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                                aria-label="Download selected keywords as CSV"
                              >
                                Download as CSV
                              </Button>
                            </motion.div>
                          )}
                      </div>
                      {keywordAnalysisResult &&
                        Array.isArray(keywordAnalysisResult) &&
                        keywordAnalysisResult.length > 0 && (
                          <div className="mt-4 sm:mt-6">
                            {selectedKeywordsDisplay.length > 0 && (
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-gray-700 font-medium text-xs sm:text-sm">
                                    Selected Keywords ({selectedKeywordsDisplay.length}):
                                  </p>
                                  <Button
                                    type="link"
                                    onClick={clearSelectedKeywords}
                                    className="text-red-600 text-xs sm:text-sm"
                                    disabled={selectedKeywordsDisplay.length === 0}
                                  >
                                    Clear All
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {selectedKeywordsDisplay.map((keyword, index) => (
                                    <motion.div
                                      key={selectedRowKeys[index]}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full flex items-center text-xs sm:text-sm"
                                    >
                                      <span>{keyword}</span>
                                      <motion.div
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.8 }}
                                        className="ml-1 sm:ml-2 cursor-pointer"
                                        onClick={() => deselectKeyword(selectedRowKeys[index])}
                                      >
                                        <CloseOutlined className="text-green-800 text-xs" />
                                      </motion.div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Table
                              rowSelection={rowSelection}
                              columns={columns}
                              dataSource={tableData}
                              pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                pageSizeOptions: ["10", "20", "50"],
                                showSizeChanger: true,
                                onChange: handlePageChange,
                                onShowSizeChange: handlePageSizeChange,
                                total: tableData.length,
                                responsive: true,
                              }}
                              rowKey="key"
                              className="keyword-analysis-table rounded-lg overflow-hidden"
                              scroll={{ x: "max-content" }}
                            />
                          </div>
                        )}
                      <motion.div
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        initial={{
                          background: "linear-gradient(45deg, transparent, transparent)",
                          opacity: 0,
                        }}
                        animate={{
                          background: [
                            "linear-gradient(45deg, transparent, transparent)",
                            "linear-gradient(45deg, #8b5cf6, #7c3aed)",
                            "linear-gradient(45deg, transparent, transparent)",
                          ],
                          opacity: [0, 0.5, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                        }}
                        style={{
                          zIndex: -1,
                          margin: "-1px",
                          border: "1px solid transparent",
                        }}
                      />
                    </Card>
                  </motion.div>
                </div>
              ),
            },
          ]}
        />
        {competitiveAnalysisModalOpen && (
          <CompetitiveAnalysisModal
            blogs={allBlogs}
            open={competitiveAnalysisModalOpen}
            closeFnc={() => setCompetitiveAnalysisModalOpen(false)}
          />
        )}
        <style>
          {`
            .ant-table-container {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            .ant-table-thead {
              position: sticky;
              top: 0;
              z-index: 10;
              background: #fafafa;
            }
            .ant-table-thead > tr > th {
              background: #fafafa !important;
              white-space: nowrap;
            }
            .ant-table-cell {
              white-space: nowrap;
            }
            @media (max-width: 640px) {
              .ant-table-tbody > tr > td {
                padding: 8px !important;
                font-size: 12px !important;
              }
              .ant-table-thead > tr > th {
                padding: 8px !important;
                font-size: 12px !important;
              }
              .ant-tag {
                font-size: 12px !important;
                padding: 2px 6px !important;
              }
              .ant-input {
                font-size: 12px !important;
                padding: 4px 8px !important;
              }
              .ant-btn {
                font-size: 12px !important;
                padding: 4px 8px !important;
              }
            }
            @media (max-width: 768px) {
              .ant-table-tbody > tr > td {
                padding: 10px !important;
              }
              .ant-table-thead > tr > th {
                padding: 10px !important;
              }
            }
          `}
        </style>
      </motion.div>
    </>
  )
}

function AnimatedCard({ item }) {
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const [isUserPlanFree, setIsUserPlanFree] = useState(false)
  useEffect(() => {
    if (user) {
      setIsUserPlanFree(["free"].includes(user?.subscription?.plan))
    }
  }, [user])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.03,
        transition: { type: "spring", stiffness: 300, damping: 10, duration: 0.5 },
      }}
      className="min-w-0"
    >
      <Card
        title={
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700 text-sm sm:text-base">{item.title}</span>
            <Flex justify="around" align="center" gap={8}>
              {isUserPlanFree && <CrownTwoTone className="size-5 sm:size-6 text-3xl sm:text-4xl" />}
              {item.icon}
            </Flex>
          </div>
        }
        className={`rounded-xl shadow-lg border-0 relative overflow-hidden transition-all duration-300 ${
          item.disabled ? "opacity-70" : "hover:shadow-xl"
        }`}
      >
        <p className="mb-4 text-gray-600 min-h-[60px] text-xs sm:text-sm">{item.description}</p>
        {item.span ? (
          <span className="text-gray-500 font-medium text-xs sm:text-sm">{item.span}</span>
        ) : (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex justify-center"
          >
            <Button
              block
              type={item.disabled ? "default" : "primary"}
              onClick={isUserPlanFree ? () => navigate("/pricing") : item.action}
              disabled={item.disabled}
              className="transition-all w-full sm:w-5/6 text-xs sm:text-sm"
            >
              {item.actionText}
            </Button>
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}
