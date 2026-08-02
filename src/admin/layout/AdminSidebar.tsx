import {
  BriefcaseBusiness,
  ChartArea,
  CreditCard,
  FileText,
  Folder,
  Landmark,
  LogOut,
  NotebookPen,
  Users,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog"
import { logout } from "@admin/auth/authToken"

const menuItems = [
  { icon: Folder, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: NotebookPen, label: "Blogs", href: "/admin/blogs" },
  { icon: ChartArea, label: "Brands", href: "/admin/brands" },
  { icon: BriefcaseBusiness, label: "Jobs", href: "/admin/jobs" },
  { icon: CreditCard, label: "Transactions", href: "/admin/transactions" },
  { icon: Landmark, label: "Revenue", href: "/admin/revenue" },
  { icon: FileText, label: "Content", href: "/admin/content" },
]

// Shared toggle state so AdminBreadcrumb's hamburger button can open this sidebar.
let sidebarToggleCallback: (() => void) | null = null
let sidebarIsOpen = false

export function useSidebarToggle() {
  return { toggleSidebar: () => sidebarToggleCallback?.(), isOpen: sidebarIsOpen }
}

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    sidebarIsOpen = isOpen
    sidebarToggleCallback = () => setIsOpen(!isOpen)
  }, [isOpen])

  const handleLogout = () => {
    logout()
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full bg-gray-100 w-60 flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 shadow-2xl lg:shadow-none`}
      >
        <div className="p-6 relative shrink-0">
          <button
            type="button"
            onClick={closeSidebar}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          <div className="flex flex-col items-center justify-center space-y-3">
            <img
              src="/Images/logo_genwrite.svg"
              alt="GenWrite Logo"
              width={170}
              height={170}
              className="object-cover"
            />
          </div>
        </div>

        <hr className="border-t border-gray-200 mb-2 w-50 ml-4 shrink-0" />

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  navigate(item.href)
                  closeSidebar()
                }}
                className={`w-full flex items-center space-x-3 font-semibold px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-white text-gray-800 border border-gray-200 shadow-[0_0_1px_rgba(0,0,0,0.1)]"
                    : "text-gray-700 hover:bg-white hover:shadow-sm"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 shrink-0 mt-auto">
          <hr className="border-t border-gray-200 mb-4 w-50 ml-1" />
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 border-2 border-red-200 text-red-600 bg-red-50 hover:border-red-300 hover:shadow-md font-semibold group"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Confirm Logout</DialogTitle>
                <DialogDescription className="text-gray-500 pt-2">
                  Are you sure you want to log out of the admin panel? You will need to sign in
                  again to access your dashboard.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6 gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1 rounded-lg border-gray-300">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Confirm Logout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </aside>
    </>
  )
}
