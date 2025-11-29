import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiGift } from "react-icons/fi"

// Memoized digit component - ONLY animates when value changes
// This ensures only the specific digit that changes will bounce
// e.g., if seconds go from 09 to 08, only the "9" -> "8" animates
const AnimatedDigit = React.memo(
  function AnimatedDigit({ value }) {
    return (
      <span className="inline-block w-[1ch] text-center overflow-hidden tabular-nums">
        <motion.span
          key={value} // ✅ ONLY this digit remounts
          initial={{ scale: 0.5, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </span>
    )
  },
  (prev, next) => prev.value === next.value
)

AnimatedDigit.displayName = "AnimatedDigit"

const TimeUnit = React.memo(
  function TimeUnit({ digit1, digit2, label }) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex gap-1">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-3 min-w-[35px] shadow-lg border-2 border-purple-400/30"
          >
            <div className="text-2xl font-bold text-white text-center">
              <AnimatedDigit value={digit1} />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-3 min-w-[35px] shadow-lg border-2 border-blue-400/30"
          >
            <div className="text-2xl font-bold text-white text-center">
              <AnimatedDigit value={digit2} />
            </div>
          </motion.div>
        </div>

        <span className="text-xs font-semibold text-gray-700 mt-2 uppercase tracking-wider">
          {label}
        </span>
      </div>
    )
  },
  (prev, next) =>
    prev.digit1 === next.digit1 && prev.digit2 === next.digit2 && prev.label === next.label
)

const CountdownTimer = ({ startDate, endDate, discount = "50%" }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: "loading",
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()

      let status = "loading"
      let difference = 0

      if (now < start) {
        status = "before"
        difference = start - now
      } else if (now >= start && now <= end) {
        status = "active"
        difference = end - now
      } else {
        status = "ended"
        return { days: 0, hours: 0, minutes: 0, seconds: 0, status }
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds, status }
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [startDate, endDate])

  // Memoize digit splitting to prevent recalculation
  const digits = useMemo(() => {
    return {
      days: String(timeLeft.days).padStart(2, "0").split(""),
      hours: String(timeLeft.hours).padStart(2, "0").split(""),
      minutes: String(timeLeft.minutes).padStart(2, "0").split(""),
      seconds: String(timeLeft.seconds).padStart(2, "0").split(""),
    }
  }, [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds])

  if (timeLeft.status === "ended") {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200/50 shadow-xl overflow-hidden backdrop-blur-sm bg-white/80"
    >
      {/* Decorative Christmas elements */}
      <div className="absolute top-0 right-0 text-6xl opacity-10 -rotate-12 filter hue-rotate-[240deg]">
        🎄
      </div>
      <div className="absolute bottom-0 left-0 text-5xl opacity-10 rotate-12">🎁</div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-5">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg mb-3"
          >
            <FiGift className="w-5 h-5" />
            🎅 CHRISTMAS & NEW YEAR SPECIAL ❄️
          </motion.div>

          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
            {discount} OFF ALL PLANS
          </h3>
          <p className="text-sm font-semibold text-gray-700">
            {timeLeft.status === "before" ? "Sale Starts In:" : "Sale Ends In:"}
          </p>
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-3 mb-4">
          <TimeUnit digit1={digits.days[0]} digit2={digits.days[1]} label="Days" />
          <TimeUnit digit1={digits.hours[0]} digit2={digits.hours[1]} label="Hours" />
          <TimeUnit digit1={digits.minutes[0]} digit2={digits.minutes[1]} label="Mins" />
          <TimeUnit digit1={digits.seconds[0]} digit2={digits.seconds[1]} label="Secs" />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            Limited time offer • New users only
          </p>
        </div>
      </div>

      {/* Subtle shine effect */}
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
      />
    </motion.div>
  )
}

export default CountdownTimer
