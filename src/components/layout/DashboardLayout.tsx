import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col lg:flex-row p-0 lg:p-4 lg:pr-0 overflow-hidden">

      <div className="flex w-full h-full bg-card lg:rounded-l-[2rem] overflow-hidden lg:shadow-2xl relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Main content area */}
        <div className={cn(
          "flex-1 flex flex-col relative z-10 w-full h-full overflow-hidden transition-all duration-300",
          isCollapsed ? "lg:pl-20" : "lg:pl-56"
        )}>
          <Navbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-grow flex flex-col overflow-y-auto p-3 lg:p-4 pb-[80px] animate-fade-in">
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
