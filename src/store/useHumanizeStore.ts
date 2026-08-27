import { create } from "zustand"

interface HumanizeState {
  result: any | null
  setResult: (result: unknown) => void
  resetHumanizeState: () => void
}

const useHumanizeStore = create<HumanizeState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  resetHumanizeState: () => set({ result: null }),
}))

export default useHumanizeStore
