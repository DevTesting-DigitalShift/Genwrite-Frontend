import axiosInstance from "." // make sure this points to your configured Axios instance

// 🟠 WordPress APIs
export const postToWordPressAPI = async ({ blogId, content, includeTableOfContents = true }) => {
  const response = await axiosInstance.post("/wordpress/post", {
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
