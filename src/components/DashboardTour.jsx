import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, ArrowLeft, Sparkles, Zap, MousePointer } from "lucide-react"

const DashboardTour = ({ run, onComplete, onOpenQuickBlog }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [targetRect, setTargetRect] = useState(null)
  const [waitingForUserAction, setWaitingForUserAction] = useState(false)

  const steps = [
    {
      target: null,
      title: "Welcome to GenWrite! 🎉",
      description:
        "We're excited to have you here! Let me show you how easy it is to create amazing blog content.",
      placement: "center",
      showNext: true,
    },
    {
      target: '[data-tour="analytics"]',
      title: "Quick Tools",
      description:
        "Here you'll find powerful tools for keyword research, performance monitoring, and competitive analysis to help you create better content.",
      placement: "bottom",
      showNext: true,
    },
    {
      target: '[data-tour="create-blog"]',
      title: "Click on Quick Blog",
      description:
        "Now, let's create your first blog! Click on the 'Quick Blog' card to get started.",
      placement: "bottom",
      showNext: false,
      waitForClick: true,
      instruction: "👆 Click the Quick Blog card above",
    },
    {
      target: '[data-tour="template-selector"]',
      title: "Choose a Template",
      description:
        "Select a template that matches your content type. Each template is optimized for different purposes. Choose one and click Next.",
      placement: "right",
      showNext: false,
      instruction: "Select a template and click Next",
    },
    {
      target: '[data-tour="blog-topic"]',
      title: "Fill in the Details",
      description:
        "Enter your blog topic and any other details about what you want to write. The more specific you are, the better your blog will be!",
      placement: "right",
      showNext: false,
      instruction: "Fill in your blog details",
    },
    {
      target: '[data-tour="submit-button"]',
      title: "Generate Your Blog! 🚀",
      description:
        "Click the Submit button and watch the magic happen! Your blog will be generated in just a few seconds.",
      placement: "top",
      showNext: false,
      instruction: "Click Submit to generate your blog",
    },
  ]

  useEffect(() => {
    if (run) {
      setIsVisible(true)
      setCurrentStep(0)
      setWaitingForUserAction(false)
    }
  }, [run])

  useEffect(() => {
    if (isVisible) {
      updateTargetRect()
      window.addEventListener("resize", updateTargetRect)
      window.addEventListener("scroll", updateTargetRect)

      // Listen for clicks on Quick Blog card
      if (currentStep === 2 && waitingForUserAction) {
        const quickBlogCard = document.querySelector('[data-tour="create-blog"]')
        if (quickBlogCard) {
          const handleClick = () => {
            if (onOpenQuickBlog) {
              onOpenQuickBlog()
            }
            setTimeout(() => {
              setCurrentStep(3)
              setWaitingForUserAction(false)
            }, 500)
          }
          quickBlogCard.addEventListener("click", handleClick)
          return () => {
            quickBlogCard.removeEventListener("click", handleClick)
            window.removeEventListener("resize", updateTargetRect)
            window.removeEventListener("scroll", updateTargetRect)
          }
        }
      }

      return () => {
        window.removeEventListener("resize", updateTargetRect)
        window.removeEventListener("scroll", updateTargetRect)
      }
    }
  }, [isVisible, currentStep, waitingForUserAction, onOpenQuickBlog])

  const updateTargetRect = () => {
    const step = steps[currentStep]
    if (!step?.target) {
      setTargetRect(null)
      return
    }

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    } else {
      setTargetRect(null)
    }
  }

  const handleNext = () => {
    const step = steps[currentStep]

    // If this step requires user to click Quick Blog
    if (step.waitForClick) {
      setWaitingForUserAction(true)
      return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0 && currentStep !== 3) {
      setCurrentStep(currentStep - 1)
      setWaitingForUserAction(false)
    }
  }

  const handleSkip = () => {
    setIsVisible(false)
    setWaitingForUserAction(false)
    if (onComplete) {
      onComplete()
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    setWaitingForUserAction(false)
    if (onComplete) {
      onComplete()
    }
  }

  const getTooltipPosition = () => {
    if (!targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }
    }

    const step = steps[currentStep]
    const padding = 20
    const tooltipWidth = 400

    switch (step.placement) {
      case "bottom":
        return {
          top: `${targetRect.top + targetRect.height + padding}px`,
          left: `${Math.min(targetRect.left, window.innerWidth - tooltipWidth - 20)}px`,
        }
      case "top":
        return {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${Math.min(targetRect.left, window.innerWidth - tooltipWidth - 20)}px`,
        }
      case "left":
        return {
          top: `${targetRect.top}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
        }
      case "right":
        return {
          top: `${targetRect.top}px`,
          left: `${targetRect.left + targetRect.width + padding}px`,
        }
      default:
        return {
          top: `${targetRect.top + targetRect.height + padding}px`,
          left: `${targetRect.left}px`,
        }
    }
  }

  if (!isVisible) return null

  const step = steps[currentStep]
  const tooltipPos = getTooltipPosition()

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Simple Overlay - allows clicks on highlighted element */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9998] pointer-events-none"
            style={{
              clipPath: targetRect
                ? `polygon(
                    0% 0%, 
                    0% 100%, 
                    ${targetRect.left - 8}px 100%, 
                    ${targetRect.left - 8}px ${targetRect.top - 8}px, 
                    ${targetRect.left + targetRect.width + 8}px ${targetRect.top - 8}px, 
                    ${targetRect.left + targetRect.width + 8}px ${
                    targetRect.top + targetRect.height + 8
                  }px, 
                    ${targetRect.left - 8}px ${targetRect.top + targetRect.height + 8}px, 
                    ${targetRect.left - 8}px 100%, 
                    100% 100%, 
                    100% 0%
                  )`
                : "none",
            }}
          />

          {/* Clickable area for highlighted element */}
          {targetRect && waitingForUserAction && (
            <div
              className="fixed z-[10001] cursor-pointer"
              style={{
                top: `${targetRect.top - 8}px`,
                left: `${targetRect.left - 8}px`,
                width: `${targetRect.width + 16}px`,
                height: `${targetRect.height + 16}px`,
              }}
              onClick={() => {
                // Trigger click on the actual element
                const element = document.querySelector('[data-tour="create-blog"]')
                if (element) {
                  element.click()
                }
              }}
            />
          )}

          {/* Highlighted Border */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: `${targetRect.top - 8}px`,
                left: `${targetRect.left - 8}px`,
                width: `${targetRect.width + 16}px`,
                height: `${targetRect.height + 16}px`,
                border: "3px solid #3B82F6",
                borderRadius: "12px",
                boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)",
              }}
            />
          )}

          {/* Pulsing pointer for click instruction */}
          {waitingForUserAction && targetRect && (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: `${targetRect.top + targetRect.height / 2 - 16}px`,
                left: `${targetRect.left + targetRect.width / 2 - 16}px`,
              }}
            >
              <MousePointer className="w-8 h-8 text-blue-500" />
            </motion.div>
          )}

          {/* Tooltip */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed z-[10000] bg-white rounded-xl shadow-2xl p-6 max-w-md pointer-events-auto"
            style={tooltipPos}
          >
            {/* Icon for welcome step */}
            {currentStep === 0 && (
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="pr-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 text-center">
                {step.description}
              </p>

              {/* Instruction for user action */}
              {step.instruction && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-blue-700 text-sm font-medium text-center">
                    {step.instruction}
                  </p>
                </div>
              )}

              {/* Progress */}
              <div className="flex items-center gap-2 mb-4">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Step counter */}
              <p className="text-xs text-gray-500 mb-4 text-center">
                Step {currentStep + 1} of {steps.length}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip Tour
                </button>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && currentStep < 3 && (
                    <button
                      onClick={handleBack}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  {step.showNext && (
                    <button
                      onClick={handleNext}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {currentStep === steps.length - 1 ? "Finish" : "Next"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default DashboardTour
