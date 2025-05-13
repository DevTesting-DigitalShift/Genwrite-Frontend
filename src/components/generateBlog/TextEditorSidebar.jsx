import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Search } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../api";
import ProofreadingChat from "./ProofreadingChat";

const TextEditorSidebar = ({ blog, keywords, setKeywords, onPost, onToggleProofreading }) => {
  const [newKeyword, setNewKeyword] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showProofreading, setShowProofreading] = useState(false);
  const [showCompetitiveAnalysis, setShowCompetitiveAnalysis] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (blog && blog.keywords?.length > 0) {
      setKeywords(blog.keywords);
    }
  }, [blog]);

  const handleCompetitiveAnalysis = async () => {
    if (!searchQuery.trim() && keywords.length === 0) {
      toast.error("Please add at least one keyword or search query");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await axiosInstance.post("/analysis/competitors", {
        keyword: searchQuery || keywords[0],
        blogTitle: blog.title,
        blogMarkdown: blog.content
      });
      setAnalysisResults(response.data);
      setShowCompetitiveAnalysis(true);
    } catch (error) {
      console.error("Error getting competitive analysis:", error);
      toast.error("Failed to get competitive analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeKeyword = (keyword) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const addKeywords = () => {
    if (newKeyword.trim()) {
      const keywordsToAdd = newKeyword
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);
      setKeywords([...keywords, ...keywordsToAdd]);
      setNewKeyword("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeywords();
    }
  };

  const handlePostClick = async () => {
    setIsPosting(true);
    try {
      await onPost();
    } catch (error) {
      console.error("Error posting:", error);
      toast.error("Failed to post blog");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-80 p-4 border-l bg-gray-50 overflow-y-auto relative"
    >
      <h2 className="font-semibold text-lg mb-2 text-gray-800">
        Competitor Analysis
      </h2>
      <div className="mb-6">
        <h3 className="font-semibold mb-1 text-gray-700">Keywords</h3>
        <div className="flex flex-wrap mb-1">
          <AnimatePresence>
            {keywords.map((keyword) => (
              <motion.span
                key={keyword}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center bg-blue-600 text-white px-2 py-1 rounded-md mr-2 mb-1"
              >
                {keyword}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeKeyword(keyword)}
                  className="ml-1"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex mb-4">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add Keywords (comma-separated)"
            className="flex-grow px-2 py-1 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addKeywords}
            className="bg-blue-600 text-white px-2 py-1 rounded-r-md"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search query for analysis"
            className="flex-grow px-2 py-1 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCompetitiveAnalysis}
            disabled={isAnalyzing}
            className={`bg-blue-600 text-white px-2 py-1 rounded-r-md ${
              isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Search className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
      <div className="mb-3">
        <h3 className="font-semibold mb-1 text-gray-700">
          Competitor Analysis
        </h3>
        {analysisResults && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-medium text-gray-800">Analysis Results</h4>
            </div>
            <div className="mt-2 space-y-3">
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {analysisResults.analysis}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mb-3">
        <h3 className="font-semibold mb-2 text-gray-700">More Tools</h3>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow-md p-4 mb-1 relative"
        >
          <span className="text-2xl font-bold text-gray-400 mb-1 block">
            AA
          </span>
          <h4 
            className="text-blue-600 font-medium hover:underline cursor-pointer"
            onClick={() => setShowProofreading(!showProofreading)}
          >
            Proofreading my blog
          </h4>
          {showProofreading && (
            <ProofreadingChat 
              blog={blog} 
              onClose={() => setShowProofreading(false)} 
            />
          )}
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <span className="text-2xl font-bold text-gray-400 mb-1 block">
            AA
          </span>
          <h4 className="text-blue-600 font-medium hover:underline cursor-pointer">
            Headline Analyzer
          </h4>
        </motion.div>
      </div>

      <motion.button
        onClick={handlePostClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isPosting}
        className={`w-full flex items-center justify-center bg-blue-600 text-white py-2 rounded-md shadow-md transition-colors ${
          isPosting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
        }`}
      >
        {isPosting ? "Posting..." : "Post"}
      </motion.button>
    </motion.div>
  );
};

export default TextEditorSidebar;
