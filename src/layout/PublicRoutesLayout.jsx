import { Link, Outlet } from "react-router-dom"
import { motion } from "framer-motion"

const PublicRoutesLayout = () => {
  return (
    <div>
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default PublicRoutesLayout
