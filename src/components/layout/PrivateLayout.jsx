import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar"; // Adjust import paths as needed

const PrivateLayout = () => {
  return (
    <div>
      {/* <Sidebar /> */}
      <Outlet /> {/* Render child routes here */}
    </div>
  );
};

export default PrivateLayout;
