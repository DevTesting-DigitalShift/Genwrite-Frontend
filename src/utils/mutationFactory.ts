// src/utils/mutationFactory.ts
import { message } from "antd"
import type { BaseCRUDQuery } from "@/api/BaseCRUDQuery"

interface CustomHandlers {
  onCreateSuccess?: () => void
  onCreateError?: () => void
  onUpdateSuccess?: () => void
  onUpdateError?: () => void
  onDeleteSuccess?: () => void
  onDeleteError?: () => void
}
// Infer TEntity from query.useCreate().onSuccess(data: TEntity)
type InferEntity<T> = T extends {
  useCreate: (opts?: { onSuccess?: (data: infer U) => void }) => any
}
  ? U
  : never
/**
 * Automatically sets up create/update/delete mutation hooks with AntD messages.
 * Derives the entity name from the BaseCRUDQuery.baseKey (if no name is provided).
 */
export const mutationFactory = <TQuery extends BaseCRUDQuery<any, any>>(
  query: TQuery,
  entityName?: string,
  customHandlers: CustomHandlers = {}
) => {
  type TEntity = InferEntity<TQuery>
  // If entityName not provided, derive from query.baseKey
  const baseKey = Array.isArray(query.baseKey) ? query.baseKey[0] : query.baseKey
  const entity =
    (entityName || baseKey || "Entity").toString().charAt(0).toUpperCase() +
    (entityName || baseKey || "Entity").toString().slice(1)

  return {
    create: query.useCreate({
      onSuccess:
        customHandlers.onCreateSuccess ?? (() => message.success(`${entity} created successfully`)),
      onError: customHandlers.onCreateError ?? (() => message.error(`Error creating ${entity}`)),
    }),

    update: query.useUpdate({
      onSuccess:
        customHandlers.onUpdateSuccess ?? (() => message.success(`${entity} updated successfully`)),
      onError: customHandlers.onUpdateError ?? (() => message.error(`Error updating ${entity}`)),
    }),

    delete: query.useDelete({
      onSuccess:
        customHandlers.onDeleteSuccess ?? (() => message.success(`${entity} deleted successfully`)),
      onError: customHandlers.onDeleteError ?? (() => message.error(`Error deleting ${entity}`)),
    }),
  } as {
    create: ReturnType<TQuery["useCreate"]>
    update: ReturnType<TQuery["useUpdate"]>
    delete: ReturnType<TQuery["useDelete"]>
  }
}
