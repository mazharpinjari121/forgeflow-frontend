import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { usePageStore } from "@/store/usePageStore";
import { useEffect } from "react";
export { Loader } from "./Loader";
export { Logo } from "./Logo";
export { FilterDrawer } from "./FilterDrawer";

interface PageHeaderProps {
  title: string;
  description?: string;
  entriesCount?: number;
  entriesLabel?: string;
  backUrl?: string;
}

export function PageHeader({ title, description, entriesCount, entriesLabel, backUrl }: PageHeaderProps) {
  const setPageHeader = usePageStore((state) => state.setPageHeader);
  const resetPageHeader = usePageStore((state) => state.resetPageHeader);

  useEffect(() => {
    setPageHeader({ title, description, entriesCount, entriesLabel, backUrl });
    return () => resetPageHeader();
  }, [title, description, entriesCount, entriesLabel, backUrl, setPageHeader, resetPageHeader]);

  return null;
}

export { SearchInput } from "../ui/search-input";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface StatusDotProps {
  status: "active" | "inactive" | "warning" | "info";
}

export function StatusDot({ status }: StatusDotProps) {
  const colors = {
    active: "bg-emerald-500",
    inactive: "bg-gray-400",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", colors[status])} />;
}
