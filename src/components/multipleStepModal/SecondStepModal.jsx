import { useState, useEffect } from "react";
import { fetchBrands } from "@store/slices/brandSlice";
import { useDispatch, useSelector } from "react-redux";
import { message, Modal } from "antd";
import { openUpgradePopup } from "@utils/UpgardePopUp";
import { Crown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Popular WordPress categories (limited to 15 for relevance)
const POPULAR_CATEGORIES = [
  "Blogging",
  "Technology",
  "Lifestyle",
  "Travel",
  "Food & Drink",
  "Health & Wellness",
  "Fashion",
  "Business",
  "Education",
  "Entertainment",
  "Photography",
  "Fitness",
  "Marketing",
  "Finance",
  "DIY & Crafts",
];

const SecondStepModal = ({ handleNext, handlePrevious, handleClose, data, setData }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const userPlan = user?.subscription?.plan || user?.plan;

  const [formData, setFormData] = useState({
    isCheckedQuick: data.isCheckedQuick || false,
    isCheckedBrand: data.isCheckedBrand || false,
    aiModel: data.aiModel || "gemini",
    categories: data.categories || [],
  });

  const handleNextStep = () => {
    setData((prev) => ({ ...prev, ...formData }));
    handleNext();
  };

  useEffect(() => {
    if (formData.isCheckedBrand) {
      dispatch(fetchBrands());
    }
  }, [formData.isCheckedBrand, dispatch]);

  const handleCategoryAdd = (category) => {
    if (!formData.categories.includes(category)) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, category],
      }));
    }
  };

  const handleCategoryRemove = (category) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat !== category),
    }));
  };

  return (
    <Modal
      title="Step 2: Let's make it Compelling"
      open={true}
      onCancel={handleClose}
      footer={[
        <button
          key="previous"
          onClick={handlePrevious}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Previous
        </button>,
        <button
          key="next"
          onClick={handleNextStep}
          className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 ml-3"
        >
          Next
        </button>,
      ]}
      width={800}
      centered
    >
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
                      }));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                />
                <label
                  htmlFor="chatgpt"
                  onClick={(e) => {
                    if (userPlan === "free") {
                      e.preventDefault();
                      openUpgradePopup({ featureName: "ChatGPT", navigate });
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
          {/* --- Category Selection Section --- */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Categories</label>
            {/* Selected Categories Chips */}
            {formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.categories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center gap-2 px-3 py-1 bg-[#1B6FC9] text-white rounded-full text-sm"
                  >
                    {category}
                    <button
                      onClick={() => handleCategoryRemove(category)}
                      className="text-white hover:text-gray-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Category Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto p-2 rounded-lg border border-gray-200 bg-gray-50">
              {POPULAR_CATEGORIES.map((category) => (
                <div
                  key={category}
                  className={`flex items-center justify-between p-3 rounded-full bg-white border border-gray-200 text-sm font-medium cursor-pointer transition-all duration-200 ${
                    formData.categories.includes(category)
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-indigo-50 hover:border-indigo-300"
                  }`}
                >
                  <span>{category}</span>
                  {!formData.categories.includes(category) && (
                    <button
                      onClick={() => handleCategoryAdd(category)}
                      className="text-[#1B6FC9] hover:text-[#1B6FC9]/80"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
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
              <div
                className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full relative 
                peer peer-checked:after:translate-x-6 peer-checked:bg-[#1B6FC9] 
                after:content-[''] after:absolute after:top-[4px] after:left-[4px] 
                after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"
              />
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SecondStepModal;