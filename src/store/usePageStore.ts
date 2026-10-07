import { create } from "zustand";

interface PageHeaderState {
  title: string;
  description?: string;
  entriesCount?: number;
  entriesLabel?: string;
  backUrl?: string;
  setPageHeader: (header: {
    title: string;
    description?: string;
    entriesCount?: number;
    entriesLabel?: string;
    backUrl?: string;
  }) => void;
  resetPageHeader: () => void;
}

export const usePageStore = create<PageHeaderState>((set) => ({
  title: "",
  description: "",
  entriesCount: undefined,
  entriesLabel: "Entries Found",
  backUrl: undefined,
  setPageHeader: (header) => set(header),
  resetPageHeader: () =>
    set({
      title: "",
      description: "",
      entriesCount: undefined,
      entriesLabel: "Entries Found",
      backUrl: undefined,
    }),
}));
