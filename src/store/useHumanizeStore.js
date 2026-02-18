import { create } from "zustand"

const useHumanizeStore = create(set => ({
  result: null,
  setResult: result => set({ result }),
  resetHumanizeState: () => set({ result: null }),
}))

export default useHumanizeStore
