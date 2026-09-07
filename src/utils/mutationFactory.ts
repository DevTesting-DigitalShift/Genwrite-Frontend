import { toast } from "sonner"
import { apiErrorMessage } from "@/types/api"
import type { BaseCRUDQuery } from "@/api/BaseCRUDQuery"
interface CustomHandlers {
  onCreateSuccess?: () => void
  onCreateError?: (error: unknown) => void
  onUpdateSuccess?: () => void
  onUpdateError?: (error: unknown) => void
  onDeleteSuccess?: () => void
  onDeleteError?: (error: unknown) => void
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
      // Show what the server actually said ("A brand with this link already exists",
      // a validation complaint, a credit limit) and keep the generic line only as a
      // fallback for network failures that carry no message.
      onError:
        customHandlers.onCreateError ??
        ((error) => toast.error(apiErrorMessage(error, `Error creating ${entity}`))),
    }),

    update: query.useUpdate({
      onSuccess:
        customHandlers.onUpdateSuccess ?? (() => toast.success(`${entity} updated successfully`)),
      onError:
        customHandlers.onUpdateError ??
        ((error) => toast.error(apiErrorMessage(error, `Error updating ${entity}`))),
    }),

    delete: query.useDelete({
      onSuccess:
        customHandlers.onDeleteSuccess ?? (() => toast.success(`${entity} deleted successfully`)),
      onError:
        customHandlers.onDeleteError ??
        ((error) => toast.error(apiErrorMessage(error, `Error deleting ${entity}`))),
    }),
  } as {
    create: ReturnType<TQuery["useCreate"]>
    update: ReturnType<TQuery["useUpdate"]>
    delete: ReturnType<TQuery["useDelete"]>
  }
}
