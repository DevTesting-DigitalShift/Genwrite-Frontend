import axiosInstance from '.';

export const getProfile = async () => {
  const response = await axiosInstance.get('/user/profile');
  return response.data;
};
