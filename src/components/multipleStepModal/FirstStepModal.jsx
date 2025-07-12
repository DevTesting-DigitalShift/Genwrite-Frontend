import { memo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Sparkles } from "lucide-react";
import { message, Modal, Select, Spin } from "antd";
import { fetchGeneratedTitles } from "@store/slices/blogSlice";

const { Option } = Select;

const FirstStepModal = ({ handleNext, handleClose, handlePrevious, data, setData }) => {
  const [topic, setTopic] = useState(data?.topic || "");
  const [hasGeneratedTitles, setHasGeneratedTitles] = useState(false); // Track if titles were generated
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({
    title: false,
    topic: false,
    tone: false,
    focusKeyword: false,
    keyword: false,
  });
  const [formData, setFormData] = useState({
    focusKeywords: data.focusKeywords || [],
    keywords: data.keywords || [],
  });
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [loadingTitles, setLoadingTitles] = useState(false);

  // Reset hasGeneratedTitles when modal opens
  useEffect(() => {
    setHasGeneratedTitles(false); // Reset when modal is opened
    setGeneratedTitles([]); // Clear previous titles
  }, []); // Run only on mount (modal open)

  const handleKeywordInputChange = (e, type) => {
    setFormData((prevState) => ({
      ...prevState,
      [`${type}Input`]: e.target.value,
    }));
  };

  const handleAddKeyword = (type) => {
    const inputValue = formData[`${type}Input`]?.trim();
    const errorKey = type === "focusKeywords" ? "focusKeyword" : "keyword";

    if (!inputValue) {
      setErrors((prev) => ({ ...prev, [errorKey]: true }));
      message.error("Please enter a keyword.");
      return;
    }

    const existing = formData[type].map((k) => k.toLowerCase().trim());
    const seen = new Set();
    const newKeywords = inputValue
      .split(",")
      .map((k) => k.trim())
      .filter((k) => {
        const lower = k.toLowerCase();
        if (!k || seen.has(lower) || existing.includes(lower)) return false;
        seen.add(lower);
        return true;
      });

    if (newKeywords.length === 0) {
      setErrors((prev) => ({ ...prev, [errorKey]: true }));
      message.error("Please enter valid, non-duplicate keywords separated by commas.");
      return;
    }

    if (type === "focusKeywords") {
      const total = formData[type].length + newKeywords.length;
      if (total > 3) {
        setErrors((prev) => ({ ...prev, [errorKey]: true }));
        message.error("You can only add up to 3 focus keywords.");
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ...newKeywords],
      [`${type}Input`]: "",
    }));

    setErrors((prev) => ({ ...prev, [errorKey]: false }));
  };

  const handleRemoveKeyword = (index, type) => {
    const updatedKeywords = [...formData[type]];
    updatedKeywords.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      [type]: updatedKeywords,
      [`${type}Input`]: updatedKeywords.join(", "),
    }));
  };

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword(type);
    }
  };

  const handleToneChange = (value) => {
    setData((prev) => ({ ...prev, tone: value }));
    setErrors((prev) => ({ ...prev, tone: false }));
  };

  const handleGenerateTitles = async () => {
    if (!topic.trim()) {
      message.error("Please enter a topic before generating titles.");
      return;
    }
    setLoadingTitles(true);
    try {
      const result = await dispatch(
        fetchGeneratedTitles({
          keywords: formData.keywords,
          focusKeywords: formData.focusKeywords,
          topic,
          template: "default",
        })
      ).unwrap();
      setGeneratedTitles(result);
      setHasGeneratedTitles(true); // Disable button after generating titles
    } catch (error) {
      // Error handled in thunk
    } finally {
      setLoadingTitles(false);
    }
  };

  const handleNextClick = () => {
    const newErrors = {
      title: !data?.title?.trim(),
      topic: !topic?.trim(),
      tone: !data?.tone,
      focusKeyword: formData.focusKeywords.length === 0,
      keyword: formData.keywords.length === 0,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      message.error("Please fill in all required fields.");
      return;
    }

    const updatedData = {
      ...data,
      topic,
      focusKeywords: formData.focusKeywords,
      keywords: formData.keywords,
    };
    setData(updatedData);
    handleNext();
  };

  useEffect(() => {
    if (data && !data.isCheckedGeneratedImages) {
      setData((prev) => ({
        ...prev,
        isCheckedGeneratedImages: true,
        isUnsplashActive: true,
      }));
    }
  }, [data, setData]);

  return (
    <Modal
      title="Step 2: Crucial Details"
      open={true}
      onCancel={handleClose}
      footer={[
        <button
          key="back"
          onClick={handlePrevious}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Back
        </button>,
        <button
          key="next"
          onClick={handleNextClick}
          className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 ml-3"
        >
          Next
        </button>,
      ]}
      width={800}
      centered
      transitionName=""
      maskTransitionName=""
    >
      <div className="p-4">
        <div className="space-y-6">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 bg-gray-50 border ${
                errors.topic ? "border-red-500" : "border-gray-200"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]`}
              placeholder="e.g., Tech Blog"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setErrors((prev) => ({ ...prev, topic: false }));
              }}
            />
          </div>

          {console.log(formData)}

          {/* Focus Keywords */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Focus Keywords (up to 3)<span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.focusKeyword}
                onChange={(e) => handleKeywordInputChange(e, "focusKeywords")}
                onKeyDown={(e) => handleKeyPress(e, "focusKeywords")}
                className={`flex-1 px-3 py-2 bg-gray-50 border ${
                  errors.focusKeyword ? "border-red-500" : "border-gray-200"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm`}
                placeholder="Enter focus keywords, separated by commas"
              />
              <button
                onClick={() => handleAddKeyword("focusKeywords")}
                className="px-4 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 text-sm flex items-center"
              >
                <Plus size={16} />
              </button>
            </div>
            {formData.focusKeywords.length > 0 && (
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
            )}
          </div>

          {/* Secondary Keywords */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Keywords<span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) => handleKeywordInputChange(e, "keywords")}
                onKeyDown={(e) => handleKeyPress(e, "keywords")}
                className={`flex-1 px-3 py-2 bg-gray-50 border ${
                  errors.keyword ? "border-red-500" : "border-gray-200"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm`}
                placeholder="Enter secondary keywords, separated by commas"
              />
              <button
                onClick={() => handleAddKeyword("keywords")}
                className="px-4 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 text-sm flex items-center"
              >
                <Plus size={16} />
              </button>
            </div>
            {formData.keywords.length > 0 && (
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
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className={`flex-1 px-3 py-2 bg-gray-50 border ${
                  errors.title ? "border-red-500" : "border-gray-200"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]`}
                placeholder="e.g., How to Create a Tech Blog"
                value={data?.title || ""}
                onChange={(e) => {
                  setData((prev) => ({ ...prev, title: e.target.value }));
                  setErrors((prev) => ({ ...prev, title: false }));
                }}
              />
              {/* Conditionally render or disable the Generate Titles button */}
              {!hasGeneratedTitles && (
                <button
                  onClick={handleGenerateTitles}
                  disabled={loadingTitles}
                  className={`px-4 py-2 bg-gradient-to-r from-[#1B6FC9] to-[#4C9FE8] text-white rounded-lg flex items-center ${
                    loadingTitles ? "opacity-50 cursor-not-allowed" : "hover:from-[#1B6FC9]/90 hover:to-[#4C9FE8]/90"
                  }`}
                >
                  {loadingTitles ? <Spin size="small" /> : <Sparkles size={16} className="mr-2" />}
                  Generate Titles
                </button>
              )}
            </div>
            {generatedTitles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {generatedTitles.map((title, index) => {
                  const isSelected = data.title === title;
                  return (
                    <div key={index} className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          setData((prev) => ({ ...prev, title }));
                          setErrors((prev) => ({ ...prev, title: false }));
                        }}
                        className={`px-3 py-1 rounded-full text-sm border transition w-full truncate
                          ${
                            isSelected
                              ? "bg-[#1B6FC9] text-white border-[#1B6FC9]"
                              : "bg-gray-100 text-gray-700 border-gray-300 opacity-60 hover:opacity-100 hover:bg-gray-200"
                          }`}
                      >
                        {title}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tone and Length */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tone of Voice <span className="text-red-500">*</span>
              </label>
              <Select
                className="w-full"
                value={data?.tone || undefined}
                onChange={handleToneChange}
                placeholder="Select tone"
                status={errors.tone ? "error" : ""}
              >
                <Option value="professional">Professional</Option>
                <Option value="casual">Casual</Option>
                <Option value="friendly">Friendly</Option>
                <Option value="formal">Formal</Option>
                <Option value="conversational">Conversational</Option>
                <Option value="witty">Witty</Option>
                <Option value="informative">Informative</Option>
                <Option value="inspirational">Inspirational</Option>
                <Option value="persuasive">Persuasive</Option>
                <Option value="empathetic">Empathetic</Option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Choose length of Blog</label>
              <div className="relative">
                <input
                  type="range"
                  min="500"
                  max="5000"
                  value={data?.userDefinedLength ?? 1000}
                  className="w-full h-1 rounded-lg appearance-none cursor-pointer 
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:w-4 
                    [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-[#1B6FC9]"
                  onChange={(e) => {
                    setData((prev) => ({
                      ...prev,
                      userDefinedLength: parseInt(e.target.value, 10),
                    }));
                  }}
                  style={{
                    background: `linear-gradient(to right, #1B6FC9 ${
                      ((data?.userDefinedLength ?? 1000) - 500) / 45
                    }%, #e5e7eb 0%)`,
                  }}
                />
                <span className="mt-2 text-sm text-gray-600 block">
                  {data?.userDefinedLength ?? 1000} words
                </span>
              </div>
            </div>
          </div>

          {/* Brief Section */}
          <div> 
            <label className="block text-sm font-medium mb-2">Add Brief Section (Optional)</label>
            <textarea
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]"
              rows={3}
              placeholder="Enter brief section"
              value={data?.brief || ""}
              onChange={(e) => setData((prev) => ({ ...prev, brief: e.target.value }))}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500">
                {data?.brief?.length || 0}/2000 characters
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default memo(FirstStepModal);