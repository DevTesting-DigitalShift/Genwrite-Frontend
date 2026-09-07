import { create } from "zustand"

interface CreditLogState {
  page: number
  pageSize: number
  searchText: string
  dateRange: string
  purposeFilter: string[]

  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setSearchText: (text: string) => void
  setDateRange: (range: string) => void
  setPurposeFilter: (filters: string[]) => void
  reset: () => void
}

const useCreditLogStore = create<CreditLogState>((set) => ({
  page: 1,
  pageSize: 10,
  searchText: "",
  dateRange: "24h",
  purposeFilter: [],

  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
  setSearchText: (text) => set({ searchText: text, page: 1 }), // Reset to page 1 on search
  setDateRange: (range) => set({ dateRange: range, page: 1 }), // Reset to page 1 on date change
  setPurposeFilter: (filters) => set({ purposeFilter: filters, page: 1 }), // Reset to page 1 on filter

  // Cleared on account switch — credit log filters are per-account.
  reset: () => set({ page: 1, pageSize: 10, searchText: "", dateRange: "24h", purposeFilter: [] }),
}))

export default useCreditLogStore
