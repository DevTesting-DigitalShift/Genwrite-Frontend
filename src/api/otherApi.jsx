import axiosInstance from "."

// 🔵 Stripe API
export const createStripeSession = async payload => {
  const response = await axiosInstance.post("/stripe/create-checkout-session", payload)
  return response.data
}

// 🔵 Stripe API
export const cancelStripeSubscription = async () => {
  const response = await axiosInstance.patch("/stripe/cancel-subscription")
  return response.data
}

export const createPortalSession = async returnUrl => {
  const response = await axiosInstance.get("/stripe/portal", { params: { returnUrl } })
  return response.data
}

export const humanizeContentGenerator = async payload => {
  const response = await axiosInstance.post("/generate/humanised-content", payload)
  return response.data
}

export const fetchCategories = async type => {
  const response = await axiosInstance.get(`/integrations/category?type=${type}`)
  return response.data
}

export const fetchIntegrations = async () => {
  const res = await axiosInstance.get("/integrations")
  return res.data
}

export const pingIntegration = async type => {
  const res = await axiosInstance.get(`/integrations/ping?type=${type}`)
  return res.data
}

export const createIntegration = async payload => {
  const res = await axiosInstance.post("/integrations", payload)
  return res.data
}

export const createOutline = async payload => {
  const response = await axiosInstance.post("/generate/outline", payload)
  return response.data
}

export const generateMetadata = async payload => {
  const response = await axiosInstance.post("/generate/metadata", payload)
  return response.data
}

// Generate blog content with custom prompt
export const generatePromptContent = async ({ prompt, content }) => {
  try {
    const response = await axiosInstance.post("/generate/prompt-content", { prompt, content })
    return response.data
  } catch (error) {
    throw new Error(error || "Failed to generate prompt content")
  }
}

// Unsubscribe API
export const unsubscribeUser = async email => {
  try {
    const res = await axiosInstance.get(`/public/unsubscribe?email=${encodeURIComponent(email)}`)
    return res.data
  } catch (error) {
    throw new Error(error || "Failed to unsubscribe")
  }
}

export const updateIntegration = async payload => {
  const response = await axiosInstance.put("/integrations/post", payload)
  return response.data
}
