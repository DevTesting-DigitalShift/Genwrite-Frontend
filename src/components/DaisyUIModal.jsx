import { useState } from "react";


const DaisyUIModal = ({closeFnc}) => {
    const [step, setStep] = useState(1);

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);
  
   
    return (
        <div className="border-8 border-teal-700">
        <input type="checkbox" id="my-modal" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            {step === 1 && (
              <div>
                <h3 className="font-bold text-lg">Step 1</h3>
                <p className="py-4">Content for step 1 goes here.</p>
                <div className="modal-action">
                  <button className="btn border-8 border-teal-700" onClick={nextStep}>
                    Next
                  </button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <h3 className="font-bold text-lg">Step 2</h3>
                <p className="py-4">Content for step 2 goes here.</p>
                <div className="modal-action">
                  <button className="btn" onClick={prevStep}>
                    Previous
                  </button>
                  <button className="btn" onClick={nextStep}>
                    Next
                  </button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <h3 className="font-bold text-lg">Step 3</h3>
                <p className="py-4">Content for step 3 goes here.</p>
                <div className="modal-action">
                  <button className="btn" onClick={closeFnc}>
                    Previous
                  </button>
                  <label htmlFor="my-modal" className="btn">
                    Finish
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
}

export default DaisyUIModal