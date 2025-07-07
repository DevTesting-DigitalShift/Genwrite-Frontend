import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Gem, Sparkles, TrendingUp, FileText, CheckCircle, AlertCircle, ExternalLink, Zap, Target, BarChart3 } from "lucide-react";
import { getEstimatedCost } from "@utils/getEstimatedCost";
import { useConfirmPopup } from "@/context/ConfirmPopupContext";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Tooltip, message } from "antd";
import { fetchProofreadingSuggestions } from "@store/slices/blogSlice";
import { fetchCompetitiveAnalysisThunk } from "@store/slices/analysisSlice";


const TextEditorSidebar = ({
  blog,
  keywords,
  setKeywords,
  onPost,
  activeTab,
  handleReplace,
  setProofreadingResults,
  proofreadingResults,
  handleSave,
  posted,
  isPosting,
}) => {
  const [newKeyword, setNewKeyword] = useState("");
  const [isAnalyzingProofreading, setIsAnalyzingProofreading] = useState(false);
  const [competitiveAnalysisResults, setCompetitiveAnalysisResults] = useState(null);
  const [shouldRunCompetitive, setShouldRunCompetitive] = useState(false);
  const [seoScore, setSeoScore] = useState();
  const user = useSelector((state) => state.auth.user);
  const userPlan = user?.plan ?? user?.subscription?.plan;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { handlePopup } = useConfirmPopup();
  const { loading: isAnalyzingCompetitive } = useSelector((state) => state.analysis);

  const fetchCompetitiveAnalysis = async () => {
    if (!blog || !blog.title || !blog.content) {
      message.error("Blog data is incomplete for analysis.");
      return;
    }

    const validKeywords =
      keywords && keywords.length > 0 ? keywords : blog?.focusKeywords || blog.keywords;

    try {
      const resultAction = await dispatch(
        fetchCompetitiveAnalysisThunk({
          blogId: blog._id,
          title: blog.title,
          content: blog.content,
          keywords: validKeywords,
        })
      );

      const data = fetchCompetitiveAnalysisThunk.fulfilled.match(resultAction)
        ? resultAction.payload
        : null;

      setSeoScore(data?.blogScore);
      setCompetitiveAnalysisResults(data);
    } catch (err) {
      console.error("Failed to fetch competitive analysis:", err);
    }
  };

  useEffect(() => {
    if (shouldRunCompetitive) {
      fetchCompetitiveAnalysis();
      setShouldRunCompetitive(false);
    }
  }, [shouldRunCompetitive]);

  useEffect(() => {
    if (blog?.seoScore || blog?.generatedMetadata?.competitorsAnalysis) {
      setCompetitiveAnalysisResults({
        blogScore: blog.seoScore,
        ...blog?.generatedMetadata?.competitorsAnalysis,
      });
    }
  }, [blog]);

  const removeKeyword = (keyword) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const addKeywords = () => {
    if (newKeyword.trim()) {
      const keywordsToAdd = newKeyword
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k && !keywords.includes(k));
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

  const handleProofreadingClick = async () => {
    if (!blog || !blog.content) {
      message.error("Blog content is required for proofreading.");
      return;
    }

    if (isAnalyzingCompetitive) {
      message.error(
        "Please wait for Competitive Analysis to complete before starting Proofreading."
      );
      return;
    }

    setIsAnalyzingProofreading(true);

    try {
      const result = await dispatch(
        fetchProofreadingSuggestions({
          content: blog.content,
        })
      ).unwrap();
      setProofreadingResults(result);
    } catch (error) {
      console.error("Error fetching proofreading suggestions:", error);
      message.error("Failed to fetch proofreading suggestions.");
    } finally {
      setIsAnalyzingProofreading(false);
    }
  };

  const handleApplyAllSuggestions = () => {
    if (proofreadingResults.length === 0) {
      message.info("No suggestions available to apply.");
      return;
    }

    proofreadingResults.forEach((suggestion) => {
      handleReplace(suggestion.original, suggestion.change);
    });
    setProofreadingResults([]);
    message.success("All proofreading suggestions applied successfully!");
  };

  const handleAnalyzing = () => {
    if (userPlan === "free" || userPlan === "basic") {
      handlePopup({
        title: "Upgrade Required",
        description: "Competitor Analysis is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/upgrade"),
      });
    } else {
      handlePopup({
        title: "Competitive Analysis",
        description: `Do you really want to run competitive analysis?\nIt will cost 10 credits.`,
        onConfirm: () => setShouldRunCompetitive(true),
      });
    }
  };

  const handleProofreadingBlog = () => {
    if (userPlan === "free" || userPlan === "basic") {
      handlePopup({
        title: "Upgrade Required",
        description: "AI Proofreading is only available for Pro and Enterprise users.",
        confirmText: "Buy Now",
        cancelText: "Cancel",
        onConfirm: () => navigate("/upgrade"),
      });
    } else {
      handlePopup({
        title: "AI Proofreading",
        description: `Do you really want to proofread the blog? \nIt will cost ${getEstimatedCost(
          "blog.proofread"
        )} credits.`,
        onConfirm: handleProofreadingClick,
      });
    }
  };

  const handleKeywordRewrite = () => {
    handlePopup({
      title: "Rewrite Keywords",
      description:
        "Do you want to rewrite the entire content with added keywords? You can rewrite only 3 times.",
      onConfirm: handleSave,
    });
  };

  const ScoreDisplay = ({ score, label, icon: Icon }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-900">{score}</span>
          <span className="text-sm text-gray-500 ml-1">/100</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${
            score >= 80
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : score >= 60
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
              : 'bg-gradient-to-r from-red-500 to-pink-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  const FeatureCard = ({ 
    title, 
    description, 
    isPro, 
    isLoading, 
    onClick, 
    buttonText 
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {isPro && (
          <span className="flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-1 rounded-full">
            Pro
          </span>
        )}
      </div>
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`w-full py-2 text-sm px-4 rounded-lg font-medium transition-all duration-200 ${
          isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
        }`}
      >
        {isLoading ? 'Processing...' : buttonText}
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-80 h-full bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 shadow-xl overflow-y-auto"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Content Analysis</h2>
            <p className="text-sm text-gray-600">Optimize your content for better performance</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Keywords Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Keywords</h3>
            </div>
            {keywords.length > 0 && (
              <Tooltip title="Rewrite Keywords">
                <button
                  onClick={handleKeywordRewrite}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Optimize
                </button>
              </Tooltip>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {keywords.map((keyword, index) => (
                <motion.div
                  key={keyword}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-2 text-white hover:text-red-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add keywords (comma-separated)"
              className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addKeywords}
              className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Scores Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Performance Metrics
          </h3>
          <div className="grid gap-4">
            <ScoreDisplay score={blog?.blogScore || 0} label="Content Score" icon={FileText} />
            <ScoreDisplay 
              score={seoScore || blog?.seoScore || 0} 
              label="SEO Score" 
              icon={Target} 
            />
          </div>
        </div>

        {/* Analysis Tools */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            AI Tools
          </h3>

          <FeatureCard
            title="Competitive Analysis"
            description="Analyze against competitors"
            isPro={['free', 'basic'].includes(userPlan?.toLowerCase?.())}
            isLoading={isAnalyzingCompetitive}
            onClick={handleAnalyzing}
            buttonText={isAnalyzingCompetitive ? "Analyzing..." : "Run Competitive Analysis"}
          />

          {activeTab === "normal" && (
            <FeatureCard
              title="AI Proofreading"
              description="Improve grammar and style"
              isPro={['free', 'basic'].includes(userPlan?.toLowerCase?.())}
              isLoading={isAnalyzingProofreading}
              onClick={handleProofreadingBlog}
              buttonText="Proofread Content"
            />
          )}
        </div>

        {/* Analysis Results */}
        {competitiveAnalysisResults && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Analysis Results</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="space-y-3">
                {Object.entries(competitiveAnalysisResults.analysis).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{key.replace(/([A-Z])/g, " $1")}</p>
                      <p className="text-sm text-gray-600">
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
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Proofreading Results */}
        {activeTab === "normal" && (
          <div className="space-y-4">
            {isAnalyzingProofreading ? (
              <p className="text-sm text-gray-500">Loading Proofreading Results...</p>
            ) : (
              proofreadingResults.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Suggestions</h3>
                    <button
                      onClick={handleApplyAllSuggestions}
                      className="text-blue-600 text-sm hover:text-blue-700 font-medium"
                      disabled={proofreadingResults.length === 0}
                    >
                      Apply All
                    </button>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="space-y-4">
                      {proofreadingResults.map((suggestion, index) => (
                        <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-gray-900">Original:</span>
                            </div>
                            <p className="text-sm text-gray-600 bg-red-50 p-2 rounded">{suggestion.original}</p>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium text-gray-900">Suggested:</span>
                            </div>
                            <p className="text-sm text-gray-600 bg-green-50 p-2 rounded">{suggestion.change}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer - Post Button */}
      <div className="p-6 border-t border-gray-200 bg-white">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="primary"
            htmlType="button"
            onClick={onPost}
            loading={isPosting}
            disabled={isPosting}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              isPosting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {isPosting ? "Posting..." : posted?.success ? "Re-Post" : "Post"}
          </Button>
        </motion.div>
        {posted?.success && posted?.link && (
          <div className="mt-3 text-center">
            <a
              href={posted.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 text-sm hover:text-blue-700 font-medium"
            >
              View Published Post
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TextEditorSidebar;