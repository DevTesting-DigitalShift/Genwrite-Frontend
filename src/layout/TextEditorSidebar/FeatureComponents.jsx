import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button, Tag } from "antd"
import {
  TrendingUp,
  FileText,
  Lightbulb,
  Eye,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { CrownTwoTone } from "@ant-design/icons"

const FeatureCard = ({
  title,
  description,
  isPro,
  isLoading,
  onClick,
  buttonText,
  icon: Icon,
  children,
}) => (
  <motion.div
    whileHover={{
      scale: 1.02,
      transition: { duration: 0.2 },
    }}
    className="bg-white rounded-lg shadow-sm border hover:shadow-xl border-gray-200 p-4"
  >
    <div className="flex items-start gap-3 mb-3">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {isPro && <CrownTwoTone className="text-2xl ml-auto mr-2" />}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    {children}
    <Button
      onClick={onClick}
      loading={isLoading}
      disabled={isLoading}
      type="primary"
      className="w-full py-2 text-sm px-4 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
      ghost={isPro}
    >
      {isLoading ? "Processing..." : buttonText}
    </Button>
  </motion.div>
)

const ScoreCard = ({ title, score, icon: Icon }) => {
  const getScoreColor = score => {
  const getScoreColor = score => {
    if (score >= 80) return "bg-green-100 text-green-700 border-green-200"
    if (score >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200"
    return "bg-red-100 text-red-700 border-red-200"
  }

  return (
    <div className={`p-3 rounded-lg border ${getScoreColor(score || 0)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {score > 0 && (
          <span className="text-lg font-bold">
            {Math.round(score)}
            <span className="text-xs ml-1">/100</span>
          </span>
        )}
      </div>
      {(score || 0) === 0 ? (
        <p className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded-lg">
          Run Competitive Analysis to get score
        </p>
      ) : (
        <div className="w-full bg-white/50 rounded-full h-2">
          <div
            style={{ width: `${score}%`, transition: "width 0.5s ease" }}
            className={`h-2 rounded-full ${
              score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
            }`}
          />
        </div>
      )}
    </div>
  )
}

// Simple stat card for displaying counts (word count, keywords count, etc.)
const StatCard = ({ title, value, icon: Icon, subtitle }) => {
  return (
    <div className="p-3 rounded-lg border bg-gray-50 border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-md">
            <Icon className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">{title}</span>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <span className="text-lg font-bold text-gray-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </div>
    </div>
  )
}

const CompetitorsList = ({ competitors }) => {
  const [showAll, setShowAll] = useState(false)
  const visibleCompetitors = showAll ? competitors : competitors?.slice(0, 5)

  return (
    <div className="space-y-2 relative">
      {competitors?.length > 5 && (
        <span className="absolute top-0 right-0 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
          {competitors.length}
        </span>
      )}

      {visibleCompetitors?.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1 text-gray-900 truncate">{item.title}</p>
            <a
              href={item.link || item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {item.score && <Tag color="blue">{(item.score * 100).toFixed(2)}%</Tag>}
              Visit <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      ))}

      {competitors?.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-blue-600 hover:text-blue-700 text-center w-full"
        >
          +{competitors.length - 5} more competitors
        </button>
      )}
    </div>
  )
}

const AnalysisInsights = ({ insights }) => {
  const [showAll, setShowAll] = useState(false)
  const [expandedIndexes, setExpandedIndexes] = useState(new Set())

  const entries = Object.entries(insights || {})
  const visibleEntries = showAll ? entries : entries.slice(0, 3)

  const toggleExpanded = index => {
  const toggleExpanded = index => {
    const updated = new Set(expandedIndexes)
    updated.has(index) ? updated.delete(index) : updated.add(index)
    setExpandedIndexes(updated)
  }

  return (
    <div className="space-y-3">
      {visibleEntries.map(([key, value], index) => {
        const isExpanded = expandedIndexes.has(index)
        const text = typeof value === "object" ? "Multiple insights available" : value?.toString()
        const shouldTruncate = text?.length > 120 && !isExpanded
        const displayText = shouldTruncate ? text.slice(0, 120) + "..." : text
        const match = value.match(/\((\d+\/\d+)\)$/)
        const score = match ? match[1] : null

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 bg-blue-50 rounded-lg border border-blue-100"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-medium text-blue-900 text-sm mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p>{score && <Tag color="blue">{score.replace("/", " / ")}</Tag>}</p>
                </div>
                <p
                  className="text-xs text-blue-700 leading-relaxed cursor-pointer select-none"
                  onClick={() => toggleExpanded(index)}
                >
                  {displayText}
                  {shouldTruncate && <span className="text-blue-500 ml-1">(more)</span>}
                </p>
              </div>
            </div>
          </motion.div>
        )
      })}

      {entries.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-blue-600 hover:text-blue-700 text-center w-full"
        >
          {showAll ? "Show less" : `+${entries.length - 5} more insights`}
        </button>
      )}
    </div>
  )
}

const ProofreadingSuggestion = React.forwardRef(({ suggestion, index, onApply, onReject }, ref) => (
  <div
    ref={ref}
    className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow"
  >
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-medium text-gray-700">Original</span>
        </div>
        <div className="p-2 bg-red-50 border border-red-100 rounded text-xs text-gray-700 leading-relaxed">
          {suggestion.original}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-xs font-medium text-gray-700">Suggested</span>
        </div>
        <div className="p-2 bg-green-50 border border-green-100 rounded text-xs text-gray-700 leading-relaxed">
          {suggestion.change}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="small"
          type="primary"
          onClick={() => onApply(index, suggestion)}
          className="flex-1 !bg-gradient-to-r !from-green-500 !to-emerald-600 !border-0"
        >
          Accept
        </Button>
        <Button size="small" onClick={() => onReject(index)} className="flex-1">
          Reject
        </Button>
      </div>
    </div>
  </div>
))

ProofreadingSuggestion.displayName = "ProofreadingSuggestion"

export {
  FeatureCard,
  ScoreCard,
  StatCard,
  CompetitorsList,
  AnalysisInsights,
  ProofreadingSuggestion,
}
