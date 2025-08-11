import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { del, get, set } from "idb-keyval"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: {
    setItem: set,
    getItem: get,
    removeItem: del,
  },
})

export const QueryProvider = ({ children }) => (
  <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
    {children}
  </PersistQueryClientProvider>
)
