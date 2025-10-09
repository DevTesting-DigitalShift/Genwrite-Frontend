import React, { memo, useEffect, useState } from "react"
import { Modal, Button, message } from "antd"
import Carousel from "./Carousel"
import { packages } from "@/data/templates"

const SelectTemplateModal = ({ handleNext, handleClose, data, setData, isModalVisible }) => {
  // Initialize selectedPackage based on data.template
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
  const [error, setError] = useState("")

  // Sync selectedPackage and formData.template with data.template when modal opens
  useEffect(() => {
    if (isModalVisible && data.template) {
      const index = packages.findIndex((pkg) => pkg.name === data.template.name)
      if (index !== -1) {
        setSelectedPackage(index)
        setFormData((prev) => ({
          ...prev,
          template: [data.template.name],
        }))
      }
    }
  }, [isModalVisible, data.template])

  // Reset selection when modal closes
  const handleModalClose = () => {
    setSelectedPackage(null)
    setFormData((prev) => ({
      ...prev,
      template: [],
    }))
    setError("")
    handleClose()
  }

  const handlePackageSelect = (index) => {
    setSelectedPackage(index)
    setData({ ...data, template: packages[index] })
    setFormData({
      ...formData,
      template: [packages[index].name],
    })
    setError("") // Clear error on selection
  }

  const handleNextClick = () => {
    if (selectedPackage !== null) {
      const selectedTemplate = packages[selectedPackage]
      const updatedData = { ...data, selectedTemplate }
      setData(updatedData)
      handleNext()
    } else {
      setError("Please select a template before proceeding.")
      message.error("Please select a template before proceeding.")
    }
  }

  return (
    <Modal
      title="Step 1: Select Template"
      open={isModalVisible}
      onCancel={handleModalClose}
      footer={
        <div className="flex justify-end w-full gap-2">
          <Button
            onClick={handleNextClick}
            className="px-4 sm:px-6 py-2 bg-[#1B6FC9] text-white rounded-lg hover:bg-[#1B6FC9]/90 ml-2 sm:ml-3 text-sm sm:text-base"
          >
            Next
          </Button>
        </div>
      }
      centered
      width="90vw"
      styles={{
        content: { maxWidth: "800px", margin: "0 auto" },
        body: { padding: "16px" },
      }}
      className="rounded-lg sm:rounded-xl"
      transitionName=""
      maskTransitionName=""
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Mobile View: Vertical Scrolling Layout */}
        <div
          className={`sm:hidden grid grid-cols-2 gap-4 ${
            error ? "border-2 border-red-500 rounded-lg p-2" : ""
          }`}
        >
          {packages.map((pkg, index) => (
            <div
              key={index}
              className={`cursor-pointer transition-all duration-200 ${
                selectedPackage === index ? "border-gray-200 border-2 rounded-lg" : ""
              }`}
              onClick={() => handlePackageSelect(index)}
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="relative">
                  <img
                    src={pkg.imgSrc || "/placeholder.svg"}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        {/* Desktop View: Carousel Layout */}
        <div className={`hidden sm:block ${error ? "border-2 border-red-500 rounded-lg p-2" : ""}`}>
          <Carousel className="flex flex-row gap-4">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`cursor-pointer transition-all duration-200 w-full h-full ${
                  selectedPackage === index ? "border-gray-200 border-2 rounded-lg" : ""
                }`}
                onClick={() => handlePackageSelect(index)}
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="relative">
                    <img
                      src={pkg.imgSrc || "/placeholder.svg"}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </Modal>
  )
}

export default memo(SelectTemplateModal)
