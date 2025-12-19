import React from "react"
import { motion } from "framer-motion"

const SnowAnimation = ({ density = 50 }) => {
  // Generate random snowflakes
  const snowflakes = Array.from({ length: density }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 10}s`,
    animationDuration: `${10 + Math.random() * 20}s`,
    fontSize: `${10 + Math.random() * 15}px`,
    opacity: 0.3 + Math.random() * 0.5,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {snowflakes.map(flake => (
        <motion.div
          key={flake.id}
          className="absolute text-white select-none"
          style={{
            left: flake.left,
            top: "-20px",
            fontSize: flake.fontSize,
            opacity: flake.opacity,
          }}
          animate={{
            y: ["0vh", "100vh"],
            x: [0, Math.random() * 100 - 50],
            rotate: [0, 360],
          }}
          transition={{
            duration: parseFloat(flake.animationDuration),
            delay: parseFloat(flake.animationDelay),
            repeat: Infinity,
            ease: "linear",
          }}
        >
          ❄
        </motion.div>
      ))}
    </div>
  )
}

export default SnowAnimation
