import React, { useState, useEffect } from "react";
import Modal from "../utils/Modal";
import SelectTemplateModal from "./mutipstepmodal/SelectTemplateModal";
import FirstStepModal from "./mutipstepmodal/FirstStepModal";
import SecondStepModal from "./mutipstepmodal/SecondStepModal";
import ThirdStepModal from "./mutipstepmodal/ThirdStepModal";
import { letsBegin, quickTools, recentProjects } from "./dashdata/dash";
import DashboardBox, { QuickBox, RecentProjects } from "../utils/DashboardBox";
import QuestionButton from "../utils/QuestionButton";
import { useDispatch, useSelector } from "react-redux";
import { createNewBlog } from "../store/slices/blogSlice";
import { useNavigate } from "react-router-dom";
import TailwindcssLayout from "../TailwindcssLayout";
import MultiStepModal from "./mutipstepmodal/DaisyUi";
import DaisyUIModal from "./DaisyUIModal";
import QuickBlogModal from "./mutipstepmodal/QuickBlogModal";
import axiosInstance from "../api";

const Dashboard = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [daisyUIModal, setDaisyUIModal] = useState(false);
  const [multiStepModal, setMultiStepModal] = useState(false);
  const [quickBlogModal, setQuickBlogModal] = useState(false);
  const [modelData, setModelData] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const showDaisy = () => {
    setDaisyUIModal(true);
  };

  const hideDaisy = () => {
    setDaisyUIModal(false);
  };

  const showMultiStepModal = () => {
    setMultiStepModal(true);
  };

  const hideMultiStepModal = () => {
    setMultiStepModal(false);
  };

  const showQuickBlogModal = () => {
    setQuickBlogModal(true);
  };

  const hideQuickBlogModal = () => {
    setQuickBlogModal(false);
  };

  const handleSubmit = (updatedData) => {
    try {
      // Instead of using modelData, use the updatedData directly
      console.log("Updated Data in handleSubmit:", updatedData);

      // Dispatch the action with the latest updated data
      dispatch(createNewBlog(updatedData, navigate));

      // Close the modal and reset the step
      setIsModalVisible(false);
      setCurrentStep(0);

      // Log success message
      console.log("Form submitted successfully");
    } catch (error) {
      // Log any errors for debugging
      console.error("Error submitting form:", error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentStep(0);
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  console.log({ modelData });

  const [recentBlogData, setrecentBlogData] = useState([]);
  const fetchBlogs = async () => {
    try {
      const response = await axiosInstance.get("/blogs/getAllBlogs");
      const allBlogs = response.data;

      // Check if there are at least 3 blogs
      if (allBlogs.length >= 3) {
        // Get the last 3 blogs from the fetched data
        const lastThreeBlogs = allBlogs.slice(-3);

        // Update the state with the last 3 blogs
        setrecentBlogData(lastThreeBlogs);

        console.log(lastThreeBlogs);
      } else if (allBlogs.length > 0) {
        // If there are less than 3 blogs, return all of them
        setRecentBlogData(allBlogs);

        console.log(allBlogs);
      } else {
        console.log("No blogs found.");
      }
    } catch (error) {
      console.error(
        "Error fetching blogs:",
        error.response?.data?.message || "Failed to fetch blogs"
      );
    }
  };
  useEffect(() => {
    fetchBlogs();
  }, []);
  return (
    <div className="p-7 ml-20 mt-12">
      <Modal
        title={`Step ${currentStep}/3`}
        visible={isModalVisible}
        onCancel={handleCancel}
        className=""
      >
        {currentStep === 0 && (
          <SelectTemplateModal
            handleNext={handleNext}
            handleClose={handleCancel}
            data={modelData}
            setData={setModelData}
          />
        )}
        {currentStep === 1 && (
          <FirstStepModal
            handleNext={handleNext}
            handleClose={handleCancel}
            handlePrevious={handlePrev}
            data={modelData}
            setData={setModelData}
          />
        )}
        {currentStep === 2 && (
          <SecondStepModal
            handleNext={handleNext}
            handlePrevious={handlePrev}
            handleClose={handleCancel}
            data={modelData}
            setData={setModelData}
          />
        )}
        {currentStep === 3 && (
          <ThirdStepModal
            handlePrevious={handlePrev}
            handleSubmit={handleSubmit}
            handleClose={handleCancel}
            data={modelData}
            setData={setModelData}
          />
        )}
        <div className="flex items-center justify-center mt-4">
          <progress
            className="w-full max-w-md"
            max="3"
            value={currentStep}
          ></progress>
        </div>
      </Modal>

      {daisyUIModal && <DaisyUIModal closefnc={hideDaisy} />}

      {multiStepModal && <MultiStepModal closefnc={hideMultiStepModal} />}

      {quickBlogModal && <QuickBlogModal closefnc={hideQuickBlogModal} />}

      <div className="">
        <h3 className="text-[24px] font-[600] mb-8 font-montserrat">
          Let's Begin{" "}
        </h3>

        <div className="flex justify-between items-center gap-8 p-4 bg-white sm:flex-wrap md:flex-nowrap">
          {letsBegin.map((item, index) => (
            <DashboardBox
              key={index}
              imageUrl={item.imageUrl}
              title={item.title}
              content={item.content}
              id={item.id}
              functions={{
                showModal,
                setModelData,
                showDaisy,
                showMultiStepModal,
                showQuickBlogModal,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 ">
        <h3 className="text-[24px] font-[600] mb-8 font-montserrat">
          Quick Tools
        </h3>
        <div className="grid m-4 gap-10 sm:grid-cols-4 bg-white p-4">
          {quickTools.map((item, index) => {
            return (
              <QuickBox
                key={index}
                imageUrl={item.imageUrl}
                title={item.title}
                content={item.content}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-5 ">
        <div className="mt-8 mb-8 flex justify-between items-center">
          <h3 className="text-[24px] font-[600] font-montserrat">
            Recent Projects
          </h3>
          <span className="mr-5">
            <select
              name=""
              id=""
              className="font-hind text-md p-1 border-1 border-black bg-blue-50 rounded-xl"
            >
              <option className="font-hind" value="">
                Top Performing
              </option>
            </select>
          </span>
        </div>
        <div className="grid m-4 gap-10 sm:grid-cols-3">
          {recentBlogData.map((item, index) => {
            return (
              <RecentProjects
                key={index}
                title={item.title}
                content={item.content}
                tags={item.focusKeywords}
                item={item}
              />
            );
          })}
        </div>
      </div>
      <div className="">
        <QuestionButton />
      </div>
    </div>
  );
};

export default Dashboard;
