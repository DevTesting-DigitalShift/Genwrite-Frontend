import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import axiosInstance from "@/api"
import { POPULAR_CATEGORIES } from "../constants"

interface PlatformCategoriesFieldProps {
  onSelect: (category: any) => void
  currentCategory?: any
  platform?: string
}

/**
 * Category picker shared by PostingPanel (new post) and TextEditorSidebar's
 * Edit & Repost modal. Supports WP, Sanity, Shopify, Server.
 */
const PlatformCategoriesField: React.FC<PlatformCategoriesFieldProps> = ({
  onSelect,
  currentCategory,
  platform,
}) => {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPlatformCategories = async () => {
      if (!platform) {
        setCategories([])
        return
      }

      setLoading(true)
      try {
        const response = await axiosInstance.get(
          `/integrations/category?type=${platform.toUpperCase()}`
        )
        setCategories(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error(`Failed to fetch ${platform} categories`, error)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchPlatformCategories()
  }, [platform])

  const displayCategories = (() => {
    const combined = [...categories]
    const lowerCategories = categories.map((c) => c.toLowerCase())
    POPULAR_CATEGORIES.forEach((cat) => {
      if (!lowerCategories.includes(cat.toLowerCase())) combined.push(cat)
    })
    return combined
  })()

  const isUsingOnlyPopular = categories.length === 0

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold  uppercase tracking-wide flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
          {platform && !isUsingOnlyPopular
            ? `${platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()} Categories`
            : "Popular Categories"}
        </span>
        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
          {displayCategories.length} available
        </span>
      </div>

      <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 max-h-48 overflow-y-auto custom-scroll">
        {loading ? (
          <div className="flex justify-center p-4">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-wrap gap-2">
              {displayCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelect(cat)}
                  type="button"
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border flex items-center gap-1.5
                    ${
                      currentCategory === cat
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 transform scale-105"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm"
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 mt-2 px-1">
        {isUsingOnlyPopular
          ? "Select a popular category to keep your content organized."
          : `Select a category from your ${platform} site to populate the field above.`}
      </p>
    </div>
  )
}

export default PlatformCategoriesField
