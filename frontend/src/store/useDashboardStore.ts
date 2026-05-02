// frontend/src/store/useDashboardStore.ts
import { create } from "zustand";

type DashboardMode = "default" | "focus" | "wireframe";

type DashboardState = {
  activePage: string;
  selectedEntityId: string | null;
  aiSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  mode: DashboardMode;
  setActivePage: (page: string) => void;
  setSelectedEntityId: (id: string | null) => void;
  setAiSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMode: (mode: DashboardMode) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  activePage: "Start",
  selectedEntityId: null,
  aiSidebarOpen: true,
  commandPaletteOpen: false,
  mode: "default",
  setActivePage: (page) => set({ activePage: page }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setAiSidebarOpen: (open) => set({ aiSidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setMode: (mode) => set({ mode }),
}));
