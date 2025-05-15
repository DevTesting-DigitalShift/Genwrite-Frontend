import axiosInstance from "@api/index";

export async function previewBlogLoader({ params }) {
  try {
    const response = await axiosInstance.get(`/public-blog/${params.blogId}`);
    return response.data;
  } catch (error) {
    // Axios error structure: error.response, error.message, etc.

    if (error.response) {
      // If there's a response from the server (status codes 4xx or 5xx)
      const { status, data } = error.response;
      const errorMessage = data?.message || "Something went wrong.";

      // Throwing a custom error with status and message to be handled by the errorElement
      throw new Response(errorMessage, {
        status: status,
        statusText: errorMessage,
      });
    } else {
      // Handle network or unexpected errors (e.g., no response)
      throw new Response("Network error or unexpected issue", {
        status: 500,
        statusText: "Internal Server Error",
      });
    }
  }
}
