import { useState, useEffect } from "react";
import axiosInstance from "@/api/index";

const SecondStepModal = ({
  handleNext,
  handlePrevious,
  handleClose,
  data,
  setData,
}) => {
  const [formData, setFormData] = useState({
    focusKeywords: data.focusKeywords || [],
    keywords: data.keywords || [],
    focusKeywordInput: "",
    keywordInput: "",
    isCheckedQuick: data.isCheckedQuick || false,
    isCheckedBrand: data.isCheckedBrand || false,
    aiModel: data.aiModel || "gemini",
  });

  const [brandVoices, setBrandVoices] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brandError, setBrandError] = useState(null);

  const handleKeywordInputChange = (e, type) => {
    if (type === "keywords") {
      setFormData((prevState) => ({
        ...prevState,
        [`${type}Input`]: e.target.value,
        keywordInput: e.target.value,
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [`${type}Input`]: e.target.value,
        focusKeywordInput: e.target.value,
      }));
    }
  };

  const handleAddKeyword = (type) => {
    const inputValue = formData[`${type}Input`];
    if (inputValue.trim() !== "") {
      const newKeywords = inputValue
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword !== "");
      if (
        type === "focusKeywords" &&
        formData[type].length + newKeywords.length > 3
      ) {
        alert("You can only add up to 3 focus keywords.");
        return;
      }
      if (type === "focusKeywords") {
        setFormData({
          ...formData,
          [type]: [...formData[type], ...newKeywords],
          [`${type}Input`]: "",
          focusKeywordInput: "",
        });
      } else {
        setFormData({
          ...formData,
          [type]: [...formData[type], ...newKeywords],
          [`${type}Input`]: "",
          keywordInput: "",
        });
      }
    }
  };

  const handleRemoveKeyword = (index, type) => {
    const updatedKeywords = [...formData[type]];
    updatedKeywords.splice(index, 1);
    setFormData({ ...formData, [type]: updatedKeywords });
  };

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword(type);
    }
  };

  const handleNextStep = () => {
    setData((prev) => ({ ...prev, ...formData }));
    handleNext();
  };

  useEffect(() => {
    if (formData.isCheckedBrand) {
      setLoadingBrands(true);
      axiosInstance
        .get("/brand")
        .then((res) => {
          let brandsArr = Array.isArray(res.data)
            ? res.data
            : res.data
            ? [res.data]
            : [];
          setBrandVoices(brandsArr);
          setLoadingBrands(false);
        })
        .catch((err) => {
          setBrandError("Failed to fetch brand voices");
          setLoadingBrands(false);
        });
    }
  }, [formData.isCheckedBrand]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-[800px] bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">
            Step 2: Let's make it Compelling
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            X
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step 2 of 3</span>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-[#1B6FC9] rounded-full" />
            </div>
          </div>

          <div className="space-y-6">
            {/* --- Brand Voice Section removed from Step 2, now in Step 3 --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select AI Model
              </label>
              <select
                value={formData.aiModel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    aiModel: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gemini">Gemini</option>
                <option value="chatgpt">Chatgpt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Focus Keywords
              </label>
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
                      onClick={() =>
                        handleRemoveKeyword(index, "focusKeywords")
                      }
                      className="ml-1 text-blue-400 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
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
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(index, "keywords")}
                      className="ml-1 text-gray-400 hover:text-gray-600"
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
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all" />
              </label>
            </div>

            {/* <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Write with Brand Voice
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCheckedBrand}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isCheckedBrand: !prev.isCheckedBrand,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all" />
              </label>
            </div> */}
            {/* Show all brand voices if Write with Brand Voice is checked */}
            {/* (Brand voice section moved to Step 3) */}
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
  );
};

export default SecondStepModal;
