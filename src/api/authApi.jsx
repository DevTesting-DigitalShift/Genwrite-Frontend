import { useNavigate } from "react-router-dom"
import axiosInstance from "."

export const login = async (email, password) => {
  const response = await axiosInstance.post("/auth/login", { email, password })

  return response.data
}

export const signup = async (email, password, name) => {
  const response = await axiosInstance.post("/auth/register", {
    email,
    password,
    name,
  })

  return response.data
}

export const Userlogout = async () => {
  const response = await axiosInstance.get(`/auth/logout`)
  return response.data
}

export const loadUser = async (navigate) => {
  try {
    const response = await axiosInstance.get(`/auth/me`)

    if (response?.status === 401 || response?.status === 403) {
      localStorage.removeItem("token")
      navigate("/login")
    }

    return response.data
  } catch (error) {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      localStorage.removeItem("token")
      navigate("/login")
    }
    throw error
  }
}

export const forgotPasswordAPI = async (email) => {
  const response = await axiosInstance.post("/auth/forgot-password", { email })
  return response.data
}

export const resetPasswordAPI = async (token, newPassword) => {
  const response = await axiosInstance.post("/auth/reset-password", { token, newPassword })
  return response.data
}

export const loginWithGoogle = async (access_token) => {
  try {
    const response = await axiosInstance.post("/auth/google-signin", {
      access_token,
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Google login failed")
  }
}
