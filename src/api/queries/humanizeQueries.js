import { useMutation } from "@tanstack/react-query"
import { humanizeContentGenerator } from "@api/otherApi"
import useHumanizeStore from "@store/useHumanizeStore"

export const useHumanizeMutation = () => {
  const { setResult } = useHumanizeStore()

  return useMutation({
    mutationFn: payload => humanizeContentGenerator(payload),
    onSuccess: data => {
      setResult(data)
    },
    onError: error => {
      console.error(error)
      // Optionally handle error in store, but usually local state/toast is enough
    },
    // We don't reset result on mutate because we might want to show previous result while loading?

    onMutate: () => {
      setResult(null)
    },
  })
}
