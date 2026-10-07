import { cn } from "@/lib/utils";
const logoImg = "/super-steel-logo.png";

interface LogoProps {
  className?: string;
  imgClassName?: string;
  isDarkBg?: boolean;
  collapsed?: boolean;
  onlyImage?: boolean;
}

export function Logo({ className, imgClassName, isDarkBg, collapsed, onlyImage }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 font-bold tracking-tight select-none text-foreground", className)}>
      <img src={logoImg} className={cn("h-10 w-10 object-contain rounded-lg shadow-sm bg-white p-0.5 shrink-0", imgClassName)} alt="Super Steel Logo" />
      {!onlyImage && (
        <div className={cn(
          "flex flex-col items-start leading-none transition-all duration-300",
          collapsed && "lg:hidden"
        )}>
          <span className={cn(
            "text-sm font-extrabold uppercase tracking-widest",
            isDarkBg ? "text-white" : "text-slate-800 dark:text-slate-100"
          )}>Super Steel</span>
          <span className={cn(
            "text-[10px] font-medium tracking-wide uppercase mt-0.5",
            isDarkBg ? "text-blue-200" : "text-blue-600 dark:text-blue-400"
          )}>Management ERP</span>
        </div>
      )}
    </div>
  );
}


