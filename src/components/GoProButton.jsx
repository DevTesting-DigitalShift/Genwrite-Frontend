import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Crown } from "lucide-react"
import useAuthStore from "@store/useAuthStore"

const GoProButton = () => {
  const { user } = useAuthStore()
  const [userPlan, setUserPlan] = useState("")

  useEffect(() => {
    setUserPlan(user?.subscription?.plan || "")
  }, [user])

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative hidden sm:block"
      hidden={userPlan === "enterprise"}
    >
      <Link
        to="/pricing"
        className="btn border-none bg-linear-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold font-montserrat tracking-wide py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 group capitalize no-underline h-auto min-h-auto"
      >
        <Crown className="size-5" /> {userPlan === "pro" ? "Upgrade" : "Go Pro"}
      </Link>
      <div className="shimmer absolute inset-0 rounded-full pointer-events-none" />
    </motion.div>
  )
}

export default GoProButton
