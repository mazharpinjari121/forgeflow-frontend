import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Search,
  Plus,
  Terminal,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Radio,
  RefreshCw,
  Bell,
  Box,
  Layers,
  Sparkles
} from 'lucide-react';
import { useForgeflowStore } from '../../store/useForgeflowStore';
import { useTheme } from '../providers/ThemeProvider';
import { ROLE_CONFIGS, DEMO_OPERATORS, OperatorRole } from '../../auth/permissions';
import type { Operator } from '../../types/forgeflow.types';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed: boolean;
}

export const ForgeFlowNavbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarCollapsed: _isSidebarCollapsed }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const {
    operator,
    setOperator,
    logout,
    isEngineOnline,
    engineLatencyMs,
    checkEngineHealth,
    setCommandPalette,
    setNewWorkOrderOpen,
    setLogMovementOpen,
    setAiCopilotOpen
  } = useForgeflowStore();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const roleConfig = ROLE_CONFIGS[operator?.role as OperatorRole];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <header className="h-14 border-b border-border bg-card/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Brand / Engine telemetry */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Live Engine Indicator */}
        <div
          onClick={() => checkEngineHealth()}
          title="Click to ping Laravel API backend"
          className="cursor-pointer hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-muted/70 hover:bg-muted border border-border text-[11px] font-mono transition-colors"
        >
          <span className={`w-2 h-2 rounded-full ${isEngineOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-semibold text-foreground">API ENGINE</span>
          <span className="text-muted-foreground">127.0.0.1:8000</span>
          {isEngineOnline && (
            <span className="text-emerald-500 font-medium">({engineLatencyMs}ms)</span>
          )}
        </div>

        {/* Production Shift & Clock */}
        <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded bg-muted/40 border border-border/60 text-[11px] font-mono text-muted-foreground">
          <Radio className="w-3.5 h-3.5 text-cyan-500" />
          <span>PLANT SHIFT-A</span>
          <span className="text-foreground font-semibold">{timeStr}</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <button
          onClick={() => setCommandPalette(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md bg-muted/60 hover:bg-muted border border-input text-muted-foreground hover:text-foreground transition-all duration-150"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Search SKUs, Work Orders, Counterparties, Batch IDs...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-background border border-border rounded text-muted-foreground shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile Search Button */}
        <button
          onClick={() => setCommandPalette(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-95 border border-transparent hover:border-border"
          title="Search Console (Ctrl+K)"
          aria-label="Search Console"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Ask ForgeAI Button */}
        <button
          onClick={() => setAiCopilotOpen(true)}
          title="Open ForgeAI Shopfloor Copilot (Ask questions about stock, RMAs, bottlenecks)"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-primary/15 to-cyan-500/15 hover:from-amber-500/25 hover:via-primary/25 hover:to-cyan-500/25 text-foreground border border-amber-500/30 hover:border-amber-500/50 text-xs font-semibold shadow-xs transition-all active:scale-95 group"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline font-mono">Ask ForgeAI</span>
          <span className="sm:hidden font-mono text-[11px]">AI</span>
        </button>

        {/* Quick Action Buttons */}
        {roleConfig?.canCreateWorkOrder && (
          <button
            onClick={() => {
              setNewWorkOrderOpen(true);
              navigate('/work-orders');
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-110 text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Work Order</span>
          </button>
        )}

        {roleConfig?.canLogInwardStock && (
          <button
            onClick={() => {
              setLogMovementOpen(true);
              navigate('/inventory');
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted border border-border text-xs font-semibold transition-all active:scale-95"
          >
            <Box className="w-3.5 h-3.5 text-cyan-500" />
            <span>Material Inward</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={isDark ? "Switch to Clean Industrial Light Mode" : "Switch to Control Room Dark Mode"}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-95 border border-transparent hover:border-border"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300 transition-transform duration-200 -rotate-12 hover:rotate-0" />
          )}
        </button>

        {/* Operator Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors"
          >
            <div className="w-7 h-7 rounded bg-primary/20 border border-primary/40 text-primary font-bold text-xs flex items-center justify-center font-mono">
              {operator?.name ? operator.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'FF'}
            </div>
            <div className="hidden md:flex flex-col items-start text-left leading-tight">
              <span className="text-xs font-semibold text-foreground">{operator?.name || 'Plant Operator'}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{operator?.badgeNumber || 'FF-MGR-001'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {profileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setProfileMenuOpen(false)}
              />
              <div
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-xl bg-card border border-border shadow-2xl py-2 z-50 animate-fade-in"
                onMouseLeave={() => setProfileMenuOpen(false)}
              >
                <div className="px-3.5 py-2.5 border-b border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{operator?.name}</p>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {operator?.badgeNumber || 'FF-USR'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{operator?.email}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${roleConfig?.badgeColor || 'bg-primary/10 text-primary'}`}>
                      <ShieldCheck className="w-3 h-3" />
                      <span>{roleConfig?.displayName || operator?.role}</span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {roleConfig?.allowedModules.length ?? 8}/8 Modules
                    </span>
                  </div>
                </div>

                <div className="px-3.5 py-2 text-[11px] text-muted-foreground font-mono border-b border-border/60">
                  Department: <span className="text-foreground font-semibold font-sans">{roleConfig?.department || operator?.department}</span>
                </div>

                {/* Instant 1-Click Role Switcher */}
                <div className="px-3 py-2 border-b border-border/60">
                  <div className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Switch Role On-The-Fly:</span>
                    <span className="text-primary font-semibold">6 Personas</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {DEMO_OPERATORS.map((op) => {
                      const isActive = operator?.email.toLowerCase() === op.email.toLowerCase();
                      const cfg = ROLE_CONFIGS[op.role];
                      return (
                        <button
                          key={op.email}
                          type="button"
                          onClick={() => {
                            const newOp: Operator = {
                              id: DEMO_OPERATORS.findIndex(o => o.email === op.email) + 1,
                              name: op.name,
                              email: op.email,
                              role: op.role,
                              department: op.department,
                              badgeNumber: op.badgeNumber,
                              phone: '+91 98000 00000',
                              status: 'ACTIVE',
                              permissions: {
                                roleName: cfg.displayName,
                                department: cfg.department,
                                allowedModules: cfg.allowedModules,
                                canCreateWorkOrder: cfg.canCreateWorkOrder,
                                canApproveWorkOrder: cfg.canApproveWorkOrder,
                                canLogInwardStock: cfg.canLogInwardStock,
                                canCreateSettlement: cfg.canCreateSettlement,
                                canInspectRma: cfg.canInspectRma,
                                canAccessDiagnostics: cfg.canAccessDiagnostics,
                              }
                            };
                            const token = 'session-' + op.role.toLowerCase() + '-' + Date.now();
                            setOperator(newOp, token);
                            setProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs font-mono transition-colors ${isActive
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          <div className="truncate">
                            <div className="leading-tight text-[11px] truncate">{op.name}</div>
                            <div className="text-[9px] text-muted-foreground font-sans">{op.title}</div>
                          </div>
                          {isActive ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          ) : (
                            <span className="text-[9px] text-muted-foreground shrink-0 font-sans">Switch</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="px-1 pt-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out to Login Console</span>
                    </div>
                    <span className="text-[10px] font-mono">Exit</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
