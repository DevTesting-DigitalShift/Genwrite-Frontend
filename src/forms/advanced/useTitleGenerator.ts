import { useCallback, useReducer } from "react"
import type { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { blogsQuery } from "@api/Blog/Blog.query"
import { initialTitleGeneratorState, titleGeneratorReducer } from "./titleGenerator.reducer"
import type { AdvancedBlogFormValues } from "./advanced.schema"

/**
 * Suggests blog titles from the topic and keywords already on the form. Needs all three, and
 * says which are missing (as inline field errors) rather than failing in the request.
 */
export function useTitleGenerator(form: UseFormReturn<AdvancedBlogFormValues>) {
  const [state, dispatch] = useReducer(titleGeneratorReducer, initialTitleGeneratorState)
  const { getValues, setError } = form

  const generate = useCallback(async () => {
    const values = getValues()
    const missing = {
      topic: !values.topic.trim(),
      focusKeywords: values.focusKeywords.length === 0,
      keywords: values.keywords.length === 0,
    }

    if (missing.topic || missing.focusKeywords || missing.keywords) {
      if (missing.topic) setError("topic", { message: "Please enter a topic name" })
      if (missing.focusKeywords)
        setError("focusKeywords", { message: "Please enter at least 1 focus keyword" })
      if (missing.keywords) setError("keywords", { message: "Please enter at least 1 keyword" })
      toast.error(
        "Please enter a topic and at least one focus keyword and keyword before generating titles."
      )
      return
    }

    dispatch({ type: "GENERATE_START" })
    try {
      const titles = await blogsQuery.getGeneratedTitles({
        template: values.template,
        topic: values.topic,
        focusKeywords: values.focusKeywords,
        keywords: values.keywords,
        ...(state.titles.length > 0 && { oldTitles: state.titles }),
      })
      dispatch({ type: "GENERATE_SUCCEEDED", titles })
    } catch (error) {
      console.error("Error generating titles:", error)
      dispatch({ type: "GENERATE_FAILED" })
      toast.error("Failed to generate titles. Please try again later.")
    }
  }, [getValues, setError, state.titles])

  return { ...state, generate }
}
