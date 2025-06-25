import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import axiosInstance from "@api"
import { Button, Card, Input } from "antd"
import { CloseOutlined, SearchOutlined } from "@ant-design/icons"

const KeywordResearchModel = ({ closeFnc }) => {
  const [newKeyword, setNewKeyword] = useState("")
  const [keywords, setKeywords] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [keywordAnalysisResult, setKeywordAnalysisResult] = useState(null)

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()])
      setNewKeyword("")
    }
  }

  const removeKeyword = (index) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addKeyword()
    } else if (e.key === ",") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  const analyzeKeywords = async () => {
    setAnalyzing(true)
    setAnalysisError(null)
    setKeywordAnalysisResult(null)
    try {
      // Use the first keyword as title, or join all keywords if you want
      const response = await axiosInstance.get("/analysis/keywords", {
        params: { title: keywords.join(",") },
      })
      setKeywordAnalysisResult(response.data)
    } catch (err) {
      setAnalysisError(err?.response?.data?.message || "Failed to analyze keywords.")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden border"
      >
        {/* Keyword Research Card */}
        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{
            y: -10,
            transition: { duration: 0.3 },
          }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl blur-md opacity-20"></div>

          <Card
            title={
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Keyword Research</span>
                <button
                  onClick={closeFnc}
                  className="p-2 rounded-full hover:bg-gray-100 transition-all"
                >
                  <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                </button>
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

            {/* Keywords Tags */}
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

            {analysisError && <div className="text-red-500 mt-2">{analysisError}</div>}
            {keywordAnalysisResult && Array.isArray(keywordAnalysisResult) && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="font-semibold text-blue-700 mb-2">Keyword Suggestions:</div>
                <ul className="space-y-2">
                  {keywordAnalysisResult.map((kw, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100 capitalize"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                      <span className="text-gray-800 text-sm">{kw}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-5 border-t border-gray-100">
              <motion.button
                onClick={closeFnc}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Close
              </motion.button>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}

export default KeywordResearchModel
