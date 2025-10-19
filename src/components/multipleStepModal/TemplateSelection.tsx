import { packages } from "@/data/templates"
import { Empty, Input, message, Tooltip } from "antd"
import { Crown } from "lucide-react"
import { FC, useEffect, useState } from "react"

interface TemplateSelectionProps {
  numberOfSelection?: number
  userSubscriptionPlan: string
  onClick: Function
  preSelectedIds?: number[]
  className?: string
}

const TemplateSelection: FC<TemplateSelectionProps> = ({
  numberOfSelection = 1,
  userSubscriptionPlan,
  preSelectedIds,
  onClick,
  className = "",
}) => {
  const isProUser = !["free", "basic"].includes(userSubscriptionPlan)
  const [templates, setTemplates] = useState(() => {
    if (isProUser) {
      return [...packages]
    }
    return [...packages].sort((a, b) => {
      return a.paid === b.paid ? 0 : a.paid ? 1 : -1
    })
  })

  const [selectedIds, setSelectedIds] = useState<number[]>(preSelectedIds ?? [])

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

  useEffect(() => {
    onClick(selectedIds.map(id => packages[id - 1]))
  }, [selectedIds])

  return (
    <div className={`relative ${className}`}>
      <div className="sticky top-0 w-full p-2 pb-4 flex justify-center bg-white z-30">
        <Input.Search
          size="middle"
          className="w-1/2 text-center "
          placeholder="search template by name"
          onSearch={(value, event, info) => {
            setTemplates(packages.filter(p => p.name.toLowerCase().includes(value.toLowerCase())))
          }}
          enterButton
          allowClear
        />
      </div>

      <div className="flex flex-wrap gap-4 !mt-4  justify-around w-full max-h-[60vh] overflow-y-auto">
        {templates.length ? (
          templates.map(pkg => (
            <div
              key={pkg.id}
              className={`relative cursor-pointer transition-all duration-200 w-[30%] py-2 ${
                selectedIds.includes(pkg.id) ? "border-blue-500 border-2 rounded-md" : ""
              }`}
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
                      <Crown size={20} style={{ color: "blueviolet" }} aria-label="Pro feature" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-base mb-1">{pkg.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{pkg.description}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <Empty />
        )}
      </div>
      <style>{`
      .ant-input, .ant-input:focus, .ant-input-search .ant-input{
        border:none !important;
      }

      ant-input-search .ant-input:focus, .ant-input-search .ant-input:hover{
        box-shadow:none !important;
      }
       
      `}</style>
    </div>
  )
}

export default TemplateSelection
