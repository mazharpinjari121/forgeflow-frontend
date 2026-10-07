import { Menu, LogOut, User, Sun, Moon, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageStore } from "@/store/usePageStore";
import { useTheme } from "@/components/providers/ThemeProvider";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    title: pageTitle,
    entriesCount,
    entriesLabel,
    backUrl
  } = usePageStore();

  const handleBack = () => {
    if (backUrl === "-1") {
      navigate(-1);
    } else if (backUrl) {
      navigate(backUrl);
    }
  };



  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-12 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-3 lg:px-4">
      <div className="flex items-center gap-3">
        {backUrl ? (
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-2">
          {pageTitle ? (
            <>
              <div className="flex flex-col">
                <h2 className="text-xs sm:text-sm font-bold text-foreground leading-none">{pageTitle}</h2>
              </div>
              {entriesCount !== undefined && (
                <div className="flex bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold border border-primary/20 items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                  {entriesCount} {entriesLabel}
                </div>
              )}
            </>
          ) : (
            <div>
              <h2 className="text-[10px] sm:text-xs font-semibold text-foreground">Welcome back</h2>
              <p className="hidden sm:block text-[10px] text-muted-foreground">{user?.name}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors mr-2"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="h-7 w-7 rounded-full object-cover border border-slate-200 dark:border-slate-800"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold">
                {user?.name?.charAt(0) || "A"}
              </div>
            )}
            <div className="hidden md:flex flex-col text-left mr-1">
              <span className="text-xs font-semibold text-foreground leading-none">
                {user?.name}
              </span>
              {user?.role && (
                <span className="text-[9px] text-muted-foreground mt-0.5 leading-none font-medium">
                  {user.role}
                </span>
              )}
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-lg shadow-lg py-1 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-border">
                <p className="text-xs font-medium">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
