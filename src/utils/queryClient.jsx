import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
// import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
// import { del, get, set } from "idb-keyval"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // always stale
      cacheTime: 0, // remove from cache immediately
      refetchOnMount: "always", // always refetch on mount
      refetchOnWindowFocus: true, // also refetch when tab gets focus
      refetchOnReconnect: true, // refetch if internet reconnects
    },
  },
})

// const persister = createAsyncStoragePersister({
//   storage: {
//     setItem: set,
//     getItem: get,
//     removeItem: del,
//   },
// })

export const QueryProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)
