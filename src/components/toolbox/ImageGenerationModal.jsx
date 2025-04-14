import React, { useState } from 'react';

const ImageGenerationModal = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({ brief: '', tags: [], keywords: [] });

  const tagsList = ['Ultrarealistic', 'Photography', 'Art', 'Illustration']; // Predefined tags

  const handleNext = () => setCurrentStep(currentStep + 1);
  const handlePrev = () => setCurrentStep(currentStep - 1);

  const handleTagToggle = (tag) => {
    const isSelected = data.tags.includes(tag);
    if (isSelected) {
      setData({ ...data, tags: data.tags.filter((t) => t !== tag) });
    } else {
      setData({ ...data, tags: [...data.tags, tag] });
    }
  };

  const handleAddKeyword = () => {
    const keyword = prompt("Enter a new keyword:");
    if (keyword) {
      setData({ ...data, keywords: [...data.keywords, keyword] });
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setData({
      ...data,
      keywords: data.keywords.filter((keyword) => keyword !== keywordToRemove),
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="w-[80vw] h-[85vh] max-w-[1200px] mx-4 bg-white rounded-lg shadow-xl overflow-y-auto p-6">
        <div className="p-6 flex justify-between items-center mb-4">
          <h3 className="text-3xl font-montserrat font-semibold">Generate an Image</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Step Content */}
        <div>
          {currentStep === 0 && (
            <div className='p-6 pt-2'>
              <div>
                <h1 className="text-xl font-hind font-normal mb-2">Image Description</h1>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter brief description"
                  rows="3"
                  value={data.brief}
                  onChange={(e) => setData({ ...data, brief: e.target.value })}
                ></textarea>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-hind font-normal mb-2">Tags</h3>
                <div>
                  {tagsList.map((tag, index) => (
                    <span
                      key={index}
                      onClick={() => handleTagToggle(tag)}
                      className={`cursor-pointer p-2 w-fit border border-gray-200 rounded-xl inline-block mr-4 mb-2 ${
                        data.tags.includes(tag)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-50 text-black'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-hind font-normal mb-2">Keywords</h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={handleAddKeyword}
                    className="bg-blue-500 text-white p-2 w-fit border inline-block border-blue-500 rounded-xl"
                  >
                    Add Keywords +
                  </button>
                  {data.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-700 p-2 w-fit border border-blue-300 rounded-xl inline-block flex items-center"
                    >
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-2 text-red-500 focus:outline-none"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="p-6">
              <h4 className="text-xl font-hind font-normal mb-2">Generated Results</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-[15rem] m-2 bg-gray-300 w-[27rem] relative">
                  <div className='absolute top-2 right-2 bg-blue-500 h-8 w-8 border rounded-md text-white flex items-center justify-center'>
                    <i className="fa-solid fa-download"></i>
                  </div>
                </div>
                <div className="h-[15rem] m-2 bg-gray-300 w-[27rem] relative">
                  <div className='absolute top-2 right-2 bg-blue-500 h-8 w-8 border rounded-md text-white flex items-center justify-center'>
                    <i className="fa-solid fa-download"></i>
                  </div>
                </div>
                <div className="h-[15rem] m-2 bg-gray-300 w-[27rem] relative">
                  <div className='absolute top-2 right-2 bg-blue-500 h-8 w-8 border rounded-md text-white flex items-center justify-center'>
                    <i className="fa-solid fa-download"></i>
                  </div>
                </div>
                <div className="h-[15rem] m-2 bg-gray-300 w-[27rem] relative">
                  <div className='absolute top-2 right-2 bg-blue-500 h-8 w-8 border rounded-md text-white flex items-center justify-center'>
                    <i className="fa-solid fa-download"></i>
                  </div>
                </div>
              </div>

              <button
                className="sticky bottom-4 left-[80vw] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700 w-44"
              >
                Regenerate
              </button>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end mt-6">
          {currentStep > 0 && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700 w-44"
              onClick={handlePrev}
            >
              Back
            </button>
          )}
          {currentStep < 1 && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:bg-blue-700 w-44"
              onClick={handleNext}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationModal;
