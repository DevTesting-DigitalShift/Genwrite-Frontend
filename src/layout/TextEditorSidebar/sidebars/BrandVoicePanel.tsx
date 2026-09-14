import { Crown, ExternalLink, User, X } from "lucide-react"
import type { Brand } from "@/types/brand"
import { brandsQuery } from "@api/Brand/Brand.query"
import type { BrandVoicePanelProps } from "../types"

/** `blog.brandId` is `string | Brand` — populated on routes that populate it, a bare
 * ObjectId string otherwise. This narrows it to the populated-object case. */
const isPopulatedBrand = (brandId: unknown): brandId is Brand =>
  typeof brandId === "object" && brandId !== null

/**
 * Brand Voice Panel - Display brand voice information for the current blog.
 *
 * The blog itself carries no brand-voice fields of its own — `blog.brandId` (populated
 * object or bare id) is the only real source. A bare id is resolved against
 * `brandsQuery.useList()` (server state); no client store is involved.
 */
const BrandVoicePanel: React.FC<BrandVoicePanelProps> = ({
  blog,
  onRegenerateWithBrand,
  setIsSidebarOpen,
}) => {
  const brandId = blog?.brandId as string | Brand | undefined
  const isBrandPopulated = isPopulatedBrand(brandId)
  const rawBrandId = isBrandPopulated ? brandId._id : brandId
  const { data: brandList = [] } = brandsQuery.useList({ enabled: Boolean(rawBrandId) && !isBrandPopulated })

  const resolvedBrand: Partial<Brand> = isBrandPopulated
    ? brandId
    : (Array.isArray(brandList) ? brandList : []).find((b) => b._id === rawBrandId) || {}

  const brand = {
    nameOfVoice: resolvedBrand.nameOfVoice,
    persona: resolvedBrand.persona,
    describeBrand: resolvedBrand.describeBrand,
    postLink: resolvedBrand.postLink,
    sitemap: resolvedBrand.sitemap,
    keywords: resolvedBrand.keywords,
  }

  const hasBrandDetails = Boolean(
    brand.persona || brand.describeBrand || brand.postLink || brand.sitemap || brand.keywords?.length
  )

  if (!brandId && !(isBrandPopulated && brandId.nameOfVoice)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
          <Crown className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Brand Selected</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-6">
          This blog wasn't generated with a specific brand voice. Add one to maintain personality
          across your content.
        </p>
        <button
          type="button"
          onClick={onRegenerateWithBrand}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
            blog?.isArchived
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-black"
          }`}
        >
          Regenerate with Brand
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-white sticky top-0 z-10 border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 rounded-xl shadow-lg shadow-purple-100">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 line-clamp-1">
                {brand.nameOfVoice || "Brand Voice"}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Brand Identity
              </p>
            </div>
          </div>
          {setIsSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
        {!hasBrandDetails && (
          <p className="text-xs text-gray-500 leading-relaxed text-center py-8">
            No details saved for this brand voice yet. Add a description, persona or keywords on
            the Brand Voice page and they'll show up here.
          </p>
        )}

        {/* Description */}
        {brand.describeBrand && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-purple-500" />
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                About the Brand
              </h4>
            </div>
            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-xs leading-relaxed">
              {brand.describeBrand}
            </div>
          </div>
        )}

        {/* Persona */}
        {brand.persona && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Author Persona
              </h4>
            </div>
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs  leading-relaxed">
              {brand.persona}
            </div>
          </div>
        )}

        {/* Keywords & Links */}
        <div className="grid grid-cols-1 gap-4">
          {brand.postLink && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Reference Site
              </h4>
              <a
                href={brand.postLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-all group"
              >
                <span className="text-xs font-semibold text-blue-600 truncate mr-2">
                  {brand.postLink}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </a>
            </div>
          )}

          {brand.sitemap && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Sitemap
              </h4>
              <a
                href={brand.sitemap}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-all group"
              >
                <span className="text-xs font-semibold text-blue-600 truncate mr-2">
                  {brand.sitemap}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </a>
            </div>
          )}

          {brand.keywords && brand.keywords.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Core Keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {brand.keywords.map((kw: string) => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 bg-white border border-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BrandVoicePanel
