import { useEffect, useState } from "react"
import { fetchBrands } from "@store/slices/brandSlice"

const BrandVoiceSection = ({ isCheckedBrand }) => {
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [brandError, setBrandError] = useState(null)

  const { brandVoices, loading, error } = useSelector((state) => state.brand)

  useEffect(() => {
    if (isCheckedBrand) {
      dispatch(fetchBrands())
    }
  }, [isCheckedBrand, dispatch])

  if (!isCheckedBrand) return null

  return (
    <div className="mt-4 p-4 rounded-lg border border-indigo-200 bg-indigo-50">
      {loadingBrands ? (
        <div className="text-gray-500 text-sm">Loading brand voices...</div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : brandVoices.length > 0 ? (
        <div className="space-y-2">
          {brandVoices.map((voice) => (
            <div key={voice._id} className="mb-2">
              <div className="font-semibold text-indigo-700">{voice.nameOfVoice}</div>
              <div className="text-gray-700 text-sm mt-1">{voice.describeBrand}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">No brand voices created yet.</div>
      )}
    </div>
  )
}

export default BrandVoiceSection
