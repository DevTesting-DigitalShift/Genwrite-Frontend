import { create } from "zustand"

const useCreditLogStore = create(set => ({
  page: 1,
  pageSize: 10,
  searchText: "",
  dateRange: "24h",
  purposeFilter: [],

  setPage: page => set({ page }),
  setPageSize: pageSize => set({ pageSize }),
  setSearchText: text => set({ searchText: text, page: 1 }), // Reset to page 1 on search
  setDateRange: range => set({ dateRange: range, page: 1 }), // Reset to page 1 on date change
  setPurposeFilter: filters => set({ purposeFilter: filters, page: 1 }), // Reset to page 1 on filter
}))

export default useCreditLogStore
