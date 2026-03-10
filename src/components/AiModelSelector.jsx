import React from "react"
import { Crown } from "lucide-react"
import { openUpgradePopup } from "@utils/UpgardePopUp"

import { AI_MODELS } from "@/data/blogData"

/**
 * Reusable AI Model Selector component.
 * Ensures consistent keys ("gemini", "openai", "claude") in the payload.
 */
const AiModelSelector = ({
  value,
  onChange,
  userPlan = "free",
  navigate,
  error = "",
  label = "Select AI Model",
}) => {
  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-semibold text-gray-700">{label}</label>}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 ${error ? "border-2 border-red-500 rounded-lg p-2" : ""}`}
      >
        {AI_MODELS.map(model => {
          const isRestricted = model.restrictedPlans.includes(userPlan)
          const isActive = value === model.id

          return (
            <div
              key={model.id}
              onClick={() => {
                if (isRestricted) {
                  openUpgradePopup({ featureName: model.label, navigate })
                } else {
                  onChange(model.id)
                }
              }}
              className={`
                relative border-2 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-200
                ${
                  isActive
                    ? "border-[#1B6FC9] bg-blue-50/50 shadow-sm ring-1 ring-blue-100"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }
                ${isRestricted ? "opacity-60 grayscale-[0.3]" : "opacity-100"}
              `}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${isActive ? "bg-white shadow-xs" : "bg-gray-50"}`}
              >
                <img src={model.logo} alt={model.label} className="w-6 h-6 object-contain" />
              </div>
              <span
                className={`text-sm font-bold tracking-tight ${isActive ? "text-[#1B6FC9]" : "text-gray-700"}`}
              >
                {model.label}
              </span>

              {isRestricted && (
                <div className="absolute top-2 right-2">
                  <div
                    className="tooltip tooltip-left"
                    data-tip={`Upgrade to unlock ${model.label}`}
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-50" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default AiModelSelector
