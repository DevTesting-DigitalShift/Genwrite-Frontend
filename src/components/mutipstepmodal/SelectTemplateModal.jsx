import React, { memo, useState, useEffect } from "react";
import Carousel from "./Carousel";
import { toast } from "react-toastify";

const SelectTemplateModal = ({ handleNext, handleClose, data, setData }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
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

  // const handlePackageSelect = (index) => {
  //   setSelectedPackage(index);
  //   setData({ ...data, template: packages[index] });
  // };

  const handlePackageSelect = (index) => {
    setSelectedPackage(index);
    setData({ ...data, template: packages[index] });
    setFormData({
      ...formData,
      template: [packages[index].name]
    });
  };

  const handleNextClick = () => {
    if (selectedPackage !== null) {
      const selectedTemplate = packages[selectedPackage];
      const updatedData = { ...data, selectedTemplate };
      setData(updatedData);
      handleNext();
    } else {
      toast.error("Please select a template before proceeding.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className=" w-[800px] bg-white rounded-lg shadow-xl">
        <div className="flex items-center relative justify-between p-6">
          <div className="flex items-center gap-2 ">
            <h2 className="text-lg font-semibold">Select Template</h2>
            <button
              onClick={handleClose}
              className="ml-4 text-4xl absolute right-10 top-5 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-6">
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
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={handleNextClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(SelectTemplateModal);
