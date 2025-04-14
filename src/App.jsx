import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import SidebarResponsive from "./SidebarResponsive";
import PrivateRoutes from "./components/layout/PrivateRoute";
import Login from "./components/auth/Login";
import ToolBox from "./components/toolbox/ToolBox";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Testing from "./components/Testing";
import MyProjects from "./components/Projects/MyProjects";
import ParticularBlogPage from "./components/Projects/ParticularBlogPage";
import Dashboard from "./components/Dashboard";
import PluginsMain from "./components/plugins/PluginsMain";
import BrandVoice from "./components/brandvoice/BrandVoice";
import MainHeaderBar from "./components/MainHeaderBar"; // Import the MainHeaderBar component
import "./App.css";
import FourStepModal from "./components/FourStepModal";
import ErrorPage from "./components/ErrorPage";
import LayoutWithSidebarAndHeader from "./components/Layout";
import { useDispatch } from "react-redux";
import { load } from "./store/slices/authSlice";
import ToolboxPage from "./components/toolbox/toolboxSettings";

const App = () => {
  const dispatch = useDispatch();

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await dispatch(load());
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    // console.log("hello");
    loadCurrentUser();
  }, []);

  return (
    <>
      <Testing />
      <div className="flex">
        {/* Sidebar on the left */}
        {/* <SidebarResponsive /> */}

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Header at the top */}
          <LayoutWithSidebarAndHeader />
          {/* <MainHeaderBar /> */}

          {/* Routes below the header */}
          <div className="flex-1">
            <Routes>
              <Route element={<PrivateRoutes />}>
                <Route path="/dash" element={<Dashboard />} />
                <Route path="/toolbox" element={<ToolboxPage />} />
                <Route path="/editor" element={<ToolBox />} />
                <Route path="/toolbox/:id" element={<ToolBox />} />
                <Route path="/project" element={<MyProjects />} />
                <Route path="/plugins" element={<PluginsMain />} />
                <Route path="/brandVoice" element={<BrandVoice />} />
                <Route path="*" element={<ErrorPage />} />
              </Route>

              <Route path="/login" element={<Login path={"login"} />} />
              <Route path="/signup" element={<Login path={"signup"} />} />
            </Routes>
          </div>
        </div>
      </div>

      <ToastContainer />
    </>
  );
};

export default App;
