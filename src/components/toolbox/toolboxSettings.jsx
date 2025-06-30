import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Tabs, Input, Button } from "antd";
import {
  EditOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  FileTextOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import CompetitiveAnalysisModal from "../multipleStepModal/CompetitiveAnalysisModal";
import { useDispatch, useSelector } from "react-redux";
import { analyzeKeywordsThunk } from "@store/slices/analysisSlice";
import { Helmet } from "react-helmet";

export default function ToolboxPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("content");
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [competitiveAnalysisModalOpen, setCompetitiveAnalysisModalOpen] = useState(false);

  const dispatch = useDispatch();
  const { keywordResult: keywordAnalysisResult, loading: analyzing, error: analysisError } =
    useSelector((state) => state.analysis);

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
    if (e.key === "Enter") {
      addKeyword();
    } else if (e.key === ",") {
      e.preventDefault();
      addKeyword(); // Fixed typo: handleAddKeyword(type) -> addKeyword()
    }
  };

  const analyzeKeywords = async () => {
    dispatch(analyzeKeywordsThunk(keywords));
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
      key: "competitor-analysis",
      title: "Competitor Analysis",
      icon: <GlobalOutlined className="text-red-500" />,
      description: "Analyze top performing content in your niche",
      action: () => setCompetitiveAnalysisModalOpen(true),
      actionText: "Start Analysis",
      color: "from-rose-500 to-pink-600",
    },
    // Commented-out items kept for reference, can be re-enabled later
    // {
    //   key: "content-research",
    //   title: "Content Research",
    //   icon: <SearchOutlined className="text-purple-500" />,
    //   description: "Research topics and trending content",
    //   span: "Coming Soon",
    //   actionText: "Research Topics",
    //   color: "from-emerald-500 to-teal-600",
    //   disabled: true,
    // },
    // {
    //   key: "draft-manager",
    //   title: "Draft Manager",
    //   icon: <FileTextOutlined className="text-blue-500" />,
    //   description: "Manage and organize your blog drafts",
    //   span: "Coming Soon",
    //   actionText: "View Drafts",
    //   color: "from-amber-500 to-orange-500",
    //   disabled: true,
    // },
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
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
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
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="primary"
              className="shadow-lg hover:shadow-xl transition-all"
              icon={<EditOutlined />}
              onClick={() => navigate("/dashboard")}
              size="large"
            >
              New Blog Post
            </Button>
          </motion.div>
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
                <motion.div
                  className="flex items-center gap-2 font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  <ThunderboltOutlined className="text-blue-500" />
                  <span>Content Tools</span>
                </motion.div>
              ),
              children: (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {cardItems.filter((item) => item.key === "ai-writer").map((item) => (
                    <AnimatedCard key={item.key} item={item} />
                  ))}
                </div>
              ),
            },
            {
              key: "seo",
              label: (
                <motion.div
                  className="flex items-center gap-2 font-medium"
                  whileHover={{ scale: 1.05 }}
                >
                  <SearchOutlined className="text-purple-500" />
                  <span>SEO Tools</span>
                </motion.div>
              ),
              children: (
                <div className="space-y-6 mt-6">
                  {/* Keyword Research Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{
                      y: -10,
                      transition: { duration: 0.3 },
                    }}
                    className="relative"
                  >
                    <Card
                      title={
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Keyword Research</span>
                          <motion.div
                            animate={{
                              y: [0, -5, 0],
                              transition: {
                                repeat: Infinity,
                                duration: 2,
                                ease: "easeInOut",
                              },
                            }}
                          >
                            <SearchOutlined className="text-green-500" />
                          </motion.div>
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
                      {/* {analysisError && (
                        <div className="text-red-500 mt-2">{analysisError}</div>
                      )} */}
                      {keywordAnalysisResult && Array.isArray(keywordAnalysisResult) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <div className="font-semibold text-blue-700 mb-2">
                            Keyword Suggestions:
                          </div>
                          <ul className="space-y-2">
                            {keywordAnalysisResult.map((kw, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100"
                              >
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                                <span className="text-gray-800 text-sm capitalize">{kw}</span>
                              </li>
                            ))}
                          </ul>
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
                      ></motion.div>
                    </Card>
                  </motion.div>
                  {/* Competitor Analysis Card */}
                  {cardItems
                    .filter((item) => item.key === "competitor-analysis")
                    .map((item) => (
                      <AnimatedCard key={item.key} item={item} />
                    ))}
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
            <motion.div
              animate={{
                y: [0, -5, 0],
                transition: {
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                },
              }}
            >
              {item.icon}
            </motion.div>
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
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{
            background: "linear-gradient(45deg, transparent, transparent)",
            opacity: 0,
          }}
          animate={{
            background: [
              "linear-gradient(45deg, transparent, transparent)",
              `linear-gradient(45deg, ${getColorFromGradient(
                item.color,
                0
              )}, ${getColorFromGradient(item.color, 1)})`,
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
        ></motion.div>
      </Card>
    </motion.div>
  );
}

function getColorFromGradient(gradient, index) {
  const colors = {
    "from-blue-500 to-indigo-600": ["#3b82f6", "#4f46e5"],
    "from-emerald-500 to-teal-600": ["#10b981", "#0d9488"],
    "from-amber-500 to-orange-500": ["#f59e0b", "#f97316"],
    "from-violet-500 to-purple-600": ["#8b5cf6", "#7c3aed"],
    "from-rose-500 to-pink-600": ["#f43f5e", "#db2777"],
    "from-sky-500 to-cyan-500": ["#0ea5e9", "#06b6d4"],
    "from-lime-500 to-green-500": ["#84cc16", "#22c55e"],
    "from-gray-500 to-gray-700": ["#6b7280", "#374151"],
  };
  return colors[gradient]?.[index] || "#3b82f6";
}