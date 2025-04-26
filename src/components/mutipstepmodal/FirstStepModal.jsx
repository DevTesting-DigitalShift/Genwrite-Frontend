import { memo, useState } from "react";

const FirstStepModal = ({
  handleNext,
  handleClose,
  handlePrevious,
  data,
  setData,
}) => {
  const [topic, setTopic] = useState(data?.topic || "");

  const handleNextClick = () => {
    const updatedData = {
      ...data,
      topic,
    };
    setData(updatedData);
    handleNext();
  };

  // Update handler for image source selection
  const handleImageSourceChange = (source) => {
    setData(prev => ({
      ...prev,
      isCheckedGeneratedImages: true, // Always true since we removed the "no images" option
      isUnsplashActive: source === 'unsplash'
    }));
  };

  // Set default image source if not selected
  useState(() => {
    if (!data?.isCheckedGeneratedImages) {
      setData(prev => ({
        ...prev,
        isCheckedGeneratedImages: true,
        isUnsplashActive: true // Default to Unsplash
      }));
    }
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="w-[800px] bg-white rounded-lg shadow-xl ">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Step 1: Let's get started</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            X
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step 1 of 3</span>
            </div>
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-[#1B6FC9] rounded-full" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]"
                placeholder="e.g., How to get"
                value={data?.title || ""}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]"
                placeholder="e.g., Tech Blog"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-8">
                <label className="block text-sm font-medium">
                  Image Source <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="unsplash"
                      name="imageSource"
                      checked={data?.isUnsplashActive}
                      onChange={() => handleImageSourceChange('unsplash')}
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label htmlFor="unsplash" className="text-sm text-gray-700 whitespace-nowrap">
                      Unsplash Images
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="ai-generated"
                      name="imageSource"
                      checked={!data?.isUnsplashActive}
                      onChange={() => handleImageSourceChange('ai')}
                      className="h-4 w-4 text-[#1B6FC9] focus:ring-[#1B6FC9] border-gray-300"
                    />
                    <label htmlFor="ai-generated" className="text-sm text-gray-700 whitespace-nowrap">
                      AI-Generated Images
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Choose length of Blog <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={data?.userDefinedLength || 0}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer 
          bg-gradient-to-r from-[#1B6FC9] to-gray-100
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1B6FC9]"
                    style={{
                      background: `linear-gradient(to right, #1B6FC9 ${
                        (data.userDefinedLength / 20) * 100
                      }%, #E5E7EB ${(data.userDefinedLength / 20) * 100}%)`,
                    }}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        userDefinedLength: e.target.value,
                      }))
                    }
                  />
                  <span className="mt-2 text-sm text-gray-600 block">
                    {data?.userDefinedLength || 0} minutes
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tone of Voice <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]"
                  value={data?.tone || ""}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, tone: e.target.value }))
                  }
                >
                  <option value="">Select</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Add Brief Section (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6FC9]"
                rows={3}
                placeholder="Enter brief section"
                value={data?.brief || ""}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, brief: e.target.value }))
                }
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-500">
                  {data?.brief?.length || 0}/2000 characters
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={handlePrevious}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={handleNextClick}
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

export default memo(FirstStepModal);
