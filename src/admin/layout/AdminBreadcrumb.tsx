import { ChevronLeft, Home, Menu } from "lucide-react"
import { Fragment } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@components/ui/breadcrumb"
import { WriteAccessBanner } from "@admin/shared/components/WriteAccessBanner"
import { useSidebarToggle } from "./AdminSidebar"

const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  blogs: "Blogs",
  brands: "Brands",
  jobs: "Jobs",
  revenue: "Revenue",
  analytics: "Analytics",
  content: "Content",
}

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)

  const adminIndex = segments.indexOf("admin")
  if (adminIndex !== -1) {
    segments.splice(adminIndex, 1)
  }

  return segments.map((segment, index) => {
    const path = `/admin/${segments.slice(0, index + 1).join("/")}`
    const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    return { name, path, isLast: index === segments.length - 1 }
  })
}

export default function AdminBreadcrumb() {
  const location = useLocation()
  const navigate = useNavigate()
  const breadcrumbs = generateBreadcrumbs(location.pathname)
  const { toggleSidebar } = useSidebarToggle()

  if (location.pathname === "/admin/login" || location.pathname === "/admin") return null

  return (
    <div className="sticky top-0 z-20 flex w-full items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-white/80 backdrop-blur-md border-b border-gray-100/50 rounded-t-2xl">
      <button
        type="button"
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/admin/dashboard"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate("/admin/dashboard")
              }}
              className="flex items-center gap-1 sm:gap-1.5 text-gray-600 hover:text-gray-900"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Admin</span>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbs.map((crumb) => (
            <Fragment key={crumb.path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[100px] sm:max-w-none">
                    {crumb.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={crumb.path}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      navigate(crumb.path)
                    }}
                    className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 truncate max-w-[80px] sm:max-w-none"
                  >
                    {crumb.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto">
        <WriteAccessBanner />
      </div>
    </div>
  )
}
