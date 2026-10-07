import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, FileText, Landmark, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const bottomNavItems = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-[22px] w-[22px]" /> },
  { label: "Collection", path: "/payments", icon: <Landmark className="h-[22px] w-[22px]" /> },
  { label: "Clients", path: "/masters/parties", icon: <Users className="h-[22px] w-[22px]" /> },
  { label: "Orders", path: "/orders", icon: <FileText className="h-[22px] w-[22px]" /> },
  { label: "Stock", path: "/stock", icon: <Package className="h-[22px] w-[22px]" /> },
];

export function BottomNav() {
  const { user } = useAuth();

  const filteredNavItems = bottomNavItems.filter((item) => {
    if (!user) return false;
    const role = user.role;

    if (role === "Staff" || role === "Manager") {
      // Clients (Party Master) and Stock (Stock Production) are restricted to Admin
      if (item.label === "Clients" || item.label === "Stock") {
        return false;
      }
    }
    return true;
  });

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-card border-t border-border rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-40 flex items-center justify-around px-4 pb-2">
      {filteredNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 w-14 h-full transition-all duration-300",
              isActive 
                ? "text-primary scale-110 -translate-y-1 drop-shadow-md" 
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {item.icon}
          <span className={cn(
            "text-[8.5px] font-extrabold tracking-widest uppercase transition-all duration-300",
          )}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
