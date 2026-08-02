import { Outlet } from "react-router-dom"
import AdminBreadcrumb from "./AdminBreadcrumb"
import AdminSidebar from "./AdminSidebar"

export default function AdminShell() {
  return (
    <div className="flex h-screen bg-[#f2f2f2]">
      <AdminSidebar />
      <div className="flex flex-1 p-0 md:p-4 pl-0 flex-col h-screen">
        <main className="overflow-y-auto rounded-2xl no-scrollbar bg-white shadow-sm border border-gray-200">
          <AdminBreadcrumb />
          <div className="p-2 md:p-6 min-h-screen">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
