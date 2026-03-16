import { useNavigate } from "react-router-dom"
import { Crown, Image, Sparkles, Upload, X, AlertCircle } from "lucide-react"
import { IMAGE_OPTIONS, IMAGE_SOURCE } from "../data/blogData"
import { toast } from "sonner"
import useAuthStore from "@store/useAuthStore"
import { Slider } from "@/components/ui/slider"
import { BLOG_CONFIG } from "@/data/blogConfig"

const ImageSourceSelector = ({
  value,
  onChange,
  showUpload = false,
  showNone = false,
  error,
  numberOfImages,
  onNumberChange,
  showNumberSelector = true,
}) => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const userPlan = user?.subscription?.plan || "free"
  const isAiLimitReached = (user?.usage?.aiImages || 0) >= (user?.usageLimits?.aiImages || 0)

  const handleSelect = option => {
    const isRestricted = option.restrictedPlans?.includes(userPlan?.toLowerCase())

    if (isRestricted) {
      toast.error(`The ${option.label} feature is available on Pro plans.`)
      if (navigate) navigate("/pricing")
      return
    }

    if (option.id === IMAGE_SOURCE.AI && isAiLimitReached) {
      toast.error(
        "You have reached your AI image limit for this period. Please upgrade or wait for the next cycle."
      )
      return
    }

    onChange(option.id)
  }

  const filteredOptions = IMAGE_OPTIONS.filter(opt => {
    if (opt.id === IMAGE_SOURCE.NONE && !showNone) return false
    if (opt.id === IMAGE_SOURCE.UPLOAD && !showUpload) return false
    return true
  })

  const getIcon = id => {
    switch (id) {
      case IMAGE_SOURCE.NONE:
        return <X className="w-5 h-5" />
      case IMAGE_SOURCE.STOCK:
        return <Image className="w-5 h-5 text-blue-500" />
      case IMAGE_SOURCE.AI:
        return <Sparkles className="w-5 h-5 text-indigo-500" />
      case IMAGE_SOURCE.UPLOAD:
        return <Upload className="w-5 h-5 text-purple-500" />
      default:
        return <Image className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label className="text-sm font-semibold text-slate-800">Select Image Mode</label>
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${filteredOptions.length > 2 ? "lg:grid-cols-3" : ""} gap-4`}
      >
        {filteredOptions.map(option => {
          const isActive = value === option.id
          const isRestricted = option.restrictedPlans?.includes(userPlan?.toLowerCase())
          const isLimitReached = option.id === IMAGE_SOURCE.AI && isAiLimitReached

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-300 text-left group
                ${
                  isActive
                    ? "border-[#1B6FC9] bg-[#1B6FC9]/5 ring-1 ring-[#1B6FC9]/20 shadow-md"
                    : "border-slate-200 bg-white hover:border-[#1B6FC9]/30 hover:bg-slate-50 shadow-sm"
                }
                ${isRestricted ? "opacity-70 grayscale-[0.5]" : ""}
                ${isLimitReached ? "opacity-90 bg-slate-50 border-gray-300" : ""}
              `}
              title={
                isLimitReached
                  ? "AI Image limit reached"
                  : isRestricted
                    ? "Available on Pro plans"
                    : ""
              }
            >
              {isRestricted ? (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100 scale-90 group-hover:scale-100 transition-transform">
                  <Crown className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Pro</span>
                </div>
              ) : (
                isLimitReached && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100 scale-90 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase">Limit Reached</span>
                  </div>
                )
              )}

              <div className="flex items-center gap-3 w-full mb-1">
                <div
                  className={`p-1 flex items-center justify-center w-fit
                  ${isActive ? "bg-[#1B6FC9]/10 text-[#1B6FC9]" : "text-slate-600 group-hover:text-[#1B6FC9]"}
                `}
                >
                  {getIcon(option.id)}
                </div>

                <h4
                  className={`text-sm font-bold transition-colors ${isActive ? "text-[#1B6FC9]" : "text-slate-800"}`}
                >
                  {option.label}
                </h4>
              </div>

              <div className="w-full mt-1">
                <p
                  className={`text-xs leading-tight transition-colors ${isActive ? "text-slate-600" : "text-slate-500"}`}
                >
                  {isLimitReached ? "Your monthly AI image quota is reached" : option.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {showNumberSelector && value && value !== "none" && (
        <div className="pt-4 px-1 border-t border-slate-100 mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-800">Number of Images</label>
            <span className="text-sm font-bold text-[#1B6FC9] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
              {numberOfImages || 0} {numberOfImages === 1 ? "Image" : "Images"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 font-medium italic">
            0 = AI will decide the best number of images for your content.
          </p>
          <div className="py-2">
            <Slider
              min={0}
              max={BLOG_CONFIG.IMAGES.MAX_COUNT || 15}
              step={1}
              value={[Number(numberOfImages) || 0]}
              onValueChange={vals => onNumberChange(vals[0])}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageSourceSelector
