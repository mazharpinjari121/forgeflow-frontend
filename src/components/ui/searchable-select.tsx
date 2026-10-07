import * as React from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string | number;
  label: string;
}

export interface SearchableSelectProps {
  value?: string | number | null;
  onChange: (value: string) => void;
  options?: SearchableSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  hasError?: boolean;
  label?: string;
  error?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select option...",
  className,
  disabled = false,
  hasError = false,
  label,
  error,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search and highlight when opening dropdown
  React.useEffect(() => {
    if (isOpen) {
      setSearch("");
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const selectedOption = (options || []).find(
    (opt) => opt && String(opt.value) === String(value)
  );

  const filteredOptions = (options || []).filter((opt) => {
    if (!opt) return false;
    const labelText = opt.label ? String(opt.label) : "";
    return labelText.toLowerCase().includes(search.toLowerCase());
  });

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          onChange(String(filteredOptions[highlightedIndex].value));
          setIsOpen(false);
        } else if (filteredOptions.length > 0 && highlightedIndex === -1) {
          // Select first option on enter
          onChange(String(filteredOptions[0].value));
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Scroll active/highlighted item into view inside dropdown list
  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const listContainer = listRef.current;
      const items = listContainer.getElementsByTagName("button");
      if (items[highlightedIndex]) {
        const item = items[highlightedIndex];
        const containerTop = listContainer.scrollTop;
        const containerBottom = containerTop + listContainer.clientHeight;
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.clientHeight;

        if (itemTop < containerTop) {
          listContainer.scrollTop = itemTop;
        } else if (itemBottom > containerBottom) {
          listContainer.scrollTop = itemBottom - listContainer.clientHeight;
        }
      }
    }
  }, [highlightedIndex]);

  const isError = hasError || !!error;

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={cn("space-y-1.5 w-full relative", className)}
    >
      {label && (
        <label className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "input-base flex items-center justify-between gap-1.5 h-9 w-full font-semibold text-left disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-1 ring-blue-500 border-blue-500",
          isError && "border-red-500 focus:ring-red-500/50 focus:border-red-500 pr-8"
        )}
      >
        <span className="truncate text-slate-800 dark:text-slate-200">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-60 overflow-hidden flex flex-col animate-fade-in">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-900/50">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[11px] p-0 h-5 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              autoFocus
            />
          </div>
          <div
            ref={listRef}
            className="overflow-y-auto flex-1 py-1 divide-y divide-slate-50 dark:divide-slate-800/50 text-[11px]"
          >
            {filteredOptions.length === 0 ? (
              <div className="p-2.5 text-center text-slate-400">No results found</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(String(opt.value));
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-semibold text-slate-700 dark:text-slate-355",
                      isHighlighted && "bg-slate-50 dark:bg-slate-800/80",
                      isSelected && "text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[10px] font-medium text-red-500 dark:text-red-400 mt-1 ml-1">{error}</p>}
    </div>
  );
}
