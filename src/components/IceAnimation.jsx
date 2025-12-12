import React from "react"
import { motion } from "framer-motion"

const IceAnimation = ({ density = 40 }) => {
  // Different ice crystal shapes with varying sizes
  const iceShapes = ["❄", "◇", "✧", "❆"]

  // Generate random ice crystals with blue tint
  const iceCrystals = Array.from({ length: density }, (_, i) => {
    const shape = iceShapes[Math.floor(Math.random() * iceShapes.length)]
    const size = 18 + Math.random() * 12 // 12-30px range

    return {
      id: i,
      shape,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${15 + Math.random() * 20}s`, // Slower for ice
      fontSize: `${size}px`,
      opacity: 0.4 + Math.random() * 0.4, // 0.4-0.8 for visibility
    }
  })

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {iceCrystals.map(ice => (
        <motion.div
          key={ice.id}
          className="absolute select-none"
          style={{
            left: ice.left,
            top: "-30px",
            fontSize: ice.fontSize,
            opacity: ice.opacity,
            color: "#BFDBFE", // Light blue color
            filter: "drop-shadow(0 0 1px rgba(59, 130, 246, 0.6))", // Blue glow
          }}
          animate={{
            y: ["0vh", "105vh"],
            x: [0, Math.random() * 80 - 40], // Horizontal drift
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)], // Random rotation direction
          }}
          transition={{
            duration: parseFloat(ice.animationDuration),
            delay: parseFloat(ice.animationDelay),
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {ice.shape}
        </motion.div>
      ))}
    </div>
  )
}

export default IceAnimation
