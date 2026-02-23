import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  Lightbulb,
  Search,
  Link as LinkIcon,
  HelpCircle,
  Bot,
  Image as ImageIcon,
  Upload,
  Zap,
  CheckCircle,
  ArrowRight,
  Minus,
  Rocket,
  Plus,
} from "lucide-react"
import { pricingConfig, computeCost } from "@/data/pricingConfig"
import { Helmet } from "react-helmet"
import { useNavigate } from "react-router-dom"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } },
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
    { key: "none", label: "None", icon: <Minus className="size-5" />, cost: 0 },
    {
      key: "stock",
      label: "Stock",
      icon: <ImageIcon className="size-5" />,
      cost: pricingConfig.images.stock.featureFee,
    },
    {
      key: "ai",
      label: "AI",
      icon: <Bot className="size-5" />,
      cost: pricingConfig.images.ai.featureFee,
    },
    { key: "upload", label: "Upload", icon: <Upload className="size-5" />, cost: null },
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
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-12 mb-32">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <div className="text-center mb-16">
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
              Interactive{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                Cost Estimator
              </span>
            </h1>
            <p className="text-gray-500 font-bold text-md max-w-2xl mx-auto">
              Precise credit calculation for your generating needs. Toggle features and models in
              real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* LEFT SIDE - Options */}
            <div className="xl:col-span-8 space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* 1. WORD COUNT */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
                      1
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Target Word Count</h2>
                      <p className="text-gray-400 font-bold text-sm tracking-wide">
                        Base chunk: {pricingConfig.wordCount.base} words
                      </p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <motion.div
                      key={wordCountNum}
                      initial={{ scale: 1.05, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center p-10 bg-linear-to-br from-blue-50/50 to-indigo-50/50 rounded-xl border-2 border-dashed border-blue-200"
                    >
                      <p className="text-7xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600 tracking-tighter">
                        {wordCountNum.toLocaleString()}
                      </p>
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest mt-3">
                        Words per article
                      </p>
                    </motion.div>

                    <div className="px-4">
                      <input
                        type="range"
                        min="500"
                        max="5000"
                        step="100"
                        value={wordCount}
                        onChange={e => setWordCount(parseInt(e.target.value))}
                        className="range range-primary h-3 rounded-full"
                      />
                      <div className="flex justify-between mt-4 px-2">
                        <span className="text-xs font-black text-gray-400">500</span>
                        <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                          {wordCount} Words
                        </span>
                        <span className="text-xs font-black text-gray-400">5,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-gray-100 to-transparent my-12"></div>

                {/* 2. FEATURES */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 font-black text-xl">
                      2
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Power Add-ons</h2>
                      <p className="text-gray-400 font-bold text-sm tracking-wide">
                        Enhance your generation depth
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {Object.entries(pricingConfig.features).map(([key, cfg]) => (
                      <div
                        key={key}
                        onClick={() => toggleFeature(key)}
                        className={`group p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedFeatures[key]
                            ? "bg-purple-50 border-purple-500 shadow-lg shadow-purple-100"
                            : "bg-white border-gray-50 hover:border-purple-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`transition-colors font-black ${selectedFeatures[key] ? "text-purple-700" : "text-gray-700"}`}
                          >
                            {cfg.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedFeatures[key]}
                            readOnly
                            className="toggle toggle-primary toggle-sm"
                          />
                        </div>
                        <p
                          className={`text-xs font-black transition-colors ${selectedFeatures[key] ? "text-purple-500" : "text-gray-400"}`}
                        >
                          +{cfg.cost} CREDITS
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-gray-100 to-transparent my-12"></div>

                {/* 3. IMAGE SETTINGS */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">
                      3
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Visual Component</h2>
                      <p className="text-gray-400 font-bold text-sm tracking-wide">
                        Integrated imagery options
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imageOptions.map(opt => {
                      const isActive = imageType === opt.key
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setImageType(opt.key)}
                          className={`flex flex-col items-center justify-center p-4 gap-3 rounded-xl border-2 transition-all ${
                            isActive
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                              : "bg-white border-gray-50 hover:border-emerald-200 text-gray-500"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}
                          >
                            {opt.icon}
                          </div>
                          <span className="font-bold text-sm">{opt.label}</span>
                          {opt.cost !== null && opt.cost > 0 && (
                            <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                              +{opt.cost}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <AnimatePresence>
                    {imageType === "upload" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100"
                      >
                        <div className="flex items-center justify-between mb-8">
                          <h4 className="font-black text-emerald-800">Upload Amount</h4>
                          <span className="text-2xl font-black text-emerald-600 bg-white px-5 py-1 rounded-2xl shadow-sm">
                            {imageCount} Images
                          </span>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={imageCount}
                          onChange={e => setImageCount(parseInt(e.target.value))}
                          className="range range-accent h-3 rounded-full"
                        />
                        <div className="flex justify-between mt-4 px-2">
                          {[0, 5, 10, 15, 20].map(v => (
                            <span key={v} className="text-[10px] font-black text-emerald-400">
                              {v}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs font-bold text-emerald-600/70 mt-6 text-center">
                          Fee: {pricingConfig.images.upload.perImageFee} credits per individual
                          image
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-gray-100 to-transparent my-12"></div>

                {/* 4. AI MODEL */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-black text-xl">
                      4
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Intelligence Engine</h2>
                      <p className="text-gray-400 font-bold text-sm tracking-wide">
                        Select your primary processing model
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {Object.entries(pricingConfig.aiModels).map(([key, cfg]) => {
                      const isActive = aiModel === key
                      return (
                        <button
                          key={key}
                          onClick={() => setAiModel(key)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            isActive
                              ? "bg-orange-50 border-orange-500"
                              : "bg-white border-gray-50 hover:border-orange-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`font-black uppercase tracking-widest text-xs transition-colors ${isActive ? "text-orange-600" : "text-gray-400"}`}
                            >
                              {cfg.label}
                            </span>
                            {isActive && <CheckCircle className="size-4 text-orange-500" />}
                          </div>
                          <p
                            className={`text-lg font-black ${isActive ? "text-orange-800" : "text-gray-700"}`}
                          >
                            {cfg.costMultiplier}x Multiplier
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE (STICKY SUMMARY) */}
            <div className="xl:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="bg-linear-to-br from-gray-900 to-blue-900 rounded-xl p-10 text-white shadow-2xl shadow-blue-200 overflow-hidden relative group">

                  <h3 className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs mb-8 text-center">
                    Estimated Total Cost
                  </h3>

                  <motion.div
                    key={totalCost}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center mb-10"
                  >
                    <p className="text-8xl font-black tracking-tighter mb-2">{totalCost}</p>
                    <p className="text-blue-300 font-black tracking-widest uppercase">
                      Credits per Article
                    </p>
                  </motion.div>

                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-bold">Base Engine</span>
                      <span className="font-black text-blue-100">{baseCost}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-bold">Feature Stack</span>
                      <span className="font-black text-purple-300">{featuresCost}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-6">
                      <span className="text-gray-400 font-bold">Visual Assets</span>
                      <span className="font-black text-emerald-300">{imagesCost}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/signup")}
                    className="btn btn-primary btn-lg w-full h-16 rounded-2xl bg-white border-none text-blue-900 font-black text-xl normal-case gap-3 hover:bg-blue-50 hover:scale-[1.02] transition-all shadow-xl shadow-blue-500/20 mb-4"
                  >
                    Start Generating <Rocket className="size-6" />
                  </button>
                  <p className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-widest">
                    No credit card required for trial
                  </p>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <HelpCircle className="size-5 text-blue-600" />
                    <h4 className="font-black text-blue-900">Credit Logic</h4>
                  </div>
                  <p className="text-sm text-blue-700 font-medium leading-relaxed">
                    Calculations are based on 100-word chunks. Custom models like GPT-4 incur higher
                    multipliers due to token processing density.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default PricingCalculator
