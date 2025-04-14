import { Navigate, Outlet } from "react-router-dom";
import PrivateLayout from "./PrivateLayout.jsx";

const PrivateRoutes = () => {
  // Retrieve token from local storage
  const token = localStorage.getItem("token");

  // Check if token exists
  return token ? (
    <PrivateLayout>
      <Outlet />
    </PrivateLayout>
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoutes;
