import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../api";

const CompetitiveAnalysisModal = ({ closefnc }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    keywords: [],
    keywordInput: "",
    contentType: "text", // or "markdown"
    selectedProject: null,
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const response = await axiosInstance.get("/blogs");
        const allBlogs = response.data;
        const recentBlogs = allBlogs.slice(-10).reverse();
        setRecentProjects(recentBlogs);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching recent projects:", error);
        toast.error("Failed to load recent projects");
        setIsLoading(false);
      }
    };

    fetchRecentProjects();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProjectSelect = (project) => {
    setFormData((prev) => ({
      ...prev,
      title: project.title,
      content: project.content,
      keywords: project.focusKeywords || [],
      selectedProject: project,
      contentType: "markdown",
    }));
  };

  const handleKeywordInputChange = (e) => {
    setFormData((prev) => ({ ...prev, keywordInput: e.target.value }));
  };

  const handleAddKeyword = () => {
    const inputValue = formData.keywordInput;
    if (inputValue.trim() !== "") {
      const newKeywords = inputValue
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword !== "" && !formData.keywords.includes(keyword));

      if (newKeywords.length > 0) {
        setFormData((prev) => ({
          ...prev,
          keywords: [...prev.keywords, ...newKeywords],
          keywordInput: "",
        }));
      }
    }
  };

  const handleRemoveKeyword = (index) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Please enter blog content");
      return;
    }
    if (formData.keywords.length === 0) {
      toast.error("Please add at least one keyword");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await axiosInstance.post("/analysis/run", {
        title: formData.title,
        content: formData.content,
        keywords: formData.keywords,
        contentType: formData.contentType,
      });

      if (response.data) {
        setAnalysisResults(response.data);
        toast.success("Analysis completed successfully!");
      }
    } catch (error) {
      console.error("Error performing competitive analysis:", error);
      toast.error("Failed to perform competitive analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="w-[800px] bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Competitive Analysis</h2>
          <button onClick={closefnc} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto">
          <div className="space-y-6">
            {!analysisResults ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Recent Project
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 max-h-[200px] overflow-y-auto"
                    onChange={(e) => {
                      const project = recentProjects.find((p) => p._id === e.target.value);
                      if (project) handleProjectSelect(project);
                    }}
                    value={formData.selectedProject?._id || ""}
                  >
                    <option value="">Select a project</option>
                    {recentProjects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blog Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your blog title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blog Content
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter your blog content in ${formData.contentType} format`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.keywordInput}
                      onChange={handleKeywordInputChange}
                      onKeyDown={handleKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add keywords (comma-separated)"
                    />
                    <button
                      onClick={handleAddKeyword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(index)}
                          className="ml-1.5 flex-shrink-0 text-indigo-400 hover:text-indigo-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Analysis Results</h3>
                <div className="bg-gray-100 p-4 rounded-md">
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
                  <div className="text-sm text-gray-600 mt-4">
                    <strong>Suggestions:</strong> {analysisResults.suggestions}
                  </div>
                  <div className="text-sm text-gray-600 mt-4">
                    <strong>Summary:</strong> {analysisResults.summary}
                  </div>
                  <div className="text-sm text-gray-600 mt-4">
                    <strong>Blog Score:</strong> {analysisResults.blogScore} / 100
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={closefnc}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          {!analysisResults && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitiveAnalysisModal;