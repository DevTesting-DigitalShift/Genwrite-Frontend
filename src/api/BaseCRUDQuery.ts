import { QueryBase, AnyUseQueryOptions } from "./QueryBase"

export abstract class BaseCRUDQuery<
  TEntity extends { _id?: string },
  TError = Error,
> extends QueryBase<TEntity, TError> {
  abstract api: {
    list: (params?: any) => Promise<TEntity[]>
    get: (id: string) => Promise<TEntity>
    create: (data: Partial<TEntity>) => Promise<TEntity>
    update: (id: string, data: Partial<TEntity>) => Promise<TEntity>
    delete: (id: string) => Promise<void>
  }

  public useList = (options?: AnyUseQueryOptions<TEntity[], TError>) =>
    this.useFetchQuery<TEntity[]>("list", () => this.api.list(), options)

  public useListParams = (params?: any, options?: AnyUseQueryOptions<TEntity[], TError>) =>
    this.useParamQuery<TEntity[], any>("list", this.api.list, params, options)

  public useDetail = (id: string, options?: AnyUseQueryOptions<TEntity, TError>) =>
    this.useFetchQuery<TEntity>(`detail-${id}`, () => this.api.get(id), options)

  public useCreate = (options?: {
    onSuccess?: (data: TEntity) => void
    onError?: (err: TError) => void
  }) =>
    this.useMutate<TEntity, Partial<TEntity>>(this.api.create, {
      ...options,
      onSuccess: data => {
        this.queryClient.setQueryData<TEntity[]>([...this.baseKey, "list"], (old = []) => [
          ...(old || []),
          data,
        ])
        options?.onSuccess?.(data)
      },
    })

  public useUpdate = (options?: {
    onSuccess?: (data: TEntity) => void
    onError?: (err: TError) => void
  }) =>
    this.useMutate<TEntity, { id: string; data: Partial<TEntity> }>(
      ({ id, data }) => this.api.update(id, data),
      {
        ...options,
        onSuccess: updated => {
          this.queryClient.setQueryData<TEntity[]>([...this.baseKey, "list"], (old = []) =>
            old.map(b => (b._id === updated._id ? updated : b))
          )
          this.queryClient.setQueryData<TEntity>(
            [...this.baseKey, `detail-${updated._id}`],
            updated
          )
          options?.onSuccess?.(updated)
        },
      }
    )

  public useDelete = (options?: {
    onSuccess?: (id: string) => void
    onError?: (err: TError) => void
  }) =>
    this.useMutate<void, string>(this.api.delete, {
      ...options,
      onSuccess: (_, id) => {
        this.queryClient.setQueryData<TEntity[]>([...this.baseKey, "list"], (old = []) =>
          old.filter(b => b._id !== id)
        )
        this.queryClient.removeQueries({ queryKey: [...this.baseKey, `detail-${id}`] })
        options?.onSuccess?.(id)
      },
    })

  public prefetchList = (params?: any) => this.prefetch("list", () => this.api.list(params))

  public prefetchDetail = (id: string) => this.prefetch(`detail-${id}`, () => this.api.get(id))

  public invalidateList = () => this.invalidate("list")
  public invalidateDetail = (id: string) => this.invalidate(`detail-${id}`)
}
