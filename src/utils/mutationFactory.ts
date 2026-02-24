import { toast } from "sonner"
import type { BaseCRUDQuery } from "@/api/BaseCRUDQuery"
interface CustomHandlers {
  onCreateSuccess?: () => void
  onCreateError?: () => void
  onUpdateSuccess?: () => void
  onUpdateError?: () => void
  onDeleteSuccess?: () => void
  onDeleteError?: () => void
}

export const mutationFactory = <TQuery extends BaseCRUDQuery<any, any>>(
  query: TQuery,
  entityName?: string,
  customHandlers: CustomHandlers = {}
) => {
  // If entityName not provided, derive from query.baseKey
  const baseKey = Array.isArray(query.baseKey) ? query.baseKey[0] : query.baseKey
  const entity =
    (entityName || baseKey || "Entity").toString().charAt(0).toUpperCase() +
    (entityName || baseKey || "Entity").toString().slice(1)

  return {
    create: query.useCreate({
      onSuccess:
        customHandlers.onCreateSuccess ?? (() => toast.success(`${entity} created successfully`)),
      onError: customHandlers.onCreateError ?? (() => toast.error(`Error creating ${entity}`)),
    }),

    update: query.useUpdate({
      onSuccess:
        customHandlers.onUpdateSuccess ?? (() => toast.success(`${entity} updated successfully`)),
      onError: customHandlers.onUpdateError ?? (() => toast.error(`Error updating ${entity}`)),
    }),

    delete: query.useDelete({
      onSuccess:
        customHandlers.onDeleteSuccess ?? (() => toast.success(`${entity} deleted successfully`)),
      onError: customHandlers.onDeleteError ?? (() => toast.error(`Error deleting ${entity}`)),
    }),
  } as {
    create: ReturnType<TQuery["useCreate"]>
    update: ReturnType<TQuery["useUpdate"]>
    delete: ReturnType<TQuery["useDelete"]>
  }
}
