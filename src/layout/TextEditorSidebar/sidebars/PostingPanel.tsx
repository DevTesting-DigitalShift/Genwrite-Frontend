import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Info, Pencil, RefreshCw, Send, X } from "lucide-react"
import { Switch } from "@components/ui/switch"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { asApiError } from "@/types/api"
import { fetchCategories } from "@api/integrationApi"
import useEditorStore from "@store/useEditorStore"
import useIntegrationStore from "@store/useIntegrationStore"
import IndexingStatus from "@components/Blog/IndexingStatus"
import { PLATFORM_LABELS } from "../constants"
import PlatformCategoriesField from "./PlatformCategoriesField"

interface PostingPanelProps {
  blog: any
  userPlan: string
  isLocked?: boolean
  isPublicMode?: boolean
  hasGscAccess: boolean
  onPost?: (...args: any[]) => void
  handleSubmit?: (...args: any[]) => void
  setIsSidebarOpen?: (open: boolean) => void
  onOpenRepostModal: (posting: any) => void
}

/**
 * Publish panel — new-post form plus post history. Form fields (platform/category/ToC
 * selection, validation errors) are panel-local: nothing outside Publish reads them.
 * `blogPostings`/`isLoadingPostings`/`posted`/`isPosting`/`formData` come from
 * `useEditorStore`, shared with the rest of the editor.
 */
