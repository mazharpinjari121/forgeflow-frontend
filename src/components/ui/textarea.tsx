import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={textareaId} className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "input-base min-h-[80px] resize-y",
            error && "border-destructive focus:ring-destructive/50",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
