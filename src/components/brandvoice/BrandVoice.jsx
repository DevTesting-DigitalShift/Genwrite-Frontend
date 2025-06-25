import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaEdit, FaTimes } from "react-icons/fa"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { sendBrandVoice } from "../../store/slices/blogSlice"
import axiosInstance from "@api/index"
import * as XLSX from "xlsx"
import { Info, Upload } from "lucide-react"
import { Helmet } from "react-helmet"
import { toast } from "react-toastify"
import { Tooltip } from "antd"

const BrandVoice = () => {
  const user = useSelector((state) => state.auth.user)
  const [inputValue, setInputValue] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [brands, setBrands] = useState([])
  const [excelData, setExcelData] = useState(null)
  const [formData, setFormData] = useState({
    nameOfVoice: "",
    postLink: "",
    keywords: [],
    describeBrand: "",
    selectedVoice: null,
    uploadedFile: null,
  })

  const fetchBrands = async () => {
    try {
      const res = await axiosInstance.get("/brand")
      let brandsArr = Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
      setBrands(brandsArr)
      if (brandsArr.length > 0 && !formData.selectedVoice) {
        setFormData((prev) => ({ ...prev, selectedVoice: brandsArr[0] }))
      }
    } catch (err) {
      setBrands([])
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleEdit = (brand) => {
    setFormData({
      nameOfVoice: brand.nameOfVoice,
      postLink: brand.postLink,
      keywords: Array.isArray(brand.keywords) ? brand.keywords : [],
      describeBrand: brand.describeBrand,
      selectedVoice: brand,
      sitemap: brand.sitemap, // use textArea for this & key is sitemap
      uploadedFile: null,
      _id: brand._id,
    })
  }

  // Save (update or create) brand voice
  const handleSave = async () => {
    try {
      setIsUploading(true)
      const payload = {
        nameOfVoice: formData.nameOfVoice?.trim(),
        postLink: formData.postLink?.trim(),
        keywords: Array.isArray(formData.keywords)
          ? formData.keywords.map((k) => String(k).trim()).filter(Boolean)
          : [],
        describeBrand: formData.describeBrand?.trim(),
        userId: user?._id, // send userId to backend
        xslData: excelData,
      }
      if (!payload.nameOfVoice || !payload.postLink || !payload.describeBrand) {
        setIsUploading(false)
        toast.error("All fields are required.")
        return
      }
      try {
        new URL(payload.postLink)
      } catch {
        setIsUploading(false)
        toast.error("Please enter a valid URL for the post link.")
        return
      }
      let res
      if (formData._id) {
        // Update existing brand
        res = await axiosInstance.put(`/brand/${formData._id}`, payload)
      } else {
        // Create new brand
        res = await axiosInstance.post("/brand/addBrand", payload)
      }
      setIsUploading(false)
      fetchBrands()
      setFormData({
        nameOfVoice: "",
        postLink: "",
        keywords: [],
        describeBrand: "",
        selectedVoice: null,
        uploadedFile: null,
        _id: undefined,
      })
    } catch (err) {
      setIsUploading(false)
      toast.error(
        err?.response?.data?.details?.errors[0]?.msg ||
          "Failed to save brand voice. Please check your input."
      )
    }
  }

  // Delete brand voice
  const handleDelete = async (brand) => {
    try {
      await axiosInstance.delete(`/brand/${brand._id}`)
      fetchBrands()
      if (formData.selectedVoice && formData.selectedVoice._id === brand._id) {
        setFormData((prev) => ({ ...prev, selectedVoice: null }))
      }
    } catch (err) {
      toast.error("Failed to delete brand voice.")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelect = (voice) => {
    setFormData((prev) => ({
      ...prev,
      selectedVoice: voice,
    }))
  }

  // CSV upload for keywords (only .csv, works on mobile/desktop)
  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file && file.type === "text/csv") {
      const reader = new FileReader()
      reader.onload = (e) => {
        // Parse CSV: split by comma, newline, or semicolon
        const text = e.target.result
        let keywords = text
          .split(/,|\n|;/)
          .map((kw) => kw.trim())
          .filter((kw) => kw.length > 0)
        setFormData((prev) => ({
          ...prev,
          uploadedFile: file.name,
          keywords: Array.from(new Set([...prev.keywords, ...keywords])),
        }))
      }
      reader.readAsText(file)
    } else {
      // Optionally show error: only CSV allowed
      toast.error("Please upload a CSV file")
    }
  }

  const handleSiteFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (event) => {
      const data = event.target?.result
      const workbook = XLSX.read(data, { type: "binary" })

      const firstSheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheetName]

      // Convert sheet to JSON
      const json = XLSX.utils.sheet_to_json(sheet)

      // Convert to string to send in payload
      const jsonString = JSON.stringify(json)
      setExcelData(jsonString) // Save for payload
    }

    reader.onerror = (error) => {
      console.error("Error reading Excel file:", error)
    }

    reader.readAsBinaryString(file)
  }

  const handleRemoveFile = (fileName) => {
    setFormData({
      ...formData,
      uploadedFile: null,
      keywords: formData.keywords.filter((keyword) => keyword !== fileName),
    })
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && inputValue.trim()) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, inputValue.trim()],
      })
      setInputValue("")
    }
  }

  const handleRemoveKeyword = (keyword) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    })
  }

  const renderKeywords = () => {
    const latestKeywords = formData.keywords.slice(-3)
    const remainingCount = formData.keywords.length - latestKeywords.length

    return (
      <>
        {remainingCount > 0 && (
          <motion.div
            className="flex items-center bg-indigo-100 text-indigo-700 rounded-md px-2 py-1 mr-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <span className="text-sm">{`+${remainingCount}`}</span>
          </motion.div>
        )}
        {latestKeywords.map((keyword, index) => (
          <motion.div
            key={index}
            className="flex items-center bg-indigo-100 text-indigo-700 rounded-md px-2 py-1 mr-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm">{keyword}</span>
            <FaTimes
              className="ml-1 cursor-pointer text-indigo-500 hover:text-indigo-700 transition-colors"
              onClick={() => handleRemoveKeyword(keyword)}
            />
          </motion.div>
        ))}
      </>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-8 justify-around p-6"
    >
      <Helmet>
        <title>Brand Voice | GenWrite</title>
      </Helmet>
      {/* Left Section */}
      <motion.div
        className="w-[60%] bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        initial={{ x: -20 }}
        animate={{ x: 0 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Let’s create your Brand Voice
        </h1>
        <p className="text-gray-500 mb-6">
          Prototype group pixel duplicate ellipse hand draft style rotate. Layout follower scale
          comment flows draft select.
        </p>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Name of Voice</label>
            <motion.input
              type="text"
              name="nameOfVoice"
              value={formData.nameOfVoice}
              onChange={handleInputChange}
              placeholder="e.g., How to get?"
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              whileFocus={{ scale: 1.01 }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Paste link of your post or blog <span className="text-red-500">*</span>
            </label>
            <motion.input
              type="text"
              name="postLink"
              value={formData.postLink}
              onChange={handleInputChange}
              placeholder="e.g., How to get?"
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              whileFocus={{ scale: 1.01 }}
            />
          </div>

          <div className="text-center my-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-gray-500">OR</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex gap-2 ">
              Keywords <span className="text-red-500">*</span>
              <Tooltip title="Upload a .csv file in the format: `S.No., Keyword`">
                <div className="cursor-pointer">
                  <Info size={16} className="text-blue-500" />
                </div>
              </Tooltip>
            </label>
            <motion.div
              className="flex items-center bg-white border border-gray-300 rounded-lg p-2 flex-wrap gap-2"
              whileHover={{ boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.2)" }}
            >
              {renderKeywords()}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow p-2 bg-white border-none outline-none rounded-l-md"
                placeholder="e.g., Fun"
              />
              <label htmlFor="file-upload" className="flex items-center cursor-pointer">
                <motion.div
                  className="bg-indigo-100 p-2 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload size={20} />
                  {/* <img src="./Images/upload.png" alt="Upload" className="size-4" /> */}
                </motion.div>
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".csv"
              />
            </motion.div>
          </div>

          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Upload Site Map (Excel) <span className="text-red-500">*</span>
            </label>
            <motion.label
              htmlFor="file-site-upload"
              className="flex items-center cursor-pointer justify-between bg-white border border-gray-300 rounded-lg p-2 gap-2 hover:ring-2 hover:ring-indigo-300 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div>
                <span className="text-gray-700">Choose .xls or .xlsx file</span>
                <input
                  id="file-site-upload"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleSiteFileChange}
                  className="hidden"
                />
              </div>
              <motion.div
                className="bg-indigo-100 p-2 rounded-lg cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload size={20} />
              </motion.div>
            </motion.label>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Describe your Brand
            </label>
            <motion.textarea
              name="describeBrand"
              value={formData.describeBrand}
              onChange={handleInputChange}
              placeholder="Write a blog on how to cook pasta"
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="4"
              whileFocus={{ scale: 1.01 }}
            />
          </div>

          <div className="text-right">
            <motion.button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              onClick={handleSave}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Save Brand Voice
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="h-auto w-px bg-gray-200 mx-2"></div>

      {/* Right Section */}
      <motion.div
        className="flex-1 bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        initial={{ x: 20 }}
        animate={{ x: 0 }}
      >
        <h1 className="text-xl font-bold text-gray-800 mb-4">Your Brand Voices</h1>
        <div className="mb-8 space-y-4 overflow-y-auto p-2">
          {brands.length > 0 ? (
            brands.map((item) => (
              <YourVoicesComponent
                key={item._id}
                id={item._id}
                brandName={item.nameOfVoice}
                brandVoice={item.describeBrand}
                onSelect={() => handleSelect(item)}
                isSelected={formData.selectedVoice?._id === item._id}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            ))
          ) : (
            <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center text-gray-500">
              No brand voices created yet.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Update YourVoicesComponent to accept onEdit and onDelete
const YourVoicesComponent = ({
  id,
  brandName,
  brandVoice,
  onSelect,
  isSelected,
  onEdit,
  onDelete,
}) => {
  return (
    <motion.div
      className={`p-4 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? "bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300 shadow-md"
          : "bg-white border border-gray-200 hover:border-indigo-300"
      }`}
      onClick={onSelect}
      whileHover={{
        y: -3,
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)",
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-center">
        <h1 className={`font-medium ${isSelected ? "text-indigo-700" : "text-gray-700"}`}>
          {brandName}
        </h1>
        <div className="flex space-x-2">
          <motion.button
            className="text-indigo-500 hover:text-indigo-700"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
          >
            <FaEdit />
          </motion.button>
          <motion.button
            className="text-gray-500 hover:text-red-500"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
          >
            <img src="/Images/trash.png" alt="Delete" className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {brandVoice.length > 100 ? `${brandVoice.substring(0, 100)}...` : brandVoice}
      </p>
    </motion.div>
  )
}

export default BrandVoice
