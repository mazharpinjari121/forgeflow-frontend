import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

interface LoaderProps {
  fullScreen?: boolean;
  className?: string;
  text?: string;
}

export function Loader({ fullScreen = true, className, text }: LoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen && "fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      {/* Spinning ring loader */}
      <div className="loader-ring">
        <div className="loader-ring-inner" />
        <Logo className="h-10 w-10" onlyImage />
      </div>
      {text && (
        <p className="text-xs text-muted-foreground font-medium tracking-wide animate-pulse">{text}</p>
      )}
    </div>
  );
}
