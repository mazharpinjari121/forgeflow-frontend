import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  Package,
  FileText,
  Landmark,
  MessageSquare,
  CornerDownLeft,
  BarChart3,
  User,
  LogOut,
  Folder,
  Box,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  TrendingUp,
  Calendar,
  RefreshCcw,
  ShoppingBag,
  Key,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "../common/Logo";
import { useAuth } from "@/hooks/useAuth";

interface SubNavChild {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface SubNavItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: SubNavChild[];
}

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: SubNavItem[];
}

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Master Management",
    icon: <Shield className="h-4 w-4" />,
    children: [
      { label: "Category Master", path: "/masters/categories", icon: <Folder className="h-3 w-3" /> },
      { label: "Product Master", path: "/masters/products", icon: <Box className="h-3 w-3" /> },
      { label: "Party Master", path: "/masters/parties", icon: <User className="h-3 w-3" /> },
      { label: "User Master", path: "/masters/users", icon: <User className="h-3 w-3" /> },
    ],
  },
  {
    label: "Stock Production",
    path: "/stock",
    icon: <Package className="h-4 w-4" />,
  },
  {
    label: "Order Booking",
    path: "/orders",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: "Order Return",
    path: "/returns",
    icon: <RotateCcw className="h-4 w-4" />,
  },
  {
    label: "Payment Collection",
    path: "/payments",
    icon: <Landmark className="h-4 w-4" />,
  },
  {
    label: "Reports",
    icon: <BarChart3 className="h-4 w-4" />,
    children: [
      { label: "Party Outstanding", path: "/reports/outstanding", icon: <Landmark className="h-3 w-3" /> },
      {
        label: "Order & Pay History",
        icon: <ShoppingBag className="h-3 w-3" />,
        children: [
          { label: "Party Orders", path: "/reports/party-orders", icon: <FileText className="h-3 w-3" /> },
          { label: "Party Payments", path: "/reports/party-payments", icon: <Landmark className="h-3 w-3" /> },
        ],
      },
    ],
  },
  {
    label: "WhatsApp Marketing",
    path: "/marketing",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    label: "My Account",
    icon: <User className="h-4 w-4" />,
    children: [
      { label: "Profile", path: "/profile", icon: <User className="h-3 w-3" /> },
      { label: "Change Password", path: "/profile/password", icon: <Key className="h-3 w-3" /> },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const toggleExpand = (label: string) => {
    setExpanded((prev) => (prev === label ? null : label));
  };

  const toggleExpandSub = (label: string) => {
    setExpandedSub((prev) => (prev === label ? null : label));
  };

  const handleParentClick = (label: string) => {
    if (isCollapsed) {
      onToggleCollapse();
      setExpanded(label);
    } else {
      toggleExpand(label);
    }
  };

  const isChildActive = (children?: SubNavItem[]) => {
    return children?.some((c) => {
      if (c.path) return location.pathname.startsWith(c.path);
      if (c.children) return c.children.some((gc) => location.pathname.startsWith(gc.path));
      return false;
    });
  };

  const isSubChildActive = (children?: SubNavChild[]) => {
    return children?.some((c) => location.pathname.startsWith(c.path));
  };

  // Role-Based Access Control logic:
  // Admin (All access).
  // Manager (Billing + Reports) where Billing = Order Booking + Payment Collection.
  // Staff (Billing only) where Billing = Order Booking + Payment Collection.
  const hasMenuPermission = (label: string) => {
    if (!user) return false;
    const role = user.role;

    if (role === "Staff") {
      return ["Dashboard", "Order Booking", "Payment Collection", "My Account"].includes(label);
    }
    if (role === "Manager") {
      return [
        "Dashboard",
        "Order Booking",
        "Payment Collection",
        "Reports & Analytics",
        "My Account",
      ].includes(label);
    }
    return true; // Admin gets everything
  };

  const filteredNavigation = navigation.filter((item) => hasMenuPermission(item.label));

  const handleLogoutClick = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed lg:absolute top-0 left-0 z-50 h-full bg-sidebar border-r border-sidebar-border",
          "flex flex-col transition-all duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-20 w-56" : "w-56"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-20 border-b border-sidebar-border relative transition-all duration-300",
          isCollapsed ? "lg:justify-center lg:px-2 justify-start px-4" : "justify-start px-4"
        )}>
          <Logo className="h-10" collapsed={isCollapsed} />

          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapsible toggle handle for desktop */}
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50",
              "w-6 h-6 items-center justify-center rounded-full border border-sidebar-border bg-card text-sidebar-foreground shadow-md",
              "hover:bg-accent hover:text-accent-foreground transition-all duration-200 cursor-pointer"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto py-3 space-y-0.5 text-xs transition-all duration-300",
          isCollapsed ? "lg:px-2 px-3" : "px-3"
        )}>
          {filteredNavigation.map((item) =>
            item.children ? (
              <div key={item.label} className="relative group">
                <button
                  onClick={() => handleParentClick(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg font-semibold transition-all duration-200 text-sidebar-foreground/70 hover:bg-muted hover:text-sidebar-foreground",
                    isCollapsed ? "lg:justify-center lg:px-0 lg:w-10 lg:h-10 mx-auto lg:gap-0" : "",
                    isChildActive(item.children) && "bg-primary text-white hover:bg-primary hover:text-white"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span className="shrink-0">{item.icon}</span>
                    <span className={cn(isCollapsed && "lg:hidden")}>{item.label}</span>
                  </span>
                  {!isCollapsed && (
                    expanded === item.label ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )
                  )}
                </button>
                {(expanded === item.label || isChildActive(item.children)) && (
                  <div className={cn(
                    "ml-5 mt-1 border-l border-sidebar-border pl-3.5 space-y-1",
                    isCollapsed && "lg:hidden"
                  )}>
                    {item.children.map((child) =>
                      child.children ? (
                        /* Sub-group with its own children (3rd level) */
                        <div key={child.label}>
                          <button
                            onClick={() => toggleExpandSub(child.label)}
                            className={cn(
                              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-semibold text-[11px] transition-all duration-200",
                              "text-muted-foreground hover:text-sidebar-foreground hover:bg-muted/50",
                              isSubChildActive(child.children) && "text-primary font-extrabold"
                            )}
                          >
                            <span className="flex items-center gap-1">
                              <span className="mr-1">{child.icon}</span>
                              {child.label}
                            </span>
                            {expandedSub === child.label || isSubChildActive(child.children) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </button>
                          {(expandedSub === child.label || isSubChildActive(child.children)) && (
                            <div className="ml-4 mt-0.5 border-l border-sidebar-border/50 pl-3 space-y-0.5">
                              {child.children.map((grandChild) => (
                                <NavLink
                                  key={grandChild.path}
                                  to={grandChild.path}
                                  onClick={onClose}
                                  className={({ isActive }) =>
                                    cn(
                                      "block px-2 py-1.5 rounded-md font-medium text-[10.5px] transition-colors",
                                      "text-muted-foreground hover:text-sidebar-foreground hover:bg-muted/30",
                                      isActive && "text-primary font-extrabold"
                                    )
                                  }
                                >
                                  <span className="flex items-center gap-1">
                                    <span className="mr-0.5">{grandChild.icon}</span>
                                    {grandChild.label}
                                  </span>
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Direct child link (2nd level) */
                        <NavLink
                          key={child.path}
                          to={child.path!}
                          onClick={onClose}
                          end={child.path === "/profile"}
                          className={({ isActive }) =>
                            cn(
                              "block px-2.5 py-1.5 rounded-md font-medium text-[11px] transition-colors",
                              "text-muted-foreground hover:text-sidebar-foreground",
                              isActive && "text-primary font-extrabold"
                            )
                          }
                        >
                          <span className="flex items-center gap-1"><span className="mr-1">{child.icon}</span>{child.label}</span>
                        </NavLink>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path!}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all duration-200 text-sidebar-foreground/70 hover:bg-muted hover:text-sidebar-foreground",
                    isCollapsed ? "lg:justify-center lg:px-0 lg:w-10 lg:h-10 mx-auto lg:gap-0" : "",
                    isActive && "bg-primary text-white hover:bg-primary hover:text-white shadow-md shadow-primary/10"
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className={cn(isCollapsed && "lg:hidden")}>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        {/* Mobile Responsive Footer Card */}
        <div className="px-3 py-2 lg:hidden">
          <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 via-card/90 to-accent/5 p-3.5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
            {/* Ambient Background Glows */}
            <div className="absolute -right-8 -bottom-8 w-16 h-16 rounded-full bg-primary/10 blur-xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-16 h-16 rounded-full bg-accent/5 blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-1.5">
              <span className="text-[10px] font-extrabold tracking-wide text-foreground/80 flex items-center gap-1">
                <span>© 2026 Super Steel ERP</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10">v1.0</span>
              </span>

              <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground">
                <span className="h-px w-2.5 bg-muted-foreground/30" />
                <span>Design & Developed by</span>
                <span className="h-px w-2.5 bg-muted-foreground/30" />
              </div>

              <a
                href="https://7techitservices.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-primary hover:text-accent transition-colors duration-200 group underline decoration-primary/20 underline-offset-2 hover:decoration-accent"
              >
                <span>7tech IT Services</span>
                <span className="inline-block transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                  ↗
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className={cn(
          "py-1 border-t border-sidebar-border transition-all duration-300",
          isCollapsed ? "lg:px-2 px-3" : "px-3"
        )}>
          <button
            onClick={handleLogoutClick}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-destructive hover:bg-destructive/10 transition-all duration-200 text-left",
              isCollapsed ? "lg:justify-center lg:px-0 lg:w-10 lg:h-10 mx-auto lg:gap-0" : ""
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(isCollapsed && "lg:hidden")}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}