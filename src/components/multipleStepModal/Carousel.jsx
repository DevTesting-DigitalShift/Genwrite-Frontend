import React, { useState, useEffect } from "react";

const Carousel = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [length, setLength] = useState(children.length);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(React.Children.count(children) / itemsPerPage);

  useEffect(() => {
    setLength(React.Children.count(children));
  }, [children]);

  const next = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex((prevState) => prevState + 1);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevState) => prevState - 1);
    }
  };

  const shouldShowLeftArrow = currentIndex > 0;
  const shouldShowRightArrow = currentIndex < totalPages - 1;

  return (
    <div className="relative w-full">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          <div className="flex flex-nowrap min-w-full">
            {React.Children.toArray(children)
              .reduce((acc, child, index) => {
                if (index % itemsPerPage === 0) {
                  acc.push([]);
                }
                acc[acc.length - 1].push(child);
                return acc;
              }, [])
              .map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="grid grid-cols-4  gap-6 min-w-full px-2"
                >
                  {group.map((child, childIndex) => (
                    <div key={childIndex} className="w-full">
                      {child}
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>

      {shouldShowLeftArrow && (
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:text-gray-900 transition-all"
          aria-label="Previous templates"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {shouldShowRightArrow && (
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:text-gray-900 transition-all"
          aria-label="Next templates"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Carousel;