const PostingPanel: React.FC<PostingPanelProps> = ({
  blog,
  userPlan,
  isLocked,
  isPublicMode,
  hasGscAccess,
  onPost,
  handleSubmit,
  setIsSidebarOpen,
  onOpenRepostModal,
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handlePopup } = useConfirmPopup()
  const { integrations } = useIntegrationStore()

  const formData = useEditorStore((s) => s.formData)
  const posted = useEditorStore((s) => s.posted)
  const isPosting = useEditorStore((s) => s.isPosting)
  const unsavedChanges = useEditorStore((s) => s.unsavedChanges)
  const seoMetadata = useEditorStore((s) => s.seoMetadata)
  const blogPostings = useEditorStore((s) => s.blogPostings)
  const isLoadingPostings = useEditorStore((s) => s.isLoadingPostings)
  const fetchPostings = useEditorStore((s) => s.fetchPostings)

  const hasPublishedLinks = blogPostings.length > 0

  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [includeTableOfContents, setIncludeTableOfContents] = useState(false)
  const [isCategoryLocked, setIsCategoryLocked] = useState(false)
  const [categoryError, setCategoryError] = useState(false)
  const [platformError, setPlatformError] = useState(false)
  const [errors, setErrors] = useState({ category: "", platform: "" })

  const handleIntegrationChange = useCallback(
    (platform: any, url: any) => {
      setSelectedIntegration({ platform: platform.toLowerCase(), rawPlatform: platform, url })
      setPlatformError(false)
      setErrors((prev) => ({ ...prev, platform: "" }))

      const hasShopifyAlready = !!posted?.SHOPIFY?.link
      setIsCategoryLocked(platform === "SHOPIFY" && hasShopifyAlready)
    },
    [posted]
  )

  const handleCategoryAdd = useCallback((category: any) => {
    setSelectedCategory(category)
    setCategoryError(false)
    setErrors((prev) => ({ ...prev, category: "" }))
  }, [])

  const handleCategoryChange = useCallback((value: any) => {
    const newCategory = value.length > 0 ? value[value.length - 1] : ""
    setSelectedCategory(newCategory)
    setCategoryError(false)
    setErrors((prev) => ({ ...prev, category: "" }))
  }, [])

  // Auto-fetch categories when integration changes
  useEffect(() => {
    if (selectedIntegration?.platform) {
      fetchCategories(selectedIntegration.platform.toUpperCase()).catch(() => {})
    }
  }, [selectedIntegration?.platform])

  // Initialize posting form based on Blog Data & History. This mounts fresh every
  // time Publish becomes the active panel (parent remounts panels on tab switch),
  // so there's no need to gate it on which tab is active.
  //
  // selectedCategory/selectedIntegration are read only to decide whether to auto-fill
  // from blog/history data, not something this effect should react to on every
  // keystroke — see the same note this carried in TextEditorSidebar before extraction.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    setIncludeTableOfContents((prev) => blog?.options?.includeTableOfContents ?? prev)

    if (blog?.category && !selectedCategory) {
      setSelectedCategory(blog.category)
    }

    if (blogPostings.length > 0) {
      const shopifyPosting = blogPostings.find((p) => p.integrationType === "SHOPIFY")

      if (shopifyPosting) {
        const meta = shopifyPosting.metadata || {}
        setIsCategoryLocked(true)
        setSelectedCategory((meta.category as string) || "")
        if (!selectedIntegration) {
          setSelectedIntegration({
            platform: "shopify",
            rawPlatform: "SHOPIFY",
            url: (integrations?.integrations?.SHOPIFY as { url?: string } | undefined)?.url || "",
          })
        }
        return
      }

      if (!selectedIntegration && blogPostings[0]) {
        const lastPost = blogPostings[0]
        const meta = lastPost.metadata || {}
        const rawPlatform = lastPost.integrationType

        if (rawPlatform && integrations?.integrations?.[rawPlatform]) {
          setSelectedIntegration({
            platform: rawPlatform.toLowerCase(),
            rawPlatform: rawPlatform,
            url: (integrations.integrations[rawPlatform] as { url?: string })?.url || "",
          })

          if (meta.category) setSelectedCategory(meta.category as string)
          if (meta.includeTableOfContents !== undefined)
            setIncludeTableOfContents(meta.includeTableOfContents as boolean)

          return
        }
      }
    }

    const shopify = posted?.SHOPIFY

    if (shopify?.link) {
      setIsCategoryLocked(true)
      setSelectedCategory(blog?.category || "")
      setSelectedIntegration({
        platform: "shopify",
        rawPlatform: "SHOPIFY",
        url: shopify.url || "",
      })
      return
    }

    const otherPosted = Object.entries(posted || {}).find(([k, v]) => k !== "SHOPIFY" && v?.link)
    if (otherPosted) {
      const [key, val] = otherPosted
      if (!selectedIntegration) {
        setSelectedIntegration({
          platform: key.toLowerCase(),
          rawPlatform: key,
          url: val?.url || "",
        })
      }
    }
  }, [posted, blog, integrations, selectedIntegration, blogPostings])

  const handlePostClick = useCallback(() => {
    if (blog?.isArchived) {
      toast.error("This blog is archived. Please restore it to perform this action.")
      return
    }
    if (userPlan === "free") {
      return handlePopup({
        title: "Posting Unavailable",
        description: "Free users cannot publish blogs. Upgrade to unlock automated posting.",
        confirmText: "Upgrade Now",
        onConfirm: () => navigate("/pricing"),
      })
    }

    const newErrors = { category: "", platform: "" }
    let isValid = true

    if (!selectedIntegration) {
      newErrors.platform = "Please select a platform"
      setPlatformError(true)
      isValid = false
    }
    if (!selectedCategory) {
      newErrors.category = "Please select a category"
      setCategoryError(true)
      isValid = false
    }
    setErrors(newErrors)

    if (!isValid) {
      toast.error("Please fill in required fields")
      return
    }

    const executePost = async () => {
      try {
        await onPost?.({
          ...formData,
          categories: selectedCategory,
          includeTableOfContents,
          type: { platform: selectedIntegration?.rawPlatform },
        })
        await fetchPostings()
        queryClient.invalidateQueries({ queryKey: ["blogs"] })
      } catch (rawError) {
        const error = asApiError(rawError)
        console.error("Posting failed:", error)
        if (
          error.response?.status === 400 &&
          (error.response?.data?.message?.toLowerCase()?.includes("invalid credentials") ||
            error.response?.data?.message?.toLowerCase()?.includes("wordpress api"))
        ) {
          toast.error("WordPress API has changed. Kindly update your WordPress credentials.", {
            duration: 5000,
          })
        }
      }
    }

    if (unsavedChanges) {
      handlePopup({
        title: "Unsaved Changes",
        description: "You have unsaved changes. Save before posting?",
        confirmText: "Save & Post",
        cancelText: "Post Without Saving",
        onConfirm: async () => {
          try {
            await handleSubmit?.({ metadata: seoMetadata })
            executePost()
          } catch (_error) {
            toast.error("Failed to save changes")
          }
        },
        onCancel: (e: any) => {
          if (e?.source === "button") {
            executePost()
          }
        },
      })
    } else {
      executePost()
    }
  }, [
    userPlan,
    selectedIntegration,
    selectedCategory,
    includeTableOfContents,
    formData,
    onPost,
    unsavedChanges,
    handleSubmit,
    seoMetadata,
    handlePopup,
    navigate,
    fetchPostings,
    queryClient,
    blog?.isArchived,
  ])

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-4 border-b bg-white sticky top-0 z-10 border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-600 rounded-xl shadow-lg shadow-green-100">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 line-clamp-1">Publishing</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Distribution & History
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

      <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scroll">
        {/* === NEW POST SECTION === */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                New Post
              </span>
            </div>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[12px] font-bold">
              {selectedIntegration
                ? PLATFORM_LABELS[selectedIntegration.rawPlatform] || "Selected"
                : "Configure"}
            </span>
          </div>

          <div className="space-y-4">
            {/* Platform Select */}
            <div>
              <label htmlFor="posting-platform" className="text-xs font-semibold  mb-1.5 block">
                Select Platform
              </label>
              {integrations?.integrations && Object.keys(integrations.integrations).length > 0 ? (
                <select
                  id="posting-platform"
                  className={`select select-bordered outline-0 w-full ${platformError ? "select-error" : ""} ${
                    blog?.isArchived ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  value={selectedIntegration?.rawPlatform || ""}
                  disabled={blog?.isArchived}
                  onChange={(e) => {
                    const v = e.target.value
                    const d = integrations?.integrations?.[v] as { url?: string } | undefined
                    handleIntegrationChange(v, d?.url)
                  }}
                >
                  <option value="" disabled>
                    Choose platform...
                  </option>
                  {Object.entries(integrations.integrations).map(([k, _v]) => (
                    <option key={k} value={k}>
                      {PLATFORM_LABELS[k] || k}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-800">
                  No platforms connected.{" "}
                  <button
                    type="button"
                    className="font-bold cursor-pointer underline"
                    onClick={() => navigate("/plugins")}
                  >
                    Connect now
                  </button>
                  .
                </div>
              )}
              {platformError && <p className="text-[10px] text-red-500 mt-1">{errors.platform}</p>}
            </div>
            {/* Category Select */}
            <div>
              <span className="text-xs font-semibold  mb-1.5 block">Select Category</span>

              <input
                type="text"
                className={`input input-bordered outline-0 w-full ${categoryError ? "input-error" : ""}`}
                placeholder="Select or type..."
                value={selectedCategory || ""}
                onChange={(e) => handleCategoryChange([e.target.value])}
                disabled={isCategoryLocked}
              />

              {categoryError && <p className="text-[10px] text-red-500 mt-1">{errors.category}</p>}

              {selectedIntegration?.platform === "shopify" && (
                <div className="mt-2 p-2.5 bg-amber-50 text-amber-800 text-[10px] border border-amber-200 rounded-xl flex items-start gap-2 shadow-xs">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Public Release Warning:</span> Shopify categories
                    cannot be changed once the post is public. Please ensure this is correct.
                  </div>
                </div>
              )}

              {/* Consistently show Categories for all platforms (WordPress, Shopify, Sanity, Server) */}
              <PlatformCategoriesField
                onSelect={handleCategoryAdd}
                currentCategory={selectedCategory}
                platform={selectedIntegration?.rawPlatform}
              />
            </div>
            {/* ToC Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-xs font-semibold text-gray-800">Table of Contents</span>
              <Switch
                checked={includeTableOfContents}
                onCheckedChange={setIncludeTableOfContents}
                disabled={blog?.isArchived}
              />
            </div>

            {/* Main Post Action */}
            <button
              type="button"
              onClick={handlePostClick}
              disabled={isPosting || blog?.isArchived || isLocked}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] ${
                isPosting || blog?.isArchived || isLocked
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-linear-to-r from-green-600 to-emerald-600 text-white hover:shadow-green-100 hover:translate-y-px"
              }`}
            >
              {isPosting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isPublicMode ? "Publishing Locked" : "Publish Now"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* === POST HISTORY SECTION === */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Post History
              </span>
            </div>
          </div>

          {isLoadingPostings ? (
            <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading history...</p>
            </div>
          ) : hasPublishedLinks ? (
            <div className="space-y-3">
              {blogPostings.map((posting) => (
                <div
                  key={posting.link || posting.postedOn}
                  className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-100 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold ">
                      {PLATFORM_LABELS[posting.integrationType] || posting.integrationType}
                    </span>
                    <span className="text-[12px] text-gray-400">
                      {posting.postedOn ? new Date(posting.postedOn).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between">
                      <span className="text-[12px] text-gray-400">Category:</span>
                      <span className="text-[12px] font-medium  text-right truncate max-w-30">
                        {(posting.metadata?.category as string) || blog.category}
                      </span>
                    </div>
                    {posting.link && (
                      <a
                        href={posting.link}
                        target="_blank"
                        className="flex items-center justify-end gap-1 text-[12px] text-blue-600 hover:underline"
                        rel="noopener"
                      >
                        View Live <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}

                    {/* Live Search Console index status + best-effort indexing request */}
                    <IndexingStatus
                      blogId={blog?._id}
                      pageUrl={posting.link}
                      indexing={posting.indexing}
                      hasGscAccess={hasGscAccess}
                      canRequest={!isLocked}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="tooltip" data-tip="Edit settings and repost">
                      <button
                        type="button"
                        className="btn btn-square btn-sm btn-ghost border-gray-200 hover:text-blue-600 hover:border-blue-200"
                        onClick={() => {
                          if (blog?.isArchived) {
                            toast.error(
                              "This blog is archived. Please restore it to perform this action."
                            )
                            return
                          }
                          onOpenRepostModal(posting)
                        }}
                        disabled={isPosting || blog?.isArchived}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm flex-1 text-[12px] font-semibold h-8"
                      onClick={() => {
                        if (blog?.isArchived) {
                          toast.error(
                            "This blog is archived. Please restore it to perform this action."
                          )
                          return
                        }
                        onPost?.({
                          ...formData,
                          categories: (posting.metadata?.category as string) || blog.category,
                          includeTableOfContents: posting.metadata?.includeTableOfContents as
                            | boolean
                            | undefined,
                          type: { platform: posting.integrationType },
                        })
                      }}
                      disabled={isPosting || blog?.isArchived}
                    >
                      Repost Same Settings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
              <p className="text-xs text-gray-400 italic">No posting history yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PostingPanel
