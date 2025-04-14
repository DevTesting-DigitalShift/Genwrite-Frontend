import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createMultiBlog } from "../../store/slices/blogSlice";
import Carousel from "./Carousel";

const MultiStepModal = ({ closefnc }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    userDefinedLength: 0,
    tone: "",
    includeInterlink: false,
    includeMetaHeadlines: false,
    wordpressStatus: true,
    numberOfBlogs: 0,
    postFrequency: 0,
    randomisedFrequency: 0,
    template: [],
    focusKeywords: [],
    keywords: [],
    focusKeywordInput: "",
    keywordInput: "",
  });

  const packages = [
    {
      imgSrc: "./Images/classicBlog.png",
      name: "Classic",
      description: "Timeless elegance for your classic blog journey",
      author: "Author 1",
    },
    {
      imgSrc: "./Images/classicBlog.png",
      name: "Listicle",
      description: "Tips for actionable success in list format.",
      author: "Author 2",
    },
    {
      imgSrc: "./Images/ProductReview.png",
      name: "Product Review",
      description: "Product insights: pros, cons, and more.",
      author: "Author 3",
    },
    {
      imgSrc: "./Images/BlogImage.png",
      name: "How to....",
      description: "Step-by-step guides for practical how-to solutions.",
      author: "Author 4",
    },
    {
      imgSrc: "./Images/classicBlog.png",
      name: "News Article",
      description: "Latest updates and breaking news coverage.",
    },
    {
      imgSrc: "./Images/TipsBlog.png",
      name: "Opinion Piece",
      description: "Expert insights and analytical perspectives.",
    },
    {
      imgSrc: "./Images/ProductReview.png",
      name: "Case Study",
      description: "In-depth analysis and real-world examples.",
    },
    {
      imgSrc: "./Images/BlogImage.png",
      name: "Interview",
      description: "Engaging conversations with industry experts.",
    },
  ];

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleClose = () => {
    closefnc();
  };

  const handleSubmit = () => {
    console.log("Form submitted with data:", formData);
    dispatch(createMultiBlog(formData, navigate));
    handleClose();
  };

  const handlePackageSelect = (index) => {
    const selectedPackageName = packages[index].name;
    if (formData.template.includes(selectedPackageName)) {
      setFormData({
        ...formData,
        template: formData.template.filter(
          (name) => name !== selectedPackageName
        ),
      });
    } else if (formData.template.length < 3) {
      setFormData({
        ...formData,
        template: [...formData.template, selectedPackageName],
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

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

  const steps = [
    "Select Template",
    "Let's make it Compelling",
    "One last step",
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="w-[800px] bg-white rounded-lg shadow-xl">
        <div className="flex items-center relative justify-between p-6">
          <div className="flex items-center gap-2 ">
            <h2 className="text-lg font-semibold">
              Step {currentStep + 1} | {steps[currentStep]}
            </h2>
            <button
              onClick={handleClose}
              className="ml-4 text-4xl absolute right-10 top-5 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-6 pb-2">
          {/* Progress bar */}
          <div className="w-full bg-gray-100 h-2 rounded-full mb-8">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {currentStep === 0 && (
            <div className="">
              <Carousel>
                {packages.map((pkg, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer transition-all duration-200 ${
                      formData.template.includes(pkg.name)
                        ? "border-blue-500 border-2"
                        : ""
                    }`}
                    onClick={() => handlePackageSelect(index)}
                  >
                    <div className="bg-white rounded-lg overflow-hidden">
                      <div className=" relative">
                        <img
                          src={pkg.imgSrc || "/placeholder.svg"}
                          alt={pkg.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        className={`${
                          index === 2
                            ? "mt-3"
                            : index === 3
                            ? "mt-1"
                            : index === 4
                            ? "mt-2"
                            : index === 6
                            ? "mt-5"
                            : index === 7
                            ? "mt-3"
                            : ""
                        } p-2`}
                      >
                        <h3 className="font-medium text-gray-900 mb-1">
                          {pkg.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {pkg.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Focus Keywords
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.focusKeywordInput}
                      onChange={(e) =>
                        handleKeywordInputChange(e, "focusKeywords")
                      }
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blog Length
                    </label>
                    <input
                      type="range"
                      name="userDefinedLength"
                      min="0"
                      max="20"
                      value={formData.userDefinedLength}
                      onChange={handleInputChange}
                      className="w-full h-1 rounded-lg appearance-none cursor-pointer 
                      bg-gradient-to-r from-[#1B6FC9] to-gray-100
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1B6FC9]"
                      style={{
                        background: `linear-gradient(to right, #1B6FC9 ${
                          (formData.userDefinedLength / 20) * 100
                        }%, #E5E7EB ${
                          (formData.userDefinedLength / 20) * 100
                        }%)`,
                      }}
                    />
                    <div className="text-sm text-gray-600 mt-1">
                      {formData.userDefinedLength} minutes
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tone of Voice
                    </label>
                    <select
                      name="tone"
                      value={formData.tone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                    >
                      <option value="">Select tone</option>
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="formal">Formal</option>
                      <option value="informative">Informative</option>
                      <option value="persuasive">Persuasive</option>
                      <option value="conversational">Conversational</option>
                      <option value="authoritative">Authoritative</option>
                      <option value="humorous">Humorous</option>
                      <option value="inspirational">Inspirational</option>
                      <option value="empathetic">Empathetic</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Include interlink blogs
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeInterlink"
                      checked={formData.includeInterlink}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Include meta headlines
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="includeMetaHeadlines"
                      checked={formData.includeMetaHeadlines}
                      onChange={handleCheckboxChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Blogs
                    </label>
                    <input
                      type="number"
                      name="numberOfBlogs"
                      value={formData.numberOfBlogs}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                      placeholder="Enter number of blogs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Post Frequency
                    </label>
                    <input
                      type="number"
                      name="postFrequency"
                      value={formData.postFrequency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                      placeholder="Enter post frequency"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Randomised Frequency
                    </label>
                    <input
                      type="number"
                      name="randomisedFrequency"
                      value={formData.randomisedFrequency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                      placeholder="Enter randomised frequency"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          <button
            onClick={currentStep === 2 ? handleSubmit : handleNext}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {currentStep === 2 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiStepModal;
