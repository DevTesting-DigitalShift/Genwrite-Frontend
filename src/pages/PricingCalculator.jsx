import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Slider,
  Checkbox,
  Radio,
  Card,
  Button,
  Divider,
  Space,
  Typography,
  InputNumber,
  Switch,
} from "antd"
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
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [imageType, setImageType] = useState("stock")
  const [imageCount, setImageCount] = useState(3)
  const [aiModel, setAiModel] = useState("gemini")
  const [totalCost, setTotalCost] = useState(0)
  const [prevCost, setPrevCost] = useState(0)
  const [includeImages, setIncludeImages] = useState(true)

  // Feature icons mapping
  const featureIcons = {
    brandVoice: <BulbOutlined />,
    competitorResearch: <SearchOutlined />,
    keywordResearch: <SearchOutlined />,
    internalLinking: <LinkOutlined />,
    faqGeneration: <QuestionCircleOutlined />,
    automaticPosting: <RobotOutlined />,
  }

  // Calculate total cost using the computeCost function
  useEffect(() => {
    const cost = computeCost({
      wordCount,
      features: selectedFeatures,
      aiModel,
      includeImages,
      imageSource: includeImages ? imageType : null,
      numberOfImages: includeImages && imageType === "upload" ? imageCount : 0,
    })

    setPrevCost(totalCost)
    setTotalCost(cost)
  }, [wordCount, selectedFeatures, imageType, imageCount, aiModel, includeImages])

  // Feature options
  const featureOptions = Object.keys(pricingConfig.features).map(key => ({
    label: (
      <div className="flex items-center gap-2">
        <span className="text-lg">{featureIcons[key]}</span>
        <span>{pricingConfig.features[key].label}</span>
        <span className="text-xs text-gray-500 ml-auto">
          +{pricingConfig.features[key].cost} credits
        </span>
      </div>
    ),
    value: key,
  }))

  return (
    <>
      <Helmet>
        <title>Pricing Calculator | GenWrite</title>
        <meta
          name="description"
          content="Calculate the cost of your blog content with GenWrite's interactive pricing calculator"
        />
      </Helmet>

      <div
        className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <Title
              level={1}
              className="!text-white !text-4xl sm:!text-5xl !font-bold !mb-4"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              AI Content Pricing Calculator
            </Title>
            <Paragraph className="!text-white/90 !text-lg sm:!text-xl !max-w-2xl !mx-auto">
              Estimate the cost of your blog content with our transparent pricing. Customize your
              requirements and see real-time pricing.
            </Paragraph>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Controls */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4 lg:space-y-6">
              {/* Word Count Section */}
              <Card
                className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Space direction="vertical" className="w-full" size="large">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                        }}
                      >
                        <FileTextOutlined />
                      </div>
                      <div>
                        <Title level={4} className="!mb-0">
                          Word Count
                        </Title>
                        <Text type="secondary" className="text-sm">
                          Base: {pricingConfig.wordCount.cost} credits per{" "}
                          {pricingConfig.wordCount.base} words
                        </Text>
                      </div>
                    </div>

                    <div className="px-2">
                      <Slider
                        min={500}
                        max={5000}
                        step={100}
                        value={wordCount}
                        onChange={setWordCount}
                        tooltip={{
                          formatter: value => `${value} words`,
                        }}
                        styles={{
                          track: {
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          },
                          rail: {
                            background: "#e5e7eb",
                          },
                        }}
                      />
                      <div className="flex justify-between mt-2">
                        <Text type="secondary">500 words</Text>
                        <motion.div
                          key={wordCount}
                          initial={{ scale: 1.2, color: "#667eea" }}
                          animate={{ scale: 1, color: "#000" }}
                          transition={{ duration: 0.3 }}
                        >
                          <Text strong className="text-lg">
                            {wordCount.toLocaleString()} words
                          </Text>
                        </motion.div>
                        <Text type="secondary">5,000 words</Text>
                      </div>
                    </div>
                  </Space>
                </motion.div>
              </Card>

              {/* Features Section */}
              <Card
                className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <Space direction="vertical" className="w-full" size="large">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                        color: "white",
                      }}
                    >
                      <ThunderboltOutlined />
                    </div>
                    <div>
                      <Title level={4} className="!mb-0">
                        Advanced Features
                      </Title>
                      <Text type="secondary" className="text-sm">
                        Select features to enhance your content
                      </Text>
                    </div>
                  </div>

                  <Checkbox.Group
                    value={selectedFeatures}
                    onChange={setSelectedFeatures}
                    className="w-full"
                  >
                    <div className="grid sm:grid-cols-2 mx-auto gap-4">
                      {featureOptions.map((option, index) => (
                        <motion.div
                          key={option.value}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Checkbox
                            value={option.value}
                            className="w-full p-3 rounded-lg border border-gray-200 hover:border-purple-400 transition-all duration-200"
                            style={{
                              background: selectedFeatures.includes(option.value)
                                ? "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)"
                                : "white",
                            }}
                          >
                            {option.label}
                          </Checkbox>
                        </motion.div>
                      ))}
                    </div>
                  </Checkbox.Group>
                </Space>
              </Card>

              {/* Image Options Section */}
              <Card
                className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <Space direction="vertical" className="w-full" size="large">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{
                          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                          color: "white",
                        }}
                      >
                        <PictureOutlined />
                      </div>
                      <div>
                        <Title level={4} className="!mb-0">
                          Image Options
                        </Title>
                        <Text type="secondary" className="text-sm">
                          Choose how to add images to your content
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Text type="secondary" className="text-sm">
                        {includeImages ? "Enabled" : "Disabled"}
                      </Text>
                      <Switch
                        checked={includeImages}
                        onChange={setIncludeImages}
                        style={{
                          background: includeImages
                            ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                            : undefined,
                        }}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {includeImages && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Radio.Group
                          value={imageType}
                          onChange={e => setImageType(e.target.value)}
                          className="w-full"
                        >
                          <div className="grid sm:grid-cols-3 gap-3">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Radio.Button
                                value="stock"
                                className="w-full h-auto p-4 rounded-lg text-center"
                                style={{
                                  background:
                                    imageType === "stock"
                                      ? "linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)"
                                      : "white",
                                  border:
                                    imageType === "stock"
                                      ? "2px solid #4facfe"
                                      : "1px solid #d9d9d9",
                                }}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <PictureOutlined className="text-2xl" />
                                  <div>
                                    <div className="font-semibold">Stock Images</div>
                                    <div className="text-xs text-gray-500">
                                      +{pricingConfig.images.stock.featureFee} credits
                                    </div>
                                  </div>
                                </div>
                              </Radio.Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Radio.Button
                                value="ai"
                                className="w-full h-auto p-4 rounded-lg text-center"
                                style={{
                                  background:
                                    imageType === "ai"
                                      ? "linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)"
                                      : "white",
                                  border:
                                    imageType === "ai" ? "2px solid #4facfe" : "1px solid #d9d9d9",
                                }}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <RobotOutlined className="text-2xl" />
                                  <div>
                                    <div className="font-semibold">AI Generated</div>
                                    <div className="text-xs text-gray-500">
                                      +{pricingConfig.images.ai.featureFee} credits
                                    </div>
                                  </div>
                                </div>
                              </Radio.Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Radio.Button
                                value="upload"
                                className="w-full h-auto p-4 rounded-lg text-center"
                                style={{
                                  background:
                                    imageType === "upload"
                                      ? "linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)"
                                      : "white",
                                  border:
                                    imageType === "upload"
                                      ? "2px solid #4facfe"
                                      : "1px solid #d9d9d9",
                                }}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <CloudUploadOutlined className="text-2xl" />
                                  <div>
                                    <div className="font-semibold">Upload</div>
                                    <div className="text-xs text-gray-500">
                                      +{pricingConfig.images.upload.perImageFee} credits/image
                                    </div>
                                  </div>
                                </div>
                              </Radio.Button>
                            </motion.div>
                          </div>
                        </Radio.Group>

                        <AnimatePresence>
                          {imageType === "upload" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="pt-4 border-t"
                            >
                              <Text className="block mb-2">Number of Images: {imageCount}</Text>
                              <Slider
                                min={1}
                                max={15}
                                value={imageCount}
                                onChange={setImageCount}
                                marks={{ 1: "1", 5: "5", 10: "10", 15: "15" }}
                                styles={{
                                  track: {
                                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                  },
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Space>
              </Card>

              {/* AI Model Section */}
              <Card
                className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <Space direction="vertical" className="w-full" size="large">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                        color: "white",
                      }}
                    >
                      <RobotOutlined />
                    </div>
                    <div>
                      <Title level={4} className="!mb-0">
                        AI Model Selection
                      </Title>
                      <Text type="secondary" className="text-sm">
                        Choose your preferred AI model
                      </Text>
                    </div>
                  </div>

                  <Radio.Group
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                    className="w-full"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.keys(pricingConfig.aiModels).map(modelKey => {
                        const model = pricingConfig.aiModels[modelKey]
                        return (
                          <motion.div
                            key={modelKey}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Radio.Button
                              value={modelKey}
                              className="w-full h-auto p-4 rounded-lg text-center"
                              style={{
                                background:
                                  aiModel === modelKey
                                    ? "linear-gradient(135deg, rgba(250, 112, 154, 0.2) 0%, rgba(254, 225, 64, 0.2) 100%)"
                                    : "white",
                                border:
                                  aiModel === modelKey ? "2px solid #fa709a" : "1px solid #d9d9d9",
                              }}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <img
                                  src={`/Images/${modelKey}.png`}
                                  alt={model.label}
                                  className="w-12 h-12 object-contain"
                                />
                                <div className="font-semibold text-base">{model.label}</div>
                                <div className="text-xs text-gray-500">
                                  {model.costMultiplier}x multiplier (word cost only)
                                </div>
                              </div>
                            </Radio.Button>
                          </motion.div>
                        )
                      })}
                    </div>
                  </Radio.Group>
                </Space>
              </Card>
            </motion.div>

            {/* Right Column - Cost Summary (Sticky on desktop) */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="lg:sticky lg:top-8">
                <Card
                  className="overflow-hidden shadow-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.98)",
                    backdropFilter: "blur(20px)",
                    borderRadius: "20px",
                    border: "2px solid rgba(255, 255, 255, 0.5)",
                  }}
                >
                  <Space direction="vertical" className="w-full" size="large">
                    <div className="text-center">
                      <Text type="secondary" className="uppercase text-xs tracking-wider">
                        Estimated Cost
                      </Text>
                      <motion.div
                        key={totalCost}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <Title
                          level={1}
                          className="!mb-0 !mt-2"
                          style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontSize: "3.5rem",
                          }}
                        >
                          {totalCost.toLocaleString()}
                        </Title>
                      </motion.div>
                      <Text type="secondary" className="text-sm">
                        credits
                      </Text>
                    </div>

                    <Divider className="!my-2" />

                    {/* Cost Breakdown */}
                    <div className="space-y-3">
                      <Text strong className="block text-sm uppercase tracking-wide text-gray-600">
                        Cost Breakdown
                      </Text>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${wordCount}-${selectedFeatures.length}-${imageType}-${imageCount}-${aiModel}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2"
                        >
                          {/* Base Word Count */}
                          <div className="flex justify-between items-center text-sm">
                            <Text type="secondary">
                              {wordCount} words (
                              {Math.ceil(wordCount / pricingConfig.wordCount.base)} ×{" "}
                              {pricingConfig.wordCount.cost})
                            </Text>
                            <Text strong>
                              {Math.ceil(wordCount / pricingConfig.wordCount.base) *
                                pricingConfig.wordCount.cost}
                            </Text>
                          </div>

                          {/* Selected Features */}
                          {selectedFeatures.map(feature => (
                            <motion.div
                              key={feature}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex justify-between items-center text-sm"
                            >
                              <Text type="secondary" className="flex items-center gap-2">
                                <CheckCircleOutlined className="text-green-500" />
                                {pricingConfig.features[feature].label}
                              </Text>
                              <Text strong>+{pricingConfig.features[feature].cost}</Text>
                            </motion.div>
                          ))}

                          {/* Image Cost */}
                          {includeImages && (
                            <div className="flex justify-between items-center text-sm">
                              <Text type="secondary">
                                {imageType === "stock"
                                  ? "Stock Images"
                                  : imageType === "ai"
                                  ? "AI Images"
                                  : `Upload (${imageCount} images)`}
                              </Text>
                              <Text strong>
                                +
                                {imageType === "stock"
                                  ? pricingConfig.images.stock.featureFee
                                  : imageType === "ai"
                                  ? pricingConfig.images.ai.featureFee
                                  : pricingConfig.images.upload.perImageFee * imageCount}
                              </Text>
                            </div>
                          )}

                          {/* AI Model Multiplier */}
                          {pricingConfig.aiModels[aiModel].costMultiplier > 1 && (
                            <div className="flex justify-between items-center text-sm pt-2 border-t">
                              <Text type="secondary">
                                {pricingConfig.aiModels[aiModel].label} (
                                {pricingConfig.aiModels[aiModel].costMultiplier}x on word cost)
                              </Text>
                              <Text strong className="text-purple-600">
                                Multiplier Applied
                              </Text>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <Divider className="!my-2" />

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="primary"
                        size="large"
                        block
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        onClick={() => navigate("/signup")}
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                          height: "56px",
                          fontSize: "16px",
                          fontWeight: 600,
                          borderRadius: "12px",
                          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                        }}
                      >
                        Get Started
                      </Button>
                    </motion.div>

                    <Text type="secondary" className="text-xs text-center block">
                      No credit card required to start
                    </Text>
                  </Space>
                </Card>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default PricingCalculator
