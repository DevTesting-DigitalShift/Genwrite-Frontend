import { Navigate, Outlet } from "react-router-dom";
import LayoutWithSidebarAndHeader from "@components/Layout.jsx";
import LoadingOverlay from "@components/LoadingOverlay";

const PrivateRoutesLayout = () => {
  // Retrieve token from local storage
  const token = localStorage.getItem("token");
  // Check if token exists
  return token ? (
    <>
    <LoadingOverlay />
    <div className="flex">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header at the top */}
        <LayoutWithSidebarAndHeader />
        <div className="flex-1 ml-20 mt-20 p-6 pt-4">
          <Outlet />
        </div>
      </div>
    </div>
    </>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoutesLayout;
