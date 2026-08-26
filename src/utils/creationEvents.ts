import { pushToDataLayer } from "@utils/DataLayer"
import useAuthStore from "@store/useAuthStore"

/**
 * Fires the "blog_creation" GTM event on API completion (success or error).
 * Pulls the current user from the auth store directly so callers don't need
 * to thread a user object through just for analytics.
 */
export function pushBlogCreationEvent({ status, blogType, blog, blogData, error }) {
  const { user } = useAuthStore.getState()

  pushToDataLayer({
    event: "blog_creation",
    blog_type: blogType,
    status,
    user_id: user?._id,
    blog_id: blog?._id,
    template: blogData?.template ?? blog?.template,
    words_length: blogData?.userDefinedLength ?? blogData?.wordCount,
    AI_Model: blogData?.aiModel,
    blog_images: blogData?.blogImages?.length ?? 0,
    isBranded: !!(blogData?.isCheckedBrand || blogData?.brandVoiceId),
    isBriefed: !!blogData?.brief,
    quickSummaryRequested: !!blogData?.isCheckedQuick,
    error: error?.response?.data?.message || error?.message,
  })
}

/**
 * Fires the "job_agent_creation" GTM event on API completion (success or error).
 */
export function pushJobAgentCreationEvent({ status, job, error }) {
  const { user } = useAuthStore.getState()

  pushToDataLayer({
    event: "job_agent_creation",
    status,
    user_id: user?._id,
    job_id: job?.job?._id ?? job?._id,
    error: error?.response?.data?.message || error?.message,
  })
}
