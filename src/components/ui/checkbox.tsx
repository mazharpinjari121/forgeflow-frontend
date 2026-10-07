import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className={cn(
              "h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-background",
              className
            )}
            ref={ref}
            {...props}
          />
          {label && (
            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
              {label}
            </span>
          )}
        </label>
        {error && <p className="text-[10px] text-destructive">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
