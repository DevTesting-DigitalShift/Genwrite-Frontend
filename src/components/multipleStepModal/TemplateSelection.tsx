import { packages } from "@/data/templates"
import Loading from "@components/UI/Loading"
import { Empty, Input, message, Tooltip } from "antd"
import clsx from "clsx"
import { Crown, Search } from "lucide-react"
import { FC, useEffect, useState, Suspense, useMemo } from "react"

interface TemplateSelectionProps {
  numberOfSelection?: number
  userSubscriptionPlan: string
  onClick: Function
  preSelectedIds?: number[]
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
  const isProUser = !["free", "basic"].includes(userSubscriptionPlan)
  const [templates, setTemplates] = useState<BlogTemplate[]>(() => {
    if (isProUser) {
      return [...packages]
    }
    return [...packages].sort((a, b) => {
      return a.paid === b.paid ? 0 : a.paid ? 1 : -1
    })
  })

  // Memoize preSelectedIds to stabilize the reference
  const stabilizedPreSelectedIds = useMemo(() => preSelectedIds ?? [], [preSelectedIds])

  const [selectedIds, setSelectedIds] = useState<number[]>(stabilizedPreSelectedIds)

  // Sync selectedIds with stabilizedPreSelectedIds, but only if contents differ
  useEffect(() => {
    setSelectedIds(prev => {
      // Compare array contents to avoid unnecessary updates
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

  const handlePackageSelect = (id: number) => {
    // const pkg = packages.find(p => p.id === id)
    const pkg = packages[id - 1]
    if (!isProUser && pkg.paid) {
      message.error("Please upgrade to a Pro subscription or more to access this template.")
    } else {
      let indices = [...selectedIds]
      const findIndex = indices.indexOf(id)
      if (findIndex == -1) {
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
    <Suspense fallback={<Loading />}>
      <div className={`relative ${className}`}>
        <div className="sticky top-0 w-full pb-4 flex justify-center bg-white z-30">
          <Input.Search
            size="large"
            className="w-1/2 !h-full text-center "
            placeholder="search template by name"
            onSearch={(value, event, info) => {
              setTemplates(packages.filter(p => p.name.toLowerCase().includes(value.toLowerCase())))
            }}
            enterButton={<Search />}
            allowClear
          />
        </div>

        <div className="flex flex-wrap gap-4 !mt-4  justify-around w-full max-h-[60vh] overflow-y-auto">
          {templates.length ? (
            templates.map(pkg => {
              return (
                <div
                  key={pkg.id}
                  className={`relative cursor-pointer transition-all duration-200 w-[30%] py-2 ${clsx(
                    selectedIds.includes(pkg.id) && "border-blue-500 border-2 rounded-md"
                  )}`}
                  onClick={() => handlePackageSelect(pkg.id)}
                  onKeyDown={e => e.key === "Enter" && handlePackageSelect(pkg.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${pkg.name} template`}
                >
                  <div className="bg-white rounded-md overflow-hidden shadow-sm">
                    <div className="relative">
                      <img
                        src={pkg.imgSrc || "/placeholder.svg"}
                        alt={pkg.name}
                        className="w-full h-full object-cover"
                      />
                      {pkg.paid && (
                        <div className="absolute top-2 right-2">
                          <Crown
                            size={20}
                            style={{ color: "blueviolet" }}
                            aria-label="Pro feature"
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <Empty />
          )}
        </div>
        <style>{`
      .ant-input, .ant-input:focus, .ant-input-search .ant-input{
        border:none !important;
        height:100% !important;
      }

      ant-input-search .ant-input:focus, .ant-input-search .ant-input:hover{
        box-shadow:none !important;
      }
       
      `}</style>
      </div>
    </Suspense>
  )
}

export default TemplateSelection
