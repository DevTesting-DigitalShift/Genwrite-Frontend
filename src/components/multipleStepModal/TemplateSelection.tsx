import { packages } from "@/data/templates"
import { Switch } from "@components/ui/switch"
import { toast } from "sonner"
import clsx from "clsx"
import { AlertCircle, Check, Crown, Search } from "lucide-react"
import { type FC, memo, useEffect, useState, useMemo } from "react"

interface TemplateSelectionProps {
  numberOfSelection?: number
  userSubscriptionPlan: string
  onClick: (templates: BlogTemplate[]) => void
  preSelectedIds?: Array<string | number>
  className?: string
  error?: string
  /** Shorter cropped thumbnails and a selected-check badge — for the single-page create forms. */
  compact?: boolean
}

export interface BlogTemplate {
  id: number
  imgSrc: string
  name: string
  description: string
  paid: boolean
}

const TemplateSelection: FC<TemplateSelectionProps> = ({
  numberOfSelection = 1,
  userSubscriptionPlan,
  preSelectedIds,
  onClick,
  className = "",
  error = "",
  compact = false,
}) => {
  const { isProUser, initialTemplates } = useMemo(() => {
    const isProUser = !["free", "basic"].includes(userSubscriptionPlan)
    if (isProUser) {
      return { isProUser, initialTemplates: [...packages] }
    }
    return {
      isProUser,
      initialTemplates: [...packages].sort((a, b) => {
        return a.paid === b.paid ? 0 : a.paid ? 1 : -1
      }),
    }
  }, [userSubscriptionPlan])

  const [templates, setTemplates] = useState<BlogTemplate[]>(initialTemplates)
  const [showSelected, setShowSelected] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  // Clear local error when search term changes
  useEffect(() => {
    setLocalError(null)
  }, [])

  // Memoize preSelectedIds to stabilize the reference
  const stabilizedPreSelectedIds = useMemo<number[]>(() => {
    if (!preSelectedIds || !Array.isArray(preSelectedIds)) return []

    if (typeof preSelectedIds[0] === "number") {
      return [...preSelectedIds] as number[]
    }

    const mapped = preSelectedIds
      .map((name) => {
        const template = packages.find((t) => t.name === name)
        return template ? template.id : null
      })
      .filter((id): id is number => typeof id === "number")

    return mapped
  }, [preSelectedIds])

  const [selectedIds, setSelectedIds] = useState<number[]>(stabilizedPreSelectedIds)

  // Sync selectedIds with stabilizedPreSelectedIds
  useEffect(() => {
    setSelectedIds((prev) => {
      if (
        prev.length !== stabilizedPreSelectedIds.length ||
        prev.some((id, index) => id !== stabilizedPreSelectedIds[index])
      ) {
        return stabilizedPreSelectedIds
      }
      return prev
    })
  }, [stabilizedPreSelectedIds])

  // Trigger onClick when selectedIds changes
  useEffect(() => {
    onClick(selectedIds.map((id) => packages[id - 1]))
  }, [selectedIds, onClick])

  // Filter templates based on search and showSelected
  useEffect(() => {
    let filtered = initialTemplates

    if (showSelected) {
      filtered = selectedIds.map((id) => packages[id - 1])
    }

    if (searchTerm) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    setTemplates(filtered)

    if (selectedIds.length === 0 && showSelected) {
      setShowSelected(false)
    }
  }, [showSelected, selectedIds, searchTerm, initialTemplates])

  const handlePackageSelect = (id: number) => {
    const pkg = packages[id - 1]
    if (!isProUser && pkg.paid) {
      toast.error("Please upgrade to a Pro subscription or more to access this template.")
    } else {
      let indices = [...selectedIds]
      const findIndex = indices.indexOf(id)
      if (findIndex === -1) {
        if (indices.length >= numberOfSelection) {
          if (numberOfSelection === 1) {
            // Single-select mode: swap the selection instead of erroring.
            indices = [id]
            setLocalError(null)
            setSelectedIds(indices)
            return
          }
          setLocalError(`You can select a maximum of ${numberOfSelection} templates.`)
          return
        }
        indices.push(id)
        setLocalError(null)
      } else {
        indices = indices.slice(0, findIndex).concat(indices.slice(findIndex + 1))
        setLocalError(null)
      }
      setSelectedIds(indices)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header Section - Responsive */}
      <div className="sticky top-0 pb-4 bg-white z-30 space-y-3">
        <div className="flex sm:flex-row items-center gap-4">
          <label className="input border border-gray-300 flex items-center gap-2 w-full">
            <input
              type="text"
              className="grow rounded-lg"
              placeholder="search template by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 opacity-70" />
          </label>

          <div className="flex items-center gap-3 w-1/3">
            <label
              htmlFor="show-template"
              className="text-sm font-medium text-slate-700 cursor-pointer"
            >
              Show Selected
            </label>

            <Switch
              id="show-template"
              disabled={selectedIds?.length === 0}
              checked={showSelected}
              onCheckedChange={(checked: boolean) => setShowSelected(checked)}
            />
          </div>
        </div>
        {(localError || error) && (
          // No enter animation: `tailwindcss-animate`'s `fade-in` left this banner stuck near
          // transparent under Tailwind v4, so the one message explaining the red state was unreadable.
          <div
            role="alert"
            className="flex items-center gap-3 p-3 px-4 mt-2 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" aria-hidden />
            <div className="flex-1">{localError || error}</div>
          </div>
        )}
      </div>

      {/* Templates Grid - Responsive */}
      <div
        className={clsx(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-2 overflow-y-auto custom-scroll",
          compact ? "max-h-108 px-0.5" : "max-h-[60vh]"
        )}
      >
        {templates.length ? (
          templates.map((pkg, index) => {
            const isSelected = selectedIds.includes(pkg.id)
            return (
              // A real <button> rather than role="button": it gets Space/Enter activation
              // and focus handling for free. Inner nodes are spans because <button> only
              // admits phrasing content — divs/headings inside it are invalid HTML.
              <button
                type="button"
                key={pkg.id}
                className={clsx(
                  "relative block w-full text-left cursor-pointer transition-all duration-200",
                  compact
                    ? [
                        "rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-primary/40 hover:shadow-sm",
                      ]
                    : [
                        "rounded-lg border-2",
                        isSelected ? "border-blue-500" : "border-transparent hover:border-gray-200",
                      ]
                )}
                onClick={() => handlePackageSelect(pkg.id)}
                aria-pressed={isSelected}
                aria-label={`Select ${pkg.name} template`}
                // Where a failed form submit lands focus (see `findFirstInvalidField`).
                data-focus-on-error={index === 0 ? "" : undefined}
              >
                <span
                  className={clsx(
                    "block bg-white overflow-hidden h-full",
                    compact ? "rounded-xl" : "rounded-md shadow-sm border border-gray-300"
                  )}
                >
                  <span
                    className={clsx(
                      "block relative",
                      compact && "h-32 bg-slate-50 border-b border-border overflow-hidden"
                    )}
                  >
                    <img
                      src={pkg.imgSrc || "/placeholder.svg"}
                      alt={pkg.name}
                      loading="lazy"
                      className={clsx(
                        "w-full object-cover",
                        compact ? "h-full object-top" : "h-full"
                      )}
                    />
                    {pkg.paid && (
                      <span
                        className={clsx(
                          "absolute top-2 bg-white/80 rounded-full p-1 backdrop-blur-sm",
                          // Leave the top-right corner to the selected check in compact mode.
                          compact && isSelected ? "right-9" : "right-2"
                        )}
                      >
                        <Crown
                          size={compact ? 14 : 16}
                          className="text-purple-600"
                          aria-label="Pro feature"
                        />
                      </span>
                    )}
                    {compact && isSelected && (
                      <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                    )}
                  </span>
                  <span className={clsx("block", compact ? "px-3 py-2.5" : "p-3")}>
                    <span
                      className={clsx(
                        "block font-medium text-gray-900 mb-1",
                        compact ? "text-sm font-semibold" : "text-base"
                      )}
                    >
                      {pkg.name}
                    </span>
                    <span className="block text-xs text-gray-500 line-clamp-2">
                      {pkg.description}
                    </span>
                  </span>
                </span>
              </button>
            )
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-10 text-gray-400">
            <div className="text-lg font-medium">No templates found</div>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(TemplateSelection)
