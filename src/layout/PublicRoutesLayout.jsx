import { Link, Outlet } from "react-router-dom"
import { motion } from "framer-motion"

const PublicRoutesLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default PublicRoutesLayout
