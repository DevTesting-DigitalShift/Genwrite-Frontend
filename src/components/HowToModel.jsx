"use client"

import React, { useState } from "react"

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6 text-gray-500 hover:text-gray-800"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const FeatureCarousel = ({ features }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0
    const newIndex = isFirstSlide ? features.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
  }

  const nextSlide = () => {
    const isLastSlide = currentIndex === features.length - 1
    const newIndex = isLastSlide ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
  }

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex)
  }

  return (
    <div className="relative h-[450px] w-full max-w-3xl mx-auto mb-8">
      {/* Carousel container */}
      <div className="relative h-full overflow-hidden rounded-lg shadow-lg bg-black">
        {/* Slides */}
        {features.map((feature, index) => (
          <div
            key={feature.id}
            className="absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out"
            style={{ opacity: index === currentIndex ? 1 : 0 }}
          >
            <iframe
              className="w-full h-full object-contain"
              src={feature.videoUrl}
              title={feature.title}
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Left Arrow */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-2 -translate-y-1/2 z-10 p-2 bg-white/50 rounded-full hover:bg-white/80 transition"
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Right Arrow */}
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-2 -translate-y-1/2 z-10 p-2 bg-white/50 rounded-full hover:bg-white/80 transition"
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 flex space-x-2">
        {features.map((_, slideIndex) => (
          <button
            key={slideIndex}
            onClick={() => goToSlide(slideIndex)}
            className={`h-3 w-3 rounded-full transition-colors duration-300 ${
              currentIndex === slideIndex ? "bg-indigo-600" : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${slideIndex + 1}`}
          ></button>
        ))}
      </div>
    </div>
  )
}

const WhatsNewModal = ({ onClose }) => {
  const features = [
    {
      id: 1,
      title: "AI Blog Generator",
      description:
        "Boost your blogging workflow with AI! Just enter a topic and our AI Blog Generator creates a complete, SEO-friendly blog in seconds. Save time, write quality content, and level up your productivity.",
      videoUrl:
        "https://www.youtube.com/embed/dAT1IQxhiqY?autoplay=0&mute=1&loop=1&playlist=dAT1IQxhiqY",
    },
    {
      id: 2,
      title: "Content Agent",
      description:
        "Meet your AI-powered Content Agent. From proofreading and rewriting to optimization and competitive analysis — this tool is built to make your writing smarter and sharper.",
      videoUrl:
        "https://www.youtube.com/embed/--4sbhhN05U?autoplay=0&mute=1&loop=1&playlist=--4sbhhN05U",
    },
    {
      id: 3,
      title: "Keyword to Blog",
      description:
        "Turn simple keywords into full-length, engaging blogs instantly. Our AI ensures SEO optimization and a natural human-like flow in every post.",
      videoUrl:
        "https://www.youtube.com/embed/dwIH4l5_P2Y?autoplay=0&mute=1&loop=1&playlist=dwIH4l5_P2Y",
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl transform rounded-xl bg-gray-100 p-6 pt-12 text-left align-middle shadow-2xl transition-all duration-300 ease-in-out scale-95 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 transition-colors duration-200 hover:bg-gray-200"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Our Functionality & Features</h2>
          <p className="mt-2 text-md text-gray-600">
            Let's go through with our features that enhance your experience.
          </p>
        </div>

        {/* Carousel Component */}
        <FeatureCarousel features={features} />
      </div>
      <style>{`
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  )
}

export default WhatsNewModal
