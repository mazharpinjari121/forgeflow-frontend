import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value?: string;
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export function Tabs({ value: valueProp, defaultValue, className, children, onValueChange }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");

  const isControlled = valueProp !== undefined;
  const currentValue = isControlled ? valueProp : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("inline-flex items-center justify-center p-1 bg-muted rounded-lg w-full md:w-auto overflow-x-auto custom-scrollbar", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext);
  const active = context?.value === value;

  return (
    <button
      type="button"
      onClick={() => context?.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50 shrink-0",
        active 
          ? "bg-background text-primary shadow-sm" 
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext);
  if (context?.value !== value) return null;

  return (
    <div className={cn("mt-4 animate-fade-in", className)}>
      {children}
    </div>
  );
}
