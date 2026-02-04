import axiosInstance from "./index"

/**
 * Get all images with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string[]} params.tags - Filter by tags
 * @param {number} params.minScore - Minimum score filter
 * @returns {Promise} Response with images and pagination
 */
export const getImages = async (params = {}) => {
  const { page = 1, limit = 20, tags, minScore } = params
  const queryParams = new URLSearchParams()

  queryParams.append("page", page)
  queryParams.append("limit", limit)

  if (tags && Array.isArray(tags) && tags.length > 0) {
    tags.forEach(tag => queryParams.append("tags", tag))
  }

  if (minScore !== undefined && minScore !== null) {
    queryParams.append("minScore", minScore)
  }

  const response = await axiosInstance.get(`/image-gallery?${queryParams.toString()}`)
  return response.data
}

/**
 * Get single image by ID
 * @param {string} id - Image ID
 * @returns {Promise} Image data
 */
export const getImageById = async id => {
  const response = await axiosInstance.get(`/image-gallery/${id}`)
  return response.data
}

/**
 * Search images by query
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {number} params.minScore - Minimum score filter
 * @returns {Promise} Response with search results and pagination
 */
export const searchImages = async (params = {}) => {
  const { q, page = 1, limit = 20, minScore } = params
  const queryParams = new URLSearchParams()

  if (q) queryParams.append("q", q)
  queryParams.append("page", page)
  queryParams.append("limit", limit)

  if (minScore !== undefined && minScore !== null) {
    queryParams.append("minScore", minScore)
  }

  const response = await axiosInstance.get(`/image-gallery/search?${queryParams.toString()}`)
  return response.data
}

/**
 * Generate a new image
 * POST /api/v1/user/images/generate
 * @param {Object} data - { prompt, style, imageSize, aspectRatio }
 */
export const generateImage = async data => {
  const response = await axiosInstance.post(`/user/images/generate`, data)
  return response.data
}

/**
 * Enhance an existing image
 * POST /api/v1/user/images/enhance
 * @param {FormData} formData - FormData containing image (optional), prompt, etc.
 */
export const enhanceImage = async formData => {
  // Content-Type header is usually auto-set by browser for FormData,
  // but explicitly setting it to undefined lets the browser set the boundary correctly.
  const response = await axiosInstance.post(`/user/images/enhance`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

/**
 * Generate Alt Text for an image
 * POST /api/v1/user/images/alt-text
 * @param {Object} data - { imageUrl, context }
 */
export const generateAltText = async data => {
  const response = await axiosInstance.post(`/user/images/alt-text`, data)
  return response.data
}
