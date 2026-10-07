import { Suspense, useEffect } from "react"
import { Navigate, useLocation, useParams } from "react-router-dom"
import { toast } from "sonner"
import LoadingScreen from "@components/ui/LoadingScreen"
import { READ_ONLY_MESSAGE, useReadOnlyGuard } from "@/hooks/useReadOnlyGuard"
import { CREATE_FORMS, isCreateFormKind } from "./createForms.registry"

/**
 * `/create/:kind` (and `/create/:kind/:id` to edit). One route, one lazy-loaded form per
 * kind; unknown kinds fall back to the dashboard rather than rendering an empty page.
 * `key` forces a fresh form when the user moves between kinds on the same route.
 */
export default function CreatePage() {
  const { kind, id } = useParams<{ kind: string; id?: string }>()
  const location = useLocation()
  const { isReadOnlyWorkspace } = useReadOnlyGuard()

  // Every create form spends the owner's credits, so a read-only workspace cannot open one,
  // including by typing the URL (the dashboard cards are already disabled there).
  useEffect(() => {
    if (isReadOnlyWorkspace) toast.error(READ_ONLY_MESSAGE)
  }, [isReadOnlyWorkspace])
  if (isReadOnlyWorkspace) return <Navigate to="/dashboard" replace />

  if (!isCreateFormKind(kind)) return <Navigate to="/dashboard" replace />

  const entry = CREATE_FORMS[kind]
  if (!entry) return <Navigate to="/dashboard" replace />
  const Form = entry.component
  const prefill = (location.state as { prefill?: Record<string, unknown> } | null)?.prefill

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Form key={`${kind}:${id ?? "new"}`} {...entry.props} id={id} prefill={prefill} />
    </Suspense>
  )
}
