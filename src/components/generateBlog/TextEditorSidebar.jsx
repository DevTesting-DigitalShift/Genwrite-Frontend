import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../api";
import ProofreadingChat from "./ProofreadingChat";

const TextEditorSidebar = ({ blog, keywords, setKeywords, onPost }) => {
  const [newKeyword, setNewKeyword] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showProofreading, setShowProofreading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (blog) {
      // fetchCompetitiveAnalysis();
    }
  }, [blog]);

  const fetchCompetitiveAnalysis = async () => {
    if (!blog || !blog.title || !blog.content) {
      toast.error("Blog data is incomplete for analysis.");
      return;
    }

    const validKeywords = keywords && keywords.length > 0 ? keywords : ["default"];

    setIsAnalyzing(true);
    try {
      const response = await axiosInstance.post("/analysis/run", {
        title: blog.title, // Correct field name
        content: blog.content, // Correct field name
        keywords: validKeywords, // Ensure this is an array
        contentType: "text", // Add contentType (e.g., "text" or "markdown")
      });
      setAnalysisResults(response.data);
    } catch (error) {
      console.error("Error fetching competitive analysis:", error);
      toast.error("Failed to fetch competitive analysis.");
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
      toast.error("Failed to post blog.");
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
            placeholder="Add Keywords"
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
      </div>
      <div className="mb-3">
        <h3 className="font-semibold mb-2 text-gray-700">Analysis Results</h3>
        {isAnalyzing ? (
          <p className="text-sm text-gray-500">Analyzing...</p>
        ) : analysisResults ? (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="mt-2 space-y-3">
              {/* Render analysis points */}
              {analysisResults.analysis && (
                <div className="text-sm text-gray-600">
                  <strong>Analysis:</strong>
                  <ul className="list-disc ml-5 mt-1">
                    {Object.entries(analysisResults.analysis).map(([key, value]) => (
                      <li key={key} className="mb-1">
                        <strong>{key.replace(/([A-Z])/g, " $1")}: </strong>
                        {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Render suggestions */}
              {analysisResults.suggestions && (
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  <strong>Suggestions:</strong> {analysisResults.suggestions}
                </div>
              )}
              {/* Render summary */}
              {analysisResults.summary && (
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  <strong>Summary:</strong> {analysisResults.summary}
                </div>
              )}
              {/* Render blog score */}
              {analysisResults.blogScore && (
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  <strong>Blog Score:</strong> {analysisResults.blogScore} / 100
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No analysis available yet.</p>
        )}
      </div>
      <div className="mb-3">
        <h3 className="font-semibold mb-2 text-gray-700">Blog Score</h3>
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center gap-4">
          <span className="text-2xl font-bold text-gray-800">
            {analysisResults?.blogScore || "N/A"}
          </span>
          <span className="text-2xl font-bold text-gray-600">/ 100</span>
        </div>
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
      </div>
      <motion.button
        onClick={handlePostClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isPosting}
        className={`w-full flex items-center justify-center bg-blue-600 text-white py-2 rounded-md shadow-md transition-colors ${
          isPosting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        {isPosting ? "Posting..." : "Post"}
      </motion.button>
    </motion.div>
  );
};

export default TextEditorSidebar;
