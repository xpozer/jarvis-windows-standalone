import { create } from "zustand";
import type { DialogHistoryEntry } from "../core/types";

type UiStore = {
  inputFocused: boolean;
  activeOverlay: string | null;
  history: DialogHistoryEntry[];
  setInputFocused: (focused: boolean) => void;
  openOverlay: (overlay: string) => void;
  closeOverlay: () => void;
  pushHistory: (entry: DialogHistoryEntry) => void;
  clearHistory: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  inputFocused: false,
  activeOverlay: null,
  history: [],
  setInputFocused: (focused) => set({ inputFocused: focused }),
  openOverlay: (overlay) => set({ activeOverlay: overlay }),
  closeOverlay: () => set({ activeOverlay: null }),
  pushHistory: (entry) => set((state) => ({ history: [entry, ...state.history].slice(0, 30) })),
  clearHistory: () => set({ history: [] }),
}));
