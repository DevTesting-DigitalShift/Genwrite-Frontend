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
    const endDate = new Date("2026-01-01T23:59:59").getTime()
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
      {/* Floating Button (Trigger) - Responsive positioning */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-4 sm:right-14 sm:bottom-6 z-[100] w-12 h-12 sm:w-14 sm:h-14 bg-[#1a3a6a] rounded-full shadow-2xl flex items-center justify-center text-white border-2 border-white/20 backdrop-blur-sm"
        >
          <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-4 sm:w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-blue-500 text-[9px] sm:text-[10px] items-center justify-center font-bold">
              !
            </span>
          </span>
        </motion.button>
      )}

      {/* Floating Sale Banner - Fully Responsive */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100, x: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 100, x: 100 }}
            className="fixed 
              left-4 right-4 bottom-4 
              sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px] 
              md:w-[420px]
              z-[1000] 
              bg-[#ffa0a0] 
              rounded-2xl 
              shadow-2xl 
              overflow-hidden 
              h-[28rem] sm:h-[30rem] md:h-[32rem]
              flex flex-col
              max-w-[95vw]"
          >
            {/* Background Content */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Snowflake accents - Responsive sizes */}
              <Sparkles className="absolute top-6 left-6 sm:top-8 sm:left-8 w-8 h-8 sm:w-10 sm:h-10 text-white/20 animate-pulse" />
              <Sparkles className="absolute top-20 left-3 sm:top-24 sm:left-4 w-5 h-5 sm:w-6 sm:h-6 text-white/10" />
              <Sparkles className="absolute top-4 right-12 sm:top-6 sm:right-16 w-6 h-6 sm:w-8 sm:h-8 text-white/20 animate-pulse" />

              {/* Illustration Background */}
              <div className="absolute inset-0 bg-[#0c2144] z-[-1]" />
              <div className="absolute bottom-0 left-0 w-full h-full">
                <img
                  src="/Images/sales.jpeg"
                  alt=""
                  className="w-full h-full object-cover object-bottom"
                />
              </div>
            </div>

            {/* Content Container - Responsive padding */}
            <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-4 flex flex-col items-center">
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-2 top-2 sm:right-4 sm:top-2 text-red-700 bg-white/80 rounded-full  transition-colors p-2"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" stroke="green" strokeWidth="3" />
              </button>

              {/* Countdown Timer - Responsive spacing and sizing */}
              <div className="flex gap-1.5 sm:gap-2 md:gap-2.5 mb-6 sm:mb-8 mt-8 sm:mt-10 md:mt-12">
                <TimeBlock value={timeLeft.days} label="DAYS" />
                <TimeBlock value={timeLeft.hrs} label="HRS" />
                <TimeBlock value={timeLeft.min} label="MIN" />
                <TimeBlock value={timeLeft.sec} label="SEC" />
              </div>

              {/* Promo Text - Responsive font sizes */}
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white text-center leading-[1.2] mb-6 sm:mb-8 px-2">
                50% OFF ON ALL PLANS
                <br />
                <span className="text-white">CHRISTMAS & NEW YEAR SPECIAL</span>
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const TimeBlock = ({ value, label }) => (
  <div className="backdrop-blur-md px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl sm:rounded-2xl min-w-[55px] sm:min-w-[60px] md:min-w-[65px] text-center border border-white/5 shadow-inner">
    <div className="text-lg sm:text-xl md:text-2xl font-black text-white leading-none mb-0.5 sm:mb-1">
      {String(value).padStart(2, "0")}
    </div>
    <div className="text-[8px] sm:text-[9px] text-white/40 font-bold tracking-tighter">{label}</div>
  </div>
)

export default WinterSaleBanner
