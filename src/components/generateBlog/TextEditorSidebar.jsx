import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "@api/index";
import ProofreadingChat from "./ProofreadingChat";

const TextEditorSidebar = ({ blog, keywords, setKeywords, onPost }) => {
  const [newKeyword, setNewKeyword] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isAnalyzingCompetitive, setIsAnalyzingCompetitive] = useState(false); // For Competitive Analysis
  const [isAnalyzingProofreading, setIsAnalyzingProofreading] = useState(false); // For Proofreading
  const [competitiveAnalysisResults, setCompetitiveAnalysisResults] = useState(null); // For Competitive Analysis Results
  const [proofreadingResults, setProofreadingResults] = useState([]); // For Proofreading Results

  useEffect(() => {
    if (blog) {
      fetchCompetitiveAnalysis(); // Start Competitive Analysis when blog changes
    }
  }, [blog]);

  const fetchCompetitiveAnalysis = async () => {
    // Check if analysis results already exist
    if (competitiveAnalysisResults) {
      console.log("Competitive Analysis already completed. Using cached results.");
      return;
    }

    if (!blog || !blog.title || !blog.content) {
      toast.error("Blog data is incomplete for analysis.");
      return;
    }

    const validKeywords = keywords && keywords.length > 0 ? keywords : ["default"];

    setIsAnalyzingCompetitive(true);
    try {
      const response = await axiosInstance.post("/analysis/run", {
        title: blog.title,
        content: blog.content,
        keywords: validKeywords,
        contentType: "text",
      });
      setCompetitiveAnalysisResults(response.data); // Save Competitive Analysis Results
      toast.success("Competitive analysis completed successfully!");
    } catch (error) {
      console.error("Error fetching competitive analysis:", error);
      toast.error("Failed to fetch competitive analysis.");
    } finally {
      setIsAnalyzingCompetitive(false);
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
    if (!blog || !blog._id) {
      toast.error("Blog data is missing or invalid.");
      return;
    }

    setIsPosting(true);
    try {
      const response = await axiosInstance.post("/wordpress/post", {
        wpLink: "http://localhost/wordpress", // Replace with your WordPress site URL
        blogId: blog._id,
      });

      if (response.status === 200 && response.data.success) {
        toast.success("Blog posted to WordPress successfully!");
      } else {
        toast.error(response.data.message || "Failed to post blog to WordPress.");
      }
    } catch (error) {
      console.error("Error posting blog to WordPress:", error);
      toast.error(error.response?.data?.message || "Failed to post blog to WordPress.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleProofreadingClick = async () => {
    if (!blog || !blog.content) {
      toast.error("Blog content is required for proofreading.");
      return;
    }

    if (isAnalyzingCompetitive) {
      toast.error("Please wait for Competitive Analysis to complete before starting Proofreading.");
      return;
    }

    setIsAnalyzingProofreading(true); // Show loading indicator
    setProofreadingResults(null); // Clear previous response

    try {
      const result = await axiosInstance.post("/blogs/proofread", {
        content: blog.content,
        message: "Proofread this blog.",
      });
      console.log("AI Response:", result.data);


      if (result.data && Array.isArray(result.data.suggestions)) {
        setProofreadingResults(result.data.suggestions);
      } else {
        toast.error("Invalid proofreading suggestions format.");
      }

      
     
      toast.success("Proofreading suggestions received!");
    } catch (error) {
      console.error("Error getting proofreading suggestions:", error);
      toast.error("Failed to fetch proofreading suggestions.");
    } finally {
      setIsAnalyzingProofreading(false); // Hide loading indicator
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
        {isAnalyzingCompetitive ? (
          <p className="text-sm text-gray-500">Analyzing Competitive Analysis...</p>
        ) : competitiveAnalysisResults ? (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="mt-2 space-y-3">
              {/* Render Competitive Analysis Results */}
              {competitiveAnalysisResults.analysis && (
                <div className="text-sm text-gray-600">
                  <strong>Analysis:</strong>
                  <ul className="list-disc ml-5 mt-1">
                    {Object.entries(competitiveAnalysisResults.analysis).map(([key, value]) => (
                      <li key={key} className="mb-1">
                        <strong>{key.replace(/([A-Z])/g, " $1")}: </strong>
                        {typeof value === "object" ? (
                          <ul className="list-disc ml-5">
                            {Object.entries(value).map(([subKey, subValue]) => (
                              <li key={subKey}>
                                <strong>{subKey.replace(/([A-Z])/g, " $1")}: </strong>
                                {subValue}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          value
                        )}
                      </li>
                    ))}
                  </ul>
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
            {competitiveAnalysisResults?.blogScore || "N/A"}
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
            onClick={handleProofreadingClick} // API is triggered here
          >
            Proofreading my blog
          </h4>
        </motion.div>
        {proofreadingResults !== null || isAnalyzingProofreading ? (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-800 mb-2">Proofreading Results:</h4>
            {isAnalyzingProofreading ? (
              <p className="text-sm text-gray-500">Loading Proofreading Results...</p>
            ) : proofreadingResults && proofreadingResults.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md p-4">
                <ul className="list-disc ml-5">
                  {proofreadingResults.map((suggestion, index) => (
                    <li key={index} className="mb-2">
                      <p className="text-sm text-gray-700">
                        <strong>Original:</strong> {suggestion.original}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Revised:</strong> {suggestion.change}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No suggestions available.</p>
            )}
          </div>
        ) : null}
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
