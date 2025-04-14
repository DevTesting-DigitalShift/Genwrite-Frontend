import React, { useState } from "react";
import { FaEdit, FaTimes } from "react-icons/fa";
import { brandVoiceData } from "./brandVoiceData";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sendBrandVoice } from "../../store/slices/blogSlice";

const BrandVoice = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State to store form data
  const [formData, setFormData] = useState({
    nameOfVoice: "",
    postLink: "",
    keywords: [],
    describeBrand: "",
    selectedVoice: null,
    uploadedFile: null,
  });

  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelect = (voice) => {
    setFormData({
      ...formData,
      selectedVoice: voice,
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        uploadedFile: file.name,
        keywords: [...formData.keywords, file.name], // Add file name to keywords
      });
    }
  };

  const handleRemoveFile = (fileName) => {
    setFormData({
      ...formData,
      uploadedFile: null,
      keywords: formData.keywords.filter((keyword) => keyword !== fileName),
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && inputValue.trim()) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, inputValue.trim()],
      });
      setInputValue("");
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  const handleSave = () => {
    console.log("Form Data:", formData); // Print the whole form data
    dispatch(sendBrandVoice(formData, navigate));
    console.log("Form submitted successfully");
  };

  const renderKeywords = () => {
    const latestKeywords = formData.keywords.slice(-3);
    const remainingCount = formData.keywords.length - latestKeywords.length;

    return (
      <>
        {remainingCount > 0 && (
          <div className="flex items-center bg-gray-200 rounded-md px-2 py-1 mr-2">
            <span className="text-sm">{`+${remainingCount}`}</span>
          </div>
        )}
        {latestKeywords.map((keyword, index) => (
          <div
            key={index}
            className="flex items-center bg-gray-200 rounded-md px-2 py-1 mr-2"
          >
            <span className="text-sm">{keyword}</span>
            <FaTimes
              className="ml-1 cursor-pointer"
              onClick={() => handleRemoveKeyword(keyword)}
            />
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="flex p-7 ml-20 mt-12">
      <div className="w-[60%] p-8">
        <div className="left-section w-full">
          <h1 className="text-[24px] font-[600]">
            Let’s create your Brand Voice
          </h1>
          <p className="text-[14px] font-[400] mt-4">
            Prototype group pixel duplicate ellipse hand draft style rotate.
            Layout follower scale comment flows draft select.
          </p>
          <div className="text-[#454545] mt-6 space-y-6">
            <div>
              <label
                htmlFor="nameOfVoice"
                className="text-[14px] font-[600] block mb-2"
              >
                Name of Voice
              </label>
              <input
                type="text"
                name="nameOfVoice"
                value={formData.nameOfVoice}
                onChange={handleInputChange}
                placeholder="e.g., How to get?"
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label
                htmlFor="postLink"
                className="text-[14px] font-[600] block mb-2"
              >
                Paste link of your post or blog *
              </label>
              <input
                type="text"
                name="postLink"
                value={formData.postLink}
                onChange={handleInputChange}
                placeholder="e.g., How to get?"
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
              />
            </div>
            <div className="text-center my-4">
              <span>OR</span>
            </div>
            <div>
              <label
                htmlFor="keywords"
                className="text-[14px] font-[600] block mb-2"
              >
                Keywords*
              </label>
              <div className="flex items-center bg-white border border-gray-300 rounded-md p-2 flex-wrap">
                {renderKeywords()}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-grow p-2 bg-white border-none outline-none rounded-l-md"
                  placeholder="e.g., Fun"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center cursor-pointer"
                >
                  <img
                    src="./Images/upload.png"
                    alt="Upload"
                    className="w-10 h-10 p-2"
                  />
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="describeBrand"
                className="text-[14px] font-[600] block mb-2"
              >
                Describe your Brand
              </label>
              <textarea
                id="describeBrand"
                name="describeBrand"
                value={formData.describeBrand}
                onChange={handleInputChange}
                placeholder="Write a blog on how to cook pasta"
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                rows="4"
              />
            </div>
            <div className="text-right">
              <button
                className="bg-[#498DD6] text-white px-6 py-2 rounded-md"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* vertical line */}
      <div className="h-[100vh] w-[0.5px] bg-[#CFCFCF]"></div>

      {/* right part */}
      <div className="right p-8">
        <h1 className="font-[600] text-[20px]">Selected Brand Voice</h1>

        <div className="my-6">
          {formData.selectedVoice ? (
            <div className="w-[385px] rounded-[4px] bg-white shadow-md border border-blue-500 p-4">
              <div className="flex justify-between items-center">
                <h1 className="text-[#1B6FC9] font-[400] text-[16px]">
                  {formData.selectedVoice.brandName}
                </h1>
                <div className="flex space-x-2">
                  <FaEdit className="text-blue-600 cursor-pointer" />
                  <img src="./images/edit.png" alt="Edit" />
                  <img src="./images/trash.png" alt="Delete" />
                </div>
              </div>
              <p className="text-[14px] font-[400] text-[#454545] mt-2">
                {formData.selectedVoice.brandVoice.length > 100
                  ? `${formData.selectedVoice.brandVoice.substring(0, 100)}...`
                  : formData.selectedVoice.brandVoice}
              </p>
            </div>
          ) : (
            <p className="text-[14px] font-[400] text-[#454545] mt-2">
              No brand voice selected.
            </p>
          )}
        </div>

        {/* select brand voices */}
        <h2 className="font-[600] text-[20px] mb-4">Select Brand Voice</h2>
        <div className="flex flex-col gap-5">
          {brandVoiceData.map((item, index) => (
            <YourVoicesComponent
              key={index}
              id={item.id}
              brandName={item.brandName}
              brandVoice={item.brandVoice}
              onSelect={() => handleSelect(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const YourVoicesComponent = ({ id, brandName, brandVoice, onSelect }) => {
  return (
    <div
      key={id}
      className="w-[385px] h-[92px] rounded-[4px] bg-white shadow-md p-2 cursor-pointer"
      onClick={onSelect}
    >
      <h1 className="text-[#1B6FC9] font-[400] text-[16px]">{brandName}</h1>
      <p className="text-[14px] font-[400] text-[#454545] mt-2">
        {brandVoice.length > 100
          ? `${brandVoice.substring(0, 100)}...`
          : brandVoice}
      </p>
    </div>
  );
};

export default BrandVoice;
