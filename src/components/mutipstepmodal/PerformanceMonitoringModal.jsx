import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../api";

const PerformanceMonitoringModal = ({ closefnc }) => {
  const [formData, setFormData] = useState({
    selectedBlog: null,
    title: "",
    content: "",
  });
  const [allBlogs, setAllBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axiosInstance.get("/blogs");
        setAllBlogs(response.data);
        setIsLoading(false);
      } catch (error) {
        toast.error("Failed to load blogs");
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const handleBlogSelect = (blog) => {
    setFormData({
      selectedBlog: blog,
      title: blog.title,
      content: blog.content,
    });
    setStats(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnalyse = async () => {
    if (!formData.selectedBlog) {
      toast.error("Please select a blog");
      return;
    }
    setIsAnalysing(true);
    try {
      // Use the main blog details endpoint
      const response = await axiosInstance.get(`/blogs/performaceMontioring/${formData.selectedBlog._id}`);
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load blog details");
    } finally {
      setIsAnalysing(false);
    }
  };

  // Helper function to extract colors from gradient string
  const getColorFromGradient = (gradient, index) => {
    const colors = {
      "from-blue-500 to-indigo-600": ["#3b82f6", "#4f46e5"],
      "from-emerald-500 to-teal-600": ["#10b981", "#0d9488"],
      "from-amber-500 to-orange-500": ["#f59e0b", "#f97316"],
      "from-violet-500 to-purple-600": ["#8b5cf6", "#7c3aed"],
      "from-rose-500 to-pink-600": ["#f43f5e", "#db2777"],
      "from-sky-500 to-cyan-500": ["#0ea5e9", "#06b6d4"],
      "from-lime-500 to-green-500": ["#84cc16", "#22c55e"],
      "from-gray-500 to-gray-700": ["#6b7280", "#374151"]
    };
    
    return colors[gradient]?.[index] || "#3b82f6";
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-[800px] bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-white rounded-xl blur-md opacity-20"></div>
        
        {/* Animated border */}
        <motion.div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ 
            background: "linear-gradient(45deg, transparent, transparent)",
            opacity: 0
          }}
          animate={{ 
            background: [
              "linear-gradient(45deg, transparent, transparent)",
              "linear-gradient(45deg, #3b82f6, #4f46e5)",
              "linear-gradient(45deg, transparent, transparent)"
            ],
            opacity: [0, 0.5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity
          }}
          style={{ 
            zIndex: -1,
            margin: "-1px",
            border: "1px solid transparent",
          }}
        ></motion.div>

        <div className="flex items-center justify-between p-6 border-b relative z-10">
          <motion.h2 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
          >
            Performance Monitoring
          </motion.h2>
          <motion.button 
            onClick={closefnc} 
            className="text-gray-400 hover:text-gray-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-6 w-6" />
          </motion.button>
        </div>

        <div className="px-6 py-4 overflow-y-auto relative z-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Blog
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 max-h-[200px] overflow-y-auto"
                onChange={e => {
                  const blog = allBlogs.find(b => b._id === e.target.value);
                  if (blog) handleBlogSelect(blog);
                }}
                value={formData.selectedBlog?._id || ""}
              >
                <option value="">Select a blog</option>
                {allBlogs.map(blog => (
                  <option key={blog._id} value={blog._id}>{blog.title}</option>
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
                placeholder="Blog title"
                disabled
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blog Body
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Blog content"
                disabled
              />
            </div> */}

            <div className="flex justify-end">
              <motion.button
                onClick={handleAnalyse}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md"
                disabled={isAnalysing || !formData.selectedBlog}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isAnalysing ? "Analysing..." : "Analyse"}
              </motion.button>
            </div>

            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl blur-md opacity-20"></div>
                
                <div className="bg-gray-100 p-4 rounded-md relative overflow-hidden">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Stats</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="font-semibold text-gray-700">SEO Score:</span>
                        <span className="ml-2 text-blue-700 font-bold">{stats.seoScore ?? "-"}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="font-semibold text-gray-700">Word Count:</span>
                        <span className="ml-2">{stats.wordCount ?? "-"}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="font-semibold text-gray-700">Paragraphs:</span>
                        <span className="ml-2">{stats.paragraphCount ?? "-"}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="font-semibold text-gray-700">Reading Time:</span>
                        <span className="ml-2">{stats.readingTime ?? "-"} min</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        {/* <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div> */}
                        {/* <span className="font-semibold text-gray-700">Flesch Score:</span> */}
                        {/* <span className="ml-2">{stats.fleschScore ?? "-"}</span> */}
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="font-semibold text-gray-700">Views:</span>
                        <span className="ml-2">{stats.views ?? 0}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="font-semibold text-gray-700">WordPress Link:</span>
                        {stats.wordpressLink ? (
                          <a 
                            href={stats.wordpressLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 underline ml-2"
                          >
                            View on WordPress
                          </a>
                        ) : (
                          <span className="ml-2">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Animated border for stats */}
                  <motion.div 
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ 
                      background: "linear-gradient(45deg, transparent, transparent)",
                      opacity: 0
                    }}
                    animate={{ 
                      background: [
                        "linear-gradient(45deg, transparent, transparent)",
                        "linear-gradient(45deg, #10b981, #0d9488)",
                        "linear-gradient(45deg, transparent, transparent)"
                      ],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity
                    }}
                    style={{ 
                      zIndex: -1,
                      margin: "-1px",
                      border: "1px solid transparent",
                    }}
                  ></motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t relative z-10">
          <motion.button
            onClick={closefnc}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default PerformanceMonitoringModal;