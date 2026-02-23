import { packages } from "@/data/templates"
import { Switch } from "@components/ui/switch"
import toast from "@utils/toast"
import clsx from "clsx"
import { Crown, Search } from "lucide-react"
import { FC, useEffect, useState, useMemo } from "react"

interface TemplateSelectionProps {
  numberOfSelection?: number
  userSubscriptionPlan: string
  onClick: (templates: BlogTemplate[]) => void
  preSelectedIds?: Array<string | number>
  className?: string
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

  // Memoize preSelectedIds to stabilize the reference
  const stabilizedPreSelectedIds = useMemo<number[]>(() => {
    if (!preSelectedIds || !Array.isArray(preSelectedIds)) return []

    if (typeof preSelectedIds[0] === "number") {
      return [...preSelectedIds] as number[]
    }

    const mapped = preSelectedIds
      .map(name => {
        const template = packages.find(t => t.name === name)
        return template ? template.id : null
      })
      .filter((id): id is number => typeof id === "number")

    return mapped
  }, [preSelectedIds])

  const [selectedIds, setSelectedIds] = useState<number[]>(stabilizedPreSelectedIds)

  // Sync selectedIds with stabilizedPreSelectedIds
  useEffect(() => {
    setSelectedIds(prev => {
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
    onClick(selectedIds.map(id => packages[id - 1]))
  }, [selectedIds, onClick])

  // Filter templates based on search and showSelected
  useEffect(() => {
    let filtered = initialTemplates

    if (showSelected) {
      filtered = selectedIds.map(id => packages[id - 1])
    }

    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
        indices.push(id)
      } else {
        indices = indices.slice(0, findIndex).concat(indices.slice(findIndex + 1))
      }
      if (indices.length > numberOfSelection) {
        indices = indices.slice(indices.length - numberOfSelection)
      }
      setSelectedIds(indices)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header Section - Responsive */}
      <div className="sticky top-0 pb-4 bg-white z-30 flex sm:flex-row items-center gap-4">
        <label className="input border border-gray-300 flex items-center gap-2 w-full">
          <input
            type="text"
            className="grow rounded-lg"
            placeholder="search template by name"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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

      {/* Templates Grid - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2 max-h-[60vh] overflow-y-auto custom-scroll">
        {templates.length ? (
          templates.map(pkg => {
            return (
              <div
                key={pkg.id}
                className={clsx(
                  "relative cursor-pointer transition-all rounded-lg duration-200 border-2",
                  selectedIds.includes(pkg.id)
                    ? "border-blue-500"
                    : "border-transparent hover:border-gray-200"
                )}
                onClick={() => handlePackageSelect(pkg.id)}
                onKeyDown={e => e.key === "Enter" && handlePackageSelect(pkg.id)}
                role="button"
                tabIndex={0}
                aria-label={`Select ${pkg.name} template`}
              >
                <div className="bg-white rounded-md overflow-hidden shadow-sm h-full border border-gray-300">
                  <div className="relative">
                    <img
                      src={pkg.imgSrc || "/placeholder.svg"}
                      alt={pkg.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {pkg.paid && (
                      <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1 backdrop-blur-sm">
                        <Crown size={16} className="text-purple-600" aria-label="Pro feature" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{pkg.description}</p>
                  </div>
                </div>
              </div>
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

export default TemplateSelection
