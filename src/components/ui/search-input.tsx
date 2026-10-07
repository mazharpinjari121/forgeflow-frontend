import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Search...", ...props }, ref) => {
    const handleClear = () => {
      onChange("");
      if (onClear) onClear();
    };

    return (
      <div className="relative group flex items-center h-9 w-full">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input
          ref={ref}
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "input-base pl-9 pr-8 w-full h-full text-xs placeholder:text-muted-foreground bg-muted border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-colors text-foreground",
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center"
            title="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
