import React, { useState } from "react";

const FourStepModal = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    setCurrentStep(0);
    setIsModalOpen(false);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const stepsContent = [
    <div key={0} className="p-4">
      <h3 className="text-lg font-bold">Step 1</h3>
      <p>Enter details for step 1</p>
    </div>,
    <div key={1} className="p-4">
      <h3 className="text-lg font-bold">Step 2</h3>
      <p>Enter details for step 2</p>
    </div>,
    <div key={2} className="p-4">
      <h3 className="text-lg font-bold">Step 3</h3>
      <p>Enter details for step 3</p>
    </div>,
    <div key={3} className="p-4">
      <h3 className="text-lg font-bold">Step 4</h3>
      <p>Enter details for step 4</p>
    </div>,
  ];

  return (
    <div className="text-center mt-8">
      <button
        className="btn btn-primary"
        onClick={() => setIsModalOpen(true)}
      >
        Open 4-Step Modal
      </button>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box relative">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={handleCancel}
            >
              ✕
            </button>

            {stepsContent[currentStep]}

            <div className="modal-action justify-between mt-4">
              <button
                className={`btn ${currentStep === 0 ? "btn-disabled" : "btn-secondary"}`}
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                Previous
              </button>

              {currentStep < 3 ? (
                <button className="btn btn-primary" onClick={handleNext}>
                  Next
                </button>
              ) : (
                <button className="btn btn-success" onClick={handleCancel}>
                  Finish
                </button>
              )}
            </div>

            {/* Progress Indicator */}
            <progress
              className="progress progress-primary w-full mt-4"
              value={currentStep + 1}
              max="4"
            ></progress>
            <p className="text-sm mt-2">
              Step {currentStep + 1} of 4
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FourStepModal;
