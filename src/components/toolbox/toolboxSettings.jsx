import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Tabs, Input, Button, Table, Tag } from "antd";
import {
  SearchOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import CompetitiveAnalysisModal from "../multipleStepModal/CompetitiveAnalysisModal";
import { useDispatch, useSelector } from "react-redux";
import { analyzeKeywordsThunk } from "@store/slices/analysisSlice";
import { Helmet } from "react-helmet";
import { ImMagicWand } from "react-icons/im";
import { Keyboard, WholeWord } from "lucide-react";

export default function ToolboxPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("keyword");
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [competitiveAnalysisModalOpen, setCompetitiveAnalysisModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10); // State for page size
  const [currentPage, setCurrentPage] = useState(1); // State for current page

  const dispatch = useDispatch();
  const { keywordAnalysis: keywordAnalysisResult, loading: analyzing, error } = useSelector(
    (state) => state.analysis
  );

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    }
  };

  const analyzeKeywords = async () => {
    dispatch(analyzeKeywordsThunk(keywords));
    setCurrentPage(1); // Reset to first page on new analysis
  };

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
      title: "Competition",
      dataIndex: "competition",
      key: "competition",
      sorter: (a, b) => a.competition_index - b.competition_index,
      render: (text) => (
        <Tag
          color={
            text === "LOW" ? "green" : text === "MEDIUM" ? "orange" : text === "HIGH" ? "red" : "gray"
          }
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
      render: (value) => (value ? value.toFixed(2) : "N/A"),
    },
    {
      title: "Low Bid ($)",
      dataIndex: "lowBid",
      key: "lowBid",
      sorter: (a, b) => a.lowBid - b.lowBid,
      render: (value) => (value ? value.toFixed(2) : "N/A"),
    },
    {
      title: "High Bid ($)",
      dataIndex: "highBid",
      key: "highBid",
      sorter: (a, b) => a.highBid - b.highBid,
      render: (value) => (value ? value.toFixed(2) : "N/A"),
    },
  ];

  // Prepare table data from keywordAnalysisResult
  const tableData = keywordAnalysisResult?.map((kw, idx) => ({
    key: idx,
    keyword: kw.keyword,
    avgMonthlySearches: kw.avgMonthlySearches,
    competition: kw.competition,
    competition_index: kw.competition_index,
    avgCpc: kw.avgCpc,
    lowBid: kw.lowBid,
    highBid: kw.highBid,
  })) || [];

  // Handle pagination size change
  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const cardItems = [
    {
      key: "ai-writer",
      title: "AI Writer",
      icon: <ThunderboltOutlined className="text-yellow-500" />,
      description: "Generate blog content with AI assistance",
      action: () => navigate("/editor"),
      actionText: "Open Editor",
      color: "from-blue-500 to-indigo-600",
    },
    {
      key: "humanize-content",
      title: "Content Processor",
      icon: <ImMagicWand className="text-blue-500" />,
      description:
        "Transform AI-generated text into natural, human-sounding content while preserving intent and clarity.",
      action: () => navigate("/humanize-content"),
      actionText: "Let's Convert",
      color: "from-blue-500 to-indigo-600",
    },
    {
      key: "competitor-analysis",
      title: "Competitor Analysis",
      icon: <GlobalOutlined className="text-purple-500" />,
      description: "Analyze top performing content in your niche",
      action: () => setCompetitiveAnalysisModalOpen(true),
      actionText: "Start Analysis",
      color: "from-rose-500 to-pink-600",
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-10 sm:p-6"
      >
        <Helmet>
          <title>Toolbox | GenWrite</title>
        </Helmet>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex flex-col md:flex-row появ justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Toolbox
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 max-w-xl mt-2"
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
            padding: "0 16px",
            borderRadius: "12px",
            marginBottom: "24px",
          }}
          items={[
            {
              key: "content",
              label: (
                <motion.div className="flex items-center gap-2 font-medium" whileHover={{ scale: 1.05 }}>
                  <ThunderboltOutlined className="text-blue-500" />
                  <span>Content Tools</span>
                </motion.div>
              ),
              children: (
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
                  {cardItems
                    .filter((item) => ["ai-writer", "humanize-content"].includes(item.key))
                    .map((item) => (
                      <AnimatedCard key={item.key} item={item} />
                    ))}
                </div>
              ),
            },
            {
              key: "seo",
              label: (
                <motion.div className="flex items-center gap-2 font-medium" whileHover={{ scale: 1.05 }}>
                  <SearchOutlined className="text-purple-500" />
                  <span>SEO Tools</span>
                </motion.div>
              ),
              children: (
                <div className="space-y-6 mt-6">
                  {cardItems
                    .filter((item) => item.key === "competitor-analysis")
                    .map((item) => (
                      <AnimatedCard key={item.key} item={item} />
                    ))}
                </div>
              ),
            },
            {
              key: "keyword",
              label: (
                <motion.div className="flex items-center gap-2 font-medium" whileHover={{ scale: 1.05 }}>
                  <Keyboard className="text-green-500" size={16} />
                  <span>Keyword Tools</span>
                </motion.div>
              ),
              children: (
                <div className="space-y-6 mt-6">
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
                          <span className="font-medium text-gray-700">Keyword Research</span>
                          <WholeWord className="text-green-500" />
                        </div>
                      }
                      className="rounded-xl shadow-lg border-0 relative overflow-hidden transition-all duration-300 hover:shadow-xl"
                    >
                      <p className="mb-4 text-gray-600">Find and analyze keywords for your blog</p>
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Enter a keyword (e.g., tech)"
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
                      {error && (
                        <div className="text-red-500 mt-2">{error}</div>
                      )}
                      {keywordAnalysisResult &&
                        Array.isArray(keywordAnalysisResult) &&
                        keywordAnalysisResult.length > 0 && (
                          <div className="mt-6">
                            <Table
                              columns={columns}
                              dataSource={tableData}
                              pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                pageSizeOptions: ["20", "50", "100"],
                                showSizeChanger: true,
                                onChange: handlePageChange,
                                onShowSizeChange: handlePageSizeChange,
                                total: tableData.length,
                              }}
                              rowKey="key"
                              className="keyword-analysis-table"
                              scroll={{ x: true }}
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
          <CompetitiveAnalysisModal closeFnc={() => setCompetitiveAnalysisModalOpen(false)} />
        )}
      </motion.div>
    </>
  );
}

function AnimatedCard({ item }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -10,
        transition: { duration: 0.3 },
      }}
    >
      <Card
        title={
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">{item.title}</span>
            <div>{item.icon}</div>
          </div>
        }
        className={`rounded-xl shadow-lg border-0 relative overflow-hidden transition-all duration-300 ${
          item.disabled ? "opacity-70" : "hover:shadow-xl"
        }`}
      >
        <p className="mb-4 text-gray-600 min-h-[60px]">{item.description}</p>
        {item.span ? (
          <span className="text-gray-500 font-medium">{item.span}</span>
        ) : (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              block
              type={item.disabled ? "default" : "primary"}
              onClick={item.action}
              disabled={item.disabled}
              className="transition-all"
            >
              {item.actionText}
            </Button>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}