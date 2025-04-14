import React, { useState, useEffect } from "react";
import { FaQuestion } from "react-icons/fa6";

const QuestionButton = () => {
  const [visible, setVisible] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    setIsRotated(true);
    setTimeout(() => setIsRotated(false), 500);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <>
      <div className="fixed bottom-8 right-4">
        <button
          onClick={scrollToTop}
          className="p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none"
          aria-label="Scroll to top"
        >
          <div>
            <FaQuestion size={20} />
          </div>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-2xl font-semibold mb-4">
              Frequently Asked Questions
            </h2>
            <ul className="list-disc pl-5">
              <li className="mb-2">What is the purpose of this button?</li>
              <li className="mb-2">How does the scroll-to-top feature work?</li>
              <li className="mb-2">
                Can I customize the appearance of the button?
              </li>
              <li className="mb-2">Where can I find more information?</li>
            </ul>
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionButton;
