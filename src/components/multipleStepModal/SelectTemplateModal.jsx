import React, { memo, useState } from "react"
import { Modal, Button, message } from "antd"
import Carousel from "./Carousel"

const SelectTemplateModal = ({ handleNext, handleClose, data, setData }) => {
  const [selectedPackage, setSelectedPackage] = useState(null)
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
  })

  const packages = [
    {
      imgSrc: "./Images/Classic.png",
      name: "Classic",
      description: "Timeless elegance for your classic blog journey",
      author: "Author 1",
    },
    {
      imgSrc: "./Images/Listicle.png",
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
      imgSrc: "./Images/HowTo.png",
      name: "How to....",
      description: "Step-by-step guides for practical how-to solutions.",
      author: "Author 4",
    },
    {
      imgSrc: "./Images/NewsArticle.png",
      name: "News Article",
      description: "Latest updates and breaking news coverage.",
    },
    {
      imgSrc: "./Images/OpinionPiece.png",
      name: "Opinion Piece",
      description: "Expert insights and analytical perspectives.",
    },
    {
      imgSrc: "./Images/CaseStudy.png",
      name: "Case Study",
      description: "In-depth analysis and real-world examples.",
    },
    {
      imgSrc: "./Images/Interview.png",
      name: "Interview",
      description: "Engaging conversations with industry experts.",
    },
  ]

  const handlePackageSelect = (index) => {
    setSelectedPackage(index)
    setData({ ...data, template: packages[index] })
    setFormData({
      ...formData,
      template: [packages[index].name],
    })
  }

  const handleNextClick = () => {
    if (selectedPackage !== null) {
      const selectedTemplate = packages[selectedPackage]
      const updatedData = { ...data, selectedTemplate }
      setData(updatedData)
      handleNext()
    } else {
      message.error("Please select a template before proceeding.")
    }
  }

  return (
    <Modal
      title="Step 1: Select Template"
      open={true}
      onCancel={handleClose}
      footer={[
        <button
          key="next"
          onClick={handleNextClick}
          className="px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 ml-3"
        >
          Next
        </button>,
      ]}
      centered
      width={800}
      // bodyStyle={{ padding: "24px" }}
      transitionName=""
      maskTransitionName=""
    >
      <div>
        <div className="p-3">
          <Carousel>
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`cursor-pointer transition-all duration-200 ${
                  formData.template.includes(pkg.name) ? "border-gray-300 border-2 rounded-lg" : ""
                }`}
                onClick={() => handlePackageSelect(index)}
              >
                <div className="bg-white rounded-lg overflow-hidden">
                  <div className="relative">
                    <img
                      src={pkg.imgSrc || "/placeholder.svg"}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 mt-2">
                    <h3 className="font-medium text-gray-900 mb-1">{pkg.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </Modal>
  )
}

export default memo(SelectTemplateModal)
