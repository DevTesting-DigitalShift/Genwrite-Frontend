import axiosInstance from "."

export const fetchUserCreditLogs = async (params) => {
  const res = await axiosInstance.get("/user/credit-logs", { params })
  return res.data
}
