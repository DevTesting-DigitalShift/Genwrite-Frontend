import { Loader2, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { mediaQuery } from "@api/Media/Media.query"

/**
 * "Refine" under a prompt box: sends the idea to the backend's free refiner and swaps the text
 * for the richer version, so the user can read and edit it before paying. Generation refines
 * once more server-side, which only polishes an already-refined prompt.
 */
export function RefinePromptButton({
  prompt,
  kind,
  purpose,
  onRefined,
}: {
  prompt: string
  kind: "image" | "video"
  purpose?: string
  onRefined: (refined: string) => void
}) {
  const refine = mediaQuery.useRefinePrompt({
    onSuccess: ({ prompt: refined }) => {
      onRefined(refined)
      toast.success("Prompt refined — edit it if you like, then generate")
    },
    onError: (err) => toast.error(err.message || "Couldn't refine the prompt"),
  })

  return (
    <button
      type="button"
      onClick={() => refine.mutate({ prompt: prompt.trim(), kind, purpose })}
      disabled={refine.isPending || prompt.trim().length < 3}
      className="btn btn-sm h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60 flex items-center gap-2"
    >
      {refine.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Wand2 className="size-4 text-[#4C5BD6]" />
      )}
      Refine prompt
    </button>
  )
}
