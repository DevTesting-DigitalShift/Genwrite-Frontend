import axiosInstance from ".";

export const login = async (email, password) => {
  const response = await axiosInstance.post("/auth/login", { email, password });

  return response.data;
};

export const signup = async (email, password, name) => {
  const response = await axiosInstance.post("/auth/register", {
    email,
    password,
    name,
  });

  return response.data;
};

export const Userlogout = async () => {
  const response = await axiosInstance.get(`/auth/logout`);
  return response.data;
};

export const loadUser = async () => {
  const response = await axiosInstance.get(`/auth/me`);
  return response.data;
};
