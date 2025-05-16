import { useState, useEffect } from "react";
import Modal from "../utils/Modal";
import SelectTemplateModal from "./mutipstepmodal/SelectTemplateModal";
import FirstStepModal from "./mutipstepmodal/FirstStepModal";
import SecondStepModal from "./mutipstepmodal/SecondStepModal";
import ThirdStepModal from "./mutipstepmodal/ThirdStepModal";
import { letsBegin, quickTools } from "./dashdata/dash";
import DashboardBox, { QuickBox, RecentProjects } from "../utils/DashboardBox";
import QuestionButton from "../utils/QuestionButton";
import { useDispatch, useSelector } from "react-redux";
import { createNewBlog } from "@store/slices/blogSlice";
import { useNavigate } from "react-router-dom";
import MultiStepModal from "./mutipstepmodal/DaisyUi";
import DaisyUIModal from "./DaisyUIModal";
import QuickBlogModal from "./mutipstepmodal/QuickBlogModal";
import CompetitiveAnalysisModal from "./mutipstepmodal/CompetitiveAnalysisModal";
import axiosInstance from "@api/index";
import { setUser } from "@store/slices/authSlice";

const Dashboard = () => {
  // State declarations
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [daisyUIModal, setDaisyUIModal] = useState(false);
  const [multiStepModal, setMultiStepModal] = useState(false);
  const [quickBlogModal, setQuickBlogModal] = useState(false);
  const [competitiveAnalysisModal, setCompetitiveAnalysisModal] = useState(false);
  const [modelData, setModelData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [recentBlogData, setRecentBlogData] = useState([]);

  // Hooks
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Only fetch if we don't have complete user data
        if (!user?._id || !user?.name) {
          const response = await axiosInstance.get("/auth/me");

          if (response.data.success && response.data.user) {
            const userData = {
              _id: response.data.user._id,
              name: response.data.user.name,
              email: response.data.user.email,
              avatar: response.data.user.avatar,
              interests: response.data.user.interests,
            };
            // Ensure we have all required fields before dispatching
            if (userData._id && userData.name) {
              dispatch(setUser(userData));
            }
          }
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };

    loadUserData();
  }, [dispatch, navigate, user?._id]);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axiosInstance.get("/blogs/");
        const allBlogs = response.data;

        console.log(allBlogs.filter((e) => e.status == "complete"));
        if (allBlogs.length >= 3) {
          const lastThreeBlogs = allBlogs.filter((e) => e.status == "complete").slice(-3);
          setRecentBlogData(lastThreeBlogs);
        }
      } catch (error) {
        console.error(
          "Error fetching blogs:",
          error.response?.data?.message || "Failed to fetch blogs"
        );
      }
    };

    fetchBlogs();
  }, []);

  // Event handlers
  const showModal = () => setIsModalVisible(true);
  const showDaisy = () => setDaisyUIModal(true);
  const hideDaisy = () => setDaisyUIModal(false);
  const showMultiStepModal = () => setMultiStepModal(true);
  const hideMultiStepModal = () => setMultiStepModal(false);
  const showQuickBlogModal = () => setQuickBlogModal(true);
  const hideQuickBlogModal = () => setQuickBlogModal(false);
  const showCompetitiveAnalysis = () => setCompetitiveAnalysisModal(true);
  const hideCompetitiveAnalysis = () => setCompetitiveAnalysisModal(false);

  const handleSubmit = (updatedData) => {
    try {
      dispatch(createNewBlog(updatedData, navigate));
      setIsModalVisible(false);
      setCurrentStep(0);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentStep(0);
  };

  const handleNext = () => setCurrentStep(currentStep + 1);
  const handlePrev = () => setCurrentStep(currentStep - 1);

  console.log({ modelData });

  return (
    <>
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
          <progress className="w-full max-w-md" max="3" value={currentStep}></progress>
        </div>
      </Modal>

      {daisyUIModal && <DaisyUIModal closefnc={hideDaisy} />}

      {multiStepModal && <MultiStepModal closefnc={hideMultiStepModal} />}

      {quickBlogModal && <QuickBlogModal closefnc={hideQuickBlogModal} />}

      {competitiveAnalysisModal && <CompetitiveAnalysisModal closefnc={hideCompetitiveAnalysis} />}

      <div className="">
        <h3 className="text-[24px] font-[600] mb-8 font-montserrat">Let's Begin </h3>

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
                showCompetitiveAnalysis,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 ">
        <h3 className="text-[24px] font-[600] mb-8 font-montserrat">Quick Tools</h3>
        <div className="grid m-4 gap-10 sm:grid-cols-4 bg-white p-4">
          {quickTools.map((item, index) => {
            return (
              <QuickBox
                key={index}
                imageUrl={item.imageUrl}
                title={item.title}
                content={item.content}
                id={item.id}
                functions={{
                  showCompetitiveAnalysis,
                }}
              />
            );
          })}
        </div>
      </div>

      {recentBlogData.length > 0 && (
        <div className="mt-5 ">
          <div className="mt-8 mb-8 flex justify-between items-center">
            <h3 className="text-[24px] font-[600] font-montserrat">Recent Projects</h3>
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
      )}
      <div className="">
        <QuestionButton />
      </div>
    </>
  );
};

export default Dashboard;
