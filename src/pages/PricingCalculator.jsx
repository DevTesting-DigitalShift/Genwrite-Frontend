import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Slider, Radio, Card, Button, Divider, Space, Typography, Switch } from "antd"
import {
  FileTextOutlined,
  BulbOutlined,
  SearchOutlined,
  LinkOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  PictureOutlined,
  CloudUploadOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  MinusOutlined,
  RocketOutlined,
} from "@ant-design/icons"
import { pricingConfig, computeCost } from "@/data/pricingConfig"
import { Helmet } from "react-helmet"
import { useNavigate } from "react-router-dom"

const { Title, Text, Paragraph } = Typography

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
}

const PricingCalculator = () => {
  const navigate = useNavigate()

  // State management
  const [wordCount, setWordCount] = useState(1000)
  const [selectedFeatures, setSelectedFeatures] = useState({
    brandVoice: false,
    competitorResearch: false,
    keywordResearch: false,
    internalLinking: false,
    faqGeneration: false,
    automaticPosting: false,
  })
  const [imageType, setImageType] = useState("none")
  const [imageCount, setImageCount] = useState(0)
  const [aiModel, setAiModel] = useState("gemini")
  const [totalCost, setTotalCost] = useState(0)

  // Calculate total cost
  useEffect(() => {
    const includeImages = imageType !== "none"
    const featuresArray = Object.keys(selectedFeatures).filter(key => selectedFeatures[key])

    const cost = computeCost({
      wordCount,
      features: featuresArray,
      aiModel,
      includeImages,
      imageSource: includeImages ? imageType : null,
      numberOfImages: includeImages && imageType === "upload" ? imageCount : 0,
    })

    setTotalCost(cost)
  }, [wordCount, selectedFeatures, imageType, imageCount, aiModel])

  const toggleFeature = key => {
    setSelectedFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Calculate breakdown values
  const wordCountNum = wordCount
  const rawBaseCost =
    Math.ceil(wordCountNum / pricingConfig.wordCount.base) * pricingConfig.wordCount.cost
  const modelMultiplier = pricingConfig.aiModels[aiModel]?.costMultiplier || 1
  const baseCost = Math.round(rawBaseCost * modelMultiplier)

  const featuresCost = Object.keys(pricingConfig.features).reduce(
    (acc, key) => acc + (selectedFeatures[key] ? pricingConfig.features[key].cost : 0),
    0
  )

  const imagesCost =
    imageType === "stock"
      ? pricingConfig.images.stock.featureFee
      : imageType === "ai"
      ? pricingConfig.images.ai.featureFee
      : imageType === "upload"
      ? imageCount * pricingConfig.images.upload.perImageFee
      : 0

  const imageOptions = [
    { key: "none", label: "None", icon: <MinusOutlined />, cost: 0 },
    {
      key: "stock",
      label: "Stock",
      icon: <PictureOutlined />,
      cost: pricingConfig.images.stock.featureFee,
    },
    { key: "ai", label: "AI", icon: <RobotOutlined />, cost: pricingConfig.images.ai.featureFee },
    { key: "upload", label: "Upload", icon: <CloudUploadOutlined />, cost: null },
  ]

  return (
    <>
      <Helmet>
        <title>Pricing Calculator | GenWrite</title>
        <meta
          name="description"
          content="Calculate the cost of your blog content with GenWrite's interactive pricing calculator"
        />
      </Helmet>

      {/* Main Calculator */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-20">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT SIDE */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-gray-100 shadow-sm rounded-2xl">
                <Title level={4} className="!mb-6 !text-lg">
                  Content Settings
                </Title>

                {/* WORD COUNT */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 text-base rounded-full bg-slate-100 font-semibold">
                      1
                    </span>
                    <div>
                      <Text strong className="text-base">
                        Target Word Count
                      </Text>
                      <br />
                      <Text className="text-xs text-slate-500">
                        Base chunk: {pricingConfig.wordCount.base} words
                      </Text>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Large Word Count Display */}
                    <motion.div
                      key={wordCountNum}
                      initial={{ scale: 1.1, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-center py-6 px-6 bg-gradient-to-r from-purple-50 to-sky-50 rounded-xl border border-purple-200"
                    >
                      <p className="text-5xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-sky-600">
                        {wordCountNum.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">words</p>
                    </motion.div>

                    {/* Slider */}
                    <div className="px-2">
                      <Slider
                        min={500}
                        max={5000}
                        step={100}
                        value={wordCount}
                        onChange={setWordCount}
                        tooltip={{ formatter: value => `${value} words` }}
                        styles={{
                          track: {
                            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                          },
                          rail: { background: "#e5e7eb" },
                        }}
                      />
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>500</span>
                        <span>5,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider className="!my-6 !border-gray-100" />

                {/* FEATURES */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 text-base rounded-full bg-purple-100 font-semibold">
                      2
                    </span>
                    <div>
                      <Text strong className="text-base">
                        Additional Features
                      </Text>
                      <br />
                      <Text className="text-xs text-slate-500">Select helpful add-ons</Text>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(pricingConfig.features).map(([key, cfg]) => (
                      <div
                        key={key}
                        className="p-4 rounded-xl border border-gray-200 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Text strong className="text-base text-slate-700">
                            {cfg.label}
                          </Text>
                          <Switch
                            size="small"
                            checked={selectedFeatures[key]}
                            onChange={() => toggleFeature(key)}
                          />
                        </div>
                        <Text className="text-xs text-slate-600">+{cfg.cost} credits</Text>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider className="!my-6 !border-gray-100" />

                {/* IMAGE SETTINGS */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 text-base rounded-full bg-green-100 font-semibold">
                      3
                    </span>
                    <div>
                      <Text strong className="text-base">
                        Image Settings
                      </Text>
                      <br />
                      <Text className="text-xs text-slate-500">
                        Choose stock, AI-generated or upload your images
                      </Text>
                    </div>
                  </div>

                  <Radio.Group
                    value={imageType}
                    onChange={e => setImageType(e.target.value)}
                    className="w-full"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {imageOptions.map(opt => {
                        const isActive = imageType === opt.key
                        return (
                          <Radio.Button
                            key={opt.key}
                            value={opt.key}
                            className={`!h-auto !p-4 !rounded-xl !text-center border ${
                              isActive ? "!bg-purple-50" : "!bg-white border-gray-200"
                            }`}
                            style={{
                              border: isActive ? "2px solid #a855f7" : "1px solid #e2e8f0",
                            }}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-base ${
                                      isActive ? "text-purple-700" : "text-slate-600"
                                    }`}
                                  >
                                    {opt.icon}
                                  </span>
                                  <span
                                    className={`font-medium text-base ${
                                      isActive ? "text-purple-700" : "text-slate-700"
                                    }`}
                                  >
                                    {opt.label}
                                  </span>
                                </div>
                                {opt.cost !== null && (
                                  <span
                                    className={`text-xs ${
                                      isActive ? "text-purple-700" : "text-slate-500"
                                    }`}
                                  >
                                    +{opt.cost}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Radio.Button>
                        )
                      })}
                    </div>
                  </Radio.Group>

                  <AnimatePresence>
                    {imageType === "upload" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <div className="flex gap-5 items-center mb-3">
                          <Text className="text-sm semi-bold">Number of Images to Upload</Text>
                          <Text className="text-lg font-semibold text-purple-700">
                            {imageCount}
                          </Text>
                        </div>

                        <Slider
                          min={0}
                          max={20}
                          step={1}
                          value={imageCount}
                          onChange={setImageCount}
                          styles={{
                            track: {
                              background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                            },
                          }}
                        />

                        <div className="flex justify-between mt-2 px-1">
                          {[0, 5, 10, 15, 20].map(val => (
                            <span
                              key={val}
                              className={`text-xs font-medium ${
                                imageCount === val ? "text-purple-600" : "text-slate-400"
                              }`}
                            >
                              {val}
                            </span>
                          ))}
                        </div>

                        <Text className="text-xs text-slate-500 mt-2 block">
                          Upload fee: {pricingConfig.images.upload.perImageFee} credits / image
                        </Text>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Divider className="!my-6 !border-gray-100" />

                {/* AI MODEL */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 text-base rounded-full bg-orange-100 font-semibold">
                      4
                    </span>
                    <div>
                      <Text strong className="text-base">
                        AI Model
                      </Text>
                      <br />
                      <Text className="text-xs text-slate-500">Choose model cost</Text>
                    </div>
                  </div>

                  <Radio.Group
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                    className="w-full"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(pricingConfig.aiModels).map(([key, cfg]) => {
                        const isActive = aiModel === key
                        return (
                          <Radio.Button
                            key={key}
                            value={key}
                            className={`!h-auto !p-4 !rounded-xl border ${
                              isActive ? "!bg-purple-50" : "!bg-white border-gray-100"
                            }`}
                            style={{
                              border: isActive ? "2px solid #a855f7" : "1px solid #e2e8f0",
                            }}
                          >
                            <div className="flex items-center justify-between w-full">
                              <Text
                                strong
                                className={`text-base ${
                                  isActive ? "text-purple-700" : "text-slate-700"
                                }`}
                              >
                                {cfg.label}
                              </Text>
                              <Text
                                className={`text-xs ${
                                  isActive ? "text-purple-700" : "text-slate-500"
                                }`}
                              >
                                {cfg.costMultiplier}x
                              </Text>
                            </div>
                          </Radio.Button>
                        )
                      })}
                    </div>
                  </Radio.Group>
                </div>
              </Card>
            </div>

            {/* RIGHT SIDE (STICKY SUMMARY) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="border border-gray-100 shadow-sm rounded-2xl text-center">
                  <Text className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                    Estimated Cost
                  </Text>

                  {/* BIG CENTERED CREDITS */}
                  <motion.div
                    key={totalCost}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="my-6"
                  >
                    <p className="text-7xl font-semibold text-sky-600 tracking-tight">
                      {totalCost}
                    </p>
                    <p className="text-lg text-slate-500 tracking-wider mt-2">credits</p>
                  </motion.div>

                  <Divider className="!my-6" />

                  {/* Breakdown */}
                  <div className="space-y-4 text-left">
                    <Text
                      strong
                      className="text-xs text-slate-400 uppercase tracking-wider block mb-3"
                    >
                      Cost Breakdown
                    </Text>

                    {/* Base Cost */}
                    <motion.div
                      key={`base-${baseCost}`}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <Text strong className="text-base text-slate-700">
                            Base Cost
                          </Text>
                          <br />
                          <Text className="text-xs text-slate-500">
                            {Math.ceil(wordCountNum / pricingConfig.wordCount.base)} chunks ×{" "}
                            {pricingConfig.wordCount.cost} credits × {modelMultiplier}x (
                            {pricingConfig.aiModels[aiModel]?.label})
                          </Text>
                        </div>
                        <Text strong className="text-lg text-slate-900">
                          {baseCost}
                        </Text>
                      </div>
                    </motion.div>

                    {/* Features Cost */}
                    <motion.div
                      key={`features-${featuresCost}`}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 mr-4">
                          <Text strong className="text-base text-purple-700">
                            Features
                          </Text>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {Object.keys(pricingConfig.features).filter(k => selectedFeatures[k])
                              .length > 0 ? (
                              Object.keys(pricingConfig.features)
                                .filter(k => selectedFeatures[k])
                                .map(k => (
                                  <span
                                    key={k}
                                    className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/60 text-purple-700 border border-purple-100 shadow-sm"
                                  >
                                    {pricingConfig.features[k].label}
                                  </span>
                                ))
                            ) : (
                              <Text className="text-xs text-purple-400 italic">
                                No add-ons selected
                              </Text>
                            )}
                          </div>
                        </div>
                        <Text strong className="text-lg text-purple-900">
                          {featuresCost}
                        </Text>
                      </div>
                    </motion.div>

                    {/* Images Cost */}
                    <motion.div
                      key={`images-${imagesCost}`}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="p-3 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <Text strong className="text-base text-sky-700">
                            Images
                          </Text>
                          <br />
                          <Text className="text-xs text-sky-600">
                            {imageType === "stock" && "Stock images"}
                            {imageType === "ai" && "AI generated"}
                            {imageType === "upload" && `${imageCount} uploaded`}
                            {imageType === "none" && "None"}
                          </Text>
                        </div>
                        <Text strong className="text-lg text-sky-900">
                          {imagesCost}
                        </Text>
                      </div>
                    </motion.div>
                  </div>

                  {/* Button */}
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<RocketOutlined />}
                    onClick={() => navigate("/signup")}
                    className="!mt-6 !h-12 !text-base !font-semibold !rounded-xl"
                    style={{
                      background: "linear-gradient(to right, #a855f7, #0ea5e9)",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(168, 85, 247, 0.3)",
                    }}
                  >
                    Start Generating
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default PricingCalculator
