import { useState, useEffect } from "react"
import { fetchBrands } from "@store/slices/brandSlice"
import { useDispatch, useSelector } from "react-redux"
import { message } from "antd"
import { openUpgradePopup } from "@utils/UpgardePopUp"
import { Crown } from "lucide-react"
import { useNavigate } from "react-router-dom"

const SecondStepModal = ({ handleNext, handlePrevious, handleClose, data, setData }) => {
  const dispatch = useDispatch()
  const { selectedKeywords } = useSelector((state) => state.analysis)
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const userPlan = user?.subscription?.plan || user?.plan

  const [formData, setFormData] = useState({
    focusKeywords: selectedKeywords?.focusKeywords || data.focusKeywords || [],
    keywords: selectedKeywords?.allKeywords || data.keywords || [],
    focusKeywordInput: "",
    keywordInput: "",
    isCheckedQuick: data.isCheckedQuick || false,
    isCheckedBrand: data.isCheckedBrand || false,
    aiModel: data.aiModel || "gemini",
  })

  const handleKeywordInputChange = (e, type) => {
    setFormData((prevState) => ({
      ...prevState,
      [`${type}Input`]: e.target.value,
    }))
  }

  const handleAddKeyword = (type) => {
    const inputValue = formData[`${type}Input`].trim()
    if (!inputValue) return

    const existing = formData[type].map((k) => k.toLowerCase().trim())
    const seen = new Set()
    const newKeywords = inputValue
      .split(",")
      .map((k) => k.trim())
      .filter((k) => {
        const lower = k.toLowerCase()
        if (!k || seen.has(lower) || existing.includes(lower)) return false
        seen.add(lower)
        return true
      })

    if (type === "focusKeywords") {
      const total = formData[type].length + newKeywords.length
      if (total > 3) {
        message.error("You can only add up to 3 focus keywords.")
        return
      }
    }

    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ...newKeywords],
      [`${type}Input`]: "",
    }))
  }

  const handleRemoveKeyword = (index, type) => {
    const updatedKeywords = [...formData[type]]
    updatedKeywords.splice(index, 1)
    setFormData({ ...formData, [type]: updatedKeywords })
  }

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword(type)
    }
  }

  const handleNextStep = () => {
    setData((prev) => ({ ...prev, ...formData }))
    handleNext()
  }

  useEffect(() => {
    if (formData.isCheckedBrand) {
      dispatch(fetchBrands())
    }
  }, [formData.isCheckedBrand, dispatch])

  // Sync formData with selectedKeywords from Redux
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      focusKeywords: [
        ...new Set([...prev.focusKeywords, ...(selectedKeywords?.focusKeywords || [])]),
      ].slice(0, 3),
      keywords: [...new Set([...prev.keywords, ...(selectedKeywords?.allKeywords || [])])],
    }))
  }, [selectedKeywords])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-[800px] bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Step 2: Let's make it Compelling</h2>
          <button onClick={handleClose} className="ml-4 text-4xl text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step 2 of 3</span>
            </div>
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-[#1B6FC9] rounded-full" />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select AI Model
              </label>

              <div className="flex items-center gap-6">
                {/* Gemini - Free for all */}
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="gemini"
                    name="aiModel"
                    value="gemini"
                    checked={formData.aiModel === "gemini"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        aiModel: e.target.value,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <label htmlFor="gemini" className="text-sm text-gray-700">
                    Gemini
                  </label>
                </div>

                {/* ChatGPT - Premium Only */}
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="chatgpt"
                    name="aiModel"
                    value="chatgpt"
                    checked={formData.aiModel === "chatgpt"}
                    onChange={(e) => {
                      if (userPlan !== "free") {
                        setFormData((prev) => ({
                          ...prev,
                          aiModel: e.target.value,
                        }))
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <label
                    htmlFor="chatgpt"
                    onClick={(e) => {
                      if (userPlan === "free") {
                        e.preventDefault()
                        openUpgradePopup({ featureName: "ChatGPT", navigate })
                      }
                    }}
                    className="text-sm cursor-pointer flex items-center gap-1 text-gray-700"
                  >
                    ChatGPT
                    {userPlan === "free" && <Crown className="w-4 h-4 text-yellow-500" />}
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keywords</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.focusKeywordInput}
                  onChange={(e) => handleKeywordInputChange(e, "focusKeywords")}
                  onKeyDown={(e) => handleKeyPress(e, "focusKeywords")}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
                  placeholder="Enter focus keywords"
                />
                <button
                  onClick={() => handleAddKeyword("focusKeywords")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.focusKeywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(index, "focusKeywords")}
                      className="ml-1 text-blue-400 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.keywordInput}
                  onChange={(e) => handleKeywordInputChange(e, "keywords")}
                  onKeyDown={(e) => handleKeyPress(e, "keywords")}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
                  placeholder="Enter keywords"
                />
                <button
                  onClick={() => handleAddKeyword("keywords")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(index, "keywords")}
                      className="ml-1 text-blue-400 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Add a Quick Summary</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCheckedQuick}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isCheckedQuick: !prev.isCheckedQuick,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate | x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all" />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={handlePrevious}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Previous
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecondStepModal
