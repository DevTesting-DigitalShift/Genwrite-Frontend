import { useDispatch } from "react-redux";
import { setUser, setToken } from "../features/authSlice";
import axiosInstance from "../services/axiosInstance";

const useAuth = () => {
  const dispatch = useDispatch();

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post("/login", { email, password });
      if (response.data.token) {
        dispatch(setToken(response.data.token));
        dispatch(setUser(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (email, password, name) => {
    try {
      const response = await axiosInstance.post("/register", {
        email,
        password,
        name,
      });
      if (response.data.token) {
        dispatch(setToken(response.data.token));
        dispatch(setUser(response.data.user));
      }
      return response.data.user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  return { login, signup };
};

export default useAuth;
