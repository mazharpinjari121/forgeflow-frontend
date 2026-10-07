import { createPortal } from "react-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  activeFiltersCount: number;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  children: React.ReactNode;
}

export function FilterDrawer({
  isOpen,
  onClose,
  title = "Filter Records",
  activeFiltersCount,
  hasActiveFilters,
  onClearAll,
  children,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-[85vw] sm:w-full sm:max-w-md h-full bg-white dark:bg-slate-955 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50 animate-slide-in">
        {/* Header */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 mr-2">
            <SlidersHorizontal className="h-4 w-4 text-blue-600 shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h3>
            {activeFiltersCount > 0 && (
              <Badge variant="info" className="text-[9px] px-1.5 py-0.5 whitespace-nowrap shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-955/40 dark:text-blue-400 border-none font-bold">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Filters list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-[11px]">
          {children}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearAll}
            disabled={!hasActiveFilters}
            className="flex-grow flex-1 justify-center h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
          <Button
            type="button"
            onClick={onClose}
            className="flex-grow flex-1 justify-center h-9 cursor-pointer"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
