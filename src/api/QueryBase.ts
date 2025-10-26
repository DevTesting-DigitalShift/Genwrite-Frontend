// src/api/base/QueryBase.ts
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  QueryKey,
  UseQueryResult,
  UseMutationResult,
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from "@tanstack/react-query"
import { queryClient } from "@utils/queryClient"

// Temporary type for queries in your BaseQuery
export type AnyUseQueryOptions<TResult, TError = Error> = Omit<
  UseQueryOptions<TResult, TError, TResult, readonly unknown[]>,
  "queryKey" | "queryFn" // Explicitly omit queryKey and queryFn
> & {
  queryKey?: readonly unknown[] // Make queryKey optional
}

// Temporary type for infinite queries in your BaseQuery
export type InfiniteQueryOptions<TResult, TError = Error> = Omit<
  UseInfiniteQueryOptions<TResult, TError, TResult, readonly unknown[], unknown>,
  "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
> & {
  queryKey?: readonly unknown[]
  initialPageParam?: any
}

export abstract class QueryBase<TEntity, TError = Error> {
  protected queryClient = queryClient
  abstract baseKey: QueryKey

  // Default options variable
  protected defaultQueryOptions: AnyUseQueryOptions<TEntity, TError> = {
    staleTime: 60 * 1000, // fresh for 1 min
    gcTime: 5 * 60 * 1000, // cache for 5 min
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  }

  protected useFetchQuery = <TResult = TEntity>(
    keySuffix: string,
    fetchFn: () => Promise<TResult>,
    options?: AnyUseQueryOptions<TResult, TError>
  ): UseQueryResult<TResult, TError> =>
    useQuery<TResult, TError>({
      queryKey: [...this.baseKey, keySuffix],
      queryFn: fetchFn as () => Promise<TResult>,
      ...this.defaultQueryOptions,
      ...options,
    } as UseQueryOptions<TResult, TError, TResult, readonly unknown[]>)

  protected useParamQuery = <TResult = TEntity[], TVars = any>(
    keySuffix: string,
    fetchFn: (vars: TVars) => Promise<TResult>,
    variables: TVars,
    options?: AnyUseQueryOptions<TResult, TError>
  ): UseQueryResult<TResult, TError> =>
    useQuery<TResult, TError>({
      queryKey: [...this.baseKey, keySuffix, variables],
      queryFn: () => fetchFn(variables),
      ...this.defaultQueryOptions,
      ...options,
    } as UseQueryOptions<TResult, TError, TResult, readonly unknown[]>)

  protected useInfiniteQuery = <TResult = TEntity[], TVars = any>(
    keySuffix: string,
    fetchFn: (vars: TVars) => Promise<TResult>,
    getNextPageParam: (lastPage: TResult, allPages: TResult[]) => any,
    initialVars: TVars,
    options?: InfiniteQueryOptions<TResult, TError>
  ): UseInfiniteQueryResult<TResult, TError> =>
    useInfiniteQuery({
      queryKey: [...this.baseKey, keySuffix, initialVars],
      queryFn: ({ pageParam = 1 }) => fetchFn({ ...initialVars, page: pageParam }),
      getNextPageParam,
      initialPageParam: 1,
      ...this.defaultQueryOptions,
      ...options,
    } as UseInfiniteQueryOptions<TResult, TError, TResult, readonly unknown[], unknown>)

  protected useMutate = <TResult = TEntity, TVars = Partial<TEntity>>(
    mutationFn: (vars: TVars) => Promise<TResult>,
    options?: UseMutationOptions<TResult, TError, TVars>
  ): UseMutationResult<TResult, TError, TVars> =>
    useMutation<TResult, TError, TVars>({
      mutationFn,
      ...options,
    })

  protected setData = <T>(keySuffix: string, variables: any, updater: (oldData?: T) => T) => {
    this.queryClient.setQueryData([...this.baseKey, keySuffix, variables], updater)
  }

  protected invalidate = (keySuffix?: string) =>
    this.queryClient.invalidateQueries({
      queryKey: keySuffix ? [...this.baseKey, keySuffix] : this.baseKey,
    })

  protected prefetch = async <TResult>(
    keySuffix: string,
    fetchFn: () => Promise<TResult>,
    options?: AnyUseQueryOptions<TResult, TError>
  ) => {
    try {
      await this.queryClient.prefetchQuery({
        queryKey: [...this.baseKey, keySuffix],
        queryFn: fetchFn,
        ...options,
      })
      return true
    } catch (err) {
      console.warn(`Prefetch error [${this.baseKey}]:`, err)
      return false
    }
  }

  protected prefetchParam = async <TResult, TVariables>(
    keySuffix: string,
    fetchFn: (vars: TVariables) => Promise<TResult>,
    variables: TVariables,
    options?: AnyUseQueryOptions<TResult, TError>
  ) => {
    try {
      await this.queryClient.prefetchQuery({
        queryKey: [...this.baseKey, keySuffix, variables],
        queryFn: () => fetchFn(variables),
        ...options,
      })
      return true
    } catch (err) {
      console.warn(`Prefetch error [${this.baseKey}]:`, err)
      return false
    }
  }
}
