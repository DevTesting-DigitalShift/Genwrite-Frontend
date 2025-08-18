import axiosInstance from "." // make sure this points to your configured Axios instance

// 🟠 WordPress APIs
export const postToWordPressAPI = async ({ blogId, content, includeTableOfContents = true }) => {
  const response = await axiosInstance.post("/wordpress", {
    blogId,
    content,
    includeTableOfContents,
  })
  return response.data
}

export const rePostToWordPressAPI = async ({ blogId, content, includeTableOfContents = true }) => {
  const response = await axiosInstance.put("/wordpress", {
    blogId,
    content,
    includeTableOfContents,
  })
  return response.data
}

// 🔵 Stripe API
export const createStripeSession = async (payload) => {
  const response = await axiosInstance.post("/stripe/create-checkout-session", payload)
  return response.data
}

// 🔵 Stripe API
export const cancelStripeSubscription = async () => {
  const response = await axiosInstance.patch("/stripe/cancel-subscription")
  return response.data
}

export const humanizeContentGenerator = async (payload) => {
  const response = await axiosInstance.post("/generate/humanised-content", payload)
  return response.data
}

export const fetchCategories = async () => {
  const response = await axiosInstance.get("/wordpress/category")
  return response.data
}

export const createOutline = async (payload) => {
  const response = await axiosInstance.post("/generate/outline", payload)
  return response.data
}
