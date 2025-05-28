import { Suspense, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import Loading from "@components/Loading";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { load } from "@store/slices/authSlice";
import { NotificationProvider } from "./context/NotificationsContext";

const App = () => {
  const dispatch = useDispatch();

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await load()(dispatch);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  return (
    <NotificationProvider>
      <RouterProvider router={router} />
      <ToastContainer />
    </NotificationProvider>
  );
};

export default App;
