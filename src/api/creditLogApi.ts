import axiosInstance from "."

export const fetchUserCreditLogs = async (params?: Record<string, unknown>) => {
  const res = await axiosInstance.get("/user/credit-logs", { params })
  return res.data
}
