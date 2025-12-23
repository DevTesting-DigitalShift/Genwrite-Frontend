import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Gift, Sparkles } from "lucide-react"
import { message } from "antd"

const WinterSaleBanner = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hrs: 0,
    min: 0,
    sec: 0,
  })

  // Calculate time remaining until Dec 31, 2025 12:00 AM
  const calculateTimeLeft = () => {
    const endDate = new Date("2025-12-31T00:00:00").getTime()
    const now = new Date().getTime()
    const difference = endDate - now

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hrs: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        min: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        sec: Math.floor((difference % (1000 * 60)) / 1000),
      }
    }
    return { days: 0, hrs: 0, min: 0, sec: 0 }
  }

  useEffect(() => {
    const hasSeenSale = sessionStorage.getItem("hasSeenWinterSale")
    if (!hasSeenSale) {
      const timer = setTimeout(() => {
        setIsOpen(true)
        sessionStorage.setItem("hasSeenWinterSale", "true")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    // Set initial time
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {/* Floating Button (Trigger) */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed right-14 bottom-6 z-[100] w-14 h-14 bg-[#1a3a6a] rounded-full shadow-2xl flex items-center justify-center text-white border-2 border-white/20 backdrop-blur-sm"
        >
          <Gift className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative flex rounded-full h-4 w-4 bg-blue-500 text-[10px] items-center justify-center font-bold">
              !
            </span>
          </span>
        </motion.button>
      )}

      {/* Floating Sale Banner (Bottom-Right) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100, x: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 100, x: 100 }}
            className="fixed right-6 bottom-6 z-[1000] w-[360px] sm:w-[400px] bg-[#0c2144] rounded-2xl shadow-2xl overflow-hidden h-[32rem] flex flex-col"
          >
            {/* Background Content */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Snowflake accents */}
              <Sparkles className="absolute top-8 left-8 w-10 h-10 text-white/20 animate-pulse" />
              <Sparkles className="absolute top-24 left-4 w-6 h-6 text-white/10" />
              <Sparkles className="absolute top-6 right-16 w-8 h-8 text-white/20 animate-pulse" />

              {/* Illustration Background */}
              <div className="absolute inset-0 bg-[#0c2144] z-[-1]" />
              <div className="absolute bottom-0 left-0 w-full h-full">
                <img
                  src="/Images/sales.svg"
                  alt=""
                  className="w-full h-full object-cover object-bottom"
                />
              </div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 px-8 pt-8 pb-4 flex flex-col items-center">
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-2 text-white/40 hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Countdown Timer */}
              <div className="flex gap-2.5 mb-8">
                <TimeBlock value={timeLeft.days} label="DAYS" />
                <TimeBlock value={timeLeft.hrs} label="HRS" />
                <TimeBlock value={timeLeft.min} label="MIN" />
                <TimeBlock value={timeLeft.sec} label="SEC" />
              </div>

              {/* Promo Text */}
              <h2 className="text-2xl font-black text-white text-center leading-[1.2] mb-8 tracking-tight">
                Give a little, get a lot.
                <br />
                <span className="text-blue-400">Refer 3 friends</span>, get 3 months of Premium.
              </h2>
            </div>

            {/* Footer */}
            {/* <div className="relative z-10 py-4 px-6 border-t mt-auto">
              <p className="text- text-xs text-center font-bold tracking-tight">
                Refer 3 friends and unlock 3 months of Premium free!
              </p>
            </div> */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const TimeBlock = ({ value, label }) => (
  <div className="bg-[#1a2e52]/80 backdrop-blur-md px-3 py-2.5 rounded-2xl min-w-[65px] text-center border border-white/5 shadow-inner">
    <div className="text-xl font-black text-white leading-none mb-1">
      {String(value).padStart(2, "0")}
    </div>
    <div className="text-[9px] text-white/40 font-bold tracking-tighter">{label}</div>
  </div>
)

export default WinterSaleBanner
