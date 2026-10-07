import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  Layers, 
  Package, 
  ArrowLeftRight, 
  Building2, 
  CreditCard, 
  AlertTriangle, 
  Cpu, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  Gauge,
  X
} from 'lucide-react';
import { useForgeflowStore } from '../../store/useForgeflowStore';
import { canAccessModule, AppModule, ROLE_CONFIGS, OperatorRole } from '../../auth/permissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ForgeFlowSidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse
}) => {
  const { telemetry, operator } = useForgeflowStore();

  const navSections = [
    {
      heading: 'OVERVIEW',
      items: [
        {
          name: 'Operations Telemetry',
          path: '/dashboard',
          module: 'dashboard' as AppModule,
          icon: Gauge,
          badge: telemetry ? `${telemetry.activeWorkOrders.total} Active` : undefined,
          badgeColor: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30',
        },
      ],
    },
    {
      heading: 'PLANT FLOOR & DISPATCH',
      items: [
        {
          name: 'Work Orders & Runs',
          path: '/work-orders',
          module: 'work-orders' as AppModule,
          icon: Layers,
          badge: telemetry?.activeWorkOrders.criticalPriority 
            ? `${telemetry.activeWorkOrders.criticalPriority} Critical` 
            : undefined,
          badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
        },
        {
          name: 'Catalog & SKU Stock',
          path: '/inventory',
          module: 'inventory' as AppModule,
          icon: Package,
          badge: telemetry?.inventoryHealth.stockoutRiskCount 
            ? `${telemetry.inventoryHealth.stockoutRiskCount} Low` 
            : undefined,
          badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30',
        },
        {
          name: 'Movement Ledger',
          path: '/movements',
          module: 'movements' as AppModule,
          icon: ArrowLeftRight,
        },
      ],
    },
    {
      heading: 'COMMERCIAL & SUPPLY',
      items: [
        {
          name: 'Counterparties & Mills',
          path: '/counterparties',
          module: 'counterparties' as AppModule,
          icon: Building2,
        },
        {
          name: 'Settlements & Flow',
          path: '/settlements',
          module: 'settlements' as AppModule,
          icon: CreditCard,
        },
      ],
    },
    {
      heading: 'QUALITY & ASSURANCE',
      items: [
        {
          name: 'Discrepancy & RMA',
          path: '/quality-returns',
          module: 'quality-returns' as AppModule,
          icon: AlertTriangle,
        },
      ],
    },
    {
      heading: 'PLATFORM ENGINE',
      items: [
        {
          name: 'Engine & Contracts',
          path: '/engine-diagnostics',
          module: 'engine-diagnostics' as AppModule,
          icon: Cpu,
        },
      ],
    },
  ];

  // Filter navigation by role clearance
  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => canAccessModule(operator?.role, item.module))
    }))
    .filter(section => section.items.length > 0);

  const activeRoleConfig = ROLE_CONFIGS[operator?.role as OperatorRole];

  return (
    <>
      {/* ======================================================== */}
      {/* 1. MOBILE DRAWER (Only rendered / active on < lg screens) */}
      {/* ======================================================== */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden cursor-pointer animate-fade-in"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 lg:hidden
        w-72 flex flex-col bg-card border-r border-border
        transition-transform duration-300 ease-in-out select-none shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}
      `}>
        {/* Mobile Header: Brand + Close */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs shrink-0">
              <Flame className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-sm text-foreground flex items-center gap-1.5">
                ForgeFlow
                <span className="text-[9px] uppercase px-1.5 py-0.2 bg-primary/20 text-primary border border-primary/30 rounded font-mono font-bold">
                  SaaS
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground">
                Manufacturing Operations
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-2 text-[10px] font-mono font-bold tracking-wider text-muted-foreground/80 uppercase">
                {section.heading}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={iIdx}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => `
                        flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150
                        ${isActive 
                          ? 'bg-primary/15 text-primary border-l-2 border-primary font-semibold shadow-2xs' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'}
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-muted text-muted-foreground'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Footer */}
        <div className="p-3 border-t border-border bg-muted/20 space-y-2">
          <div className="rounded-md p-2 bg-muted/40 border border-border/70 text-[10px] font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Clearance:</span>
              <span className="text-primary font-bold">{activeRoleConfig?.displayName || operator?.role}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Badge:</span>
              <span className="text-foreground">{operator?.badgeNumber || 'FF-USR'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. DESKTOP PERMANENT SIDEBAR (Sticky flex child on >= lg) */}
      {/* ======================================================== */}
      <aside className={`
        hidden lg:flex flex-col h-screen sticky top-0 shrink-0
        bg-card border-r border-border select-none z-30
        transition-[width] duration-200 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Desktop Header */}
        <div className={`h-14 border-b border-border flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs shrink-0">
              <Flame className="w-5 h-5 text-amber-300" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden leading-tight animate-fade-in">
                <span className="font-extrabold tracking-tight text-sm text-foreground flex items-center gap-1.5">
                  ForgeFlow
                  <span className="text-[9px] uppercase px-1 py-0.2 bg-primary/20 text-primary border border-primary/30 rounded font-mono font-bold">
                    SaaS
                  </span>
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  Manufacturing Operations
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${isCollapsed ? 'hidden' : 'flex'}`}
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* When collapsed, small expand button under header */}
        {isCollapsed && (
          <div className="p-2 border-b border-border/50 flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Desktop Nav Links */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 text-[10px] font-mono font-bold tracking-wider text-muted-foreground/80 uppercase">
                  {section.heading}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={iIdx}
                      to={item.path}
                      title={isCollapsed ? item.name : undefined}
                      className={({ isActive }) => `
                        flex items-center gap-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150
                        ${isCollapsed ? 'justify-center px-0' : 'px-2.5'}
                        ${isActive 
                          ? 'bg-primary/15 text-primary border-l-2 border-primary font-semibold shadow-2xs' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'}
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-muted text-muted-foreground'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Footer */}
        {!isCollapsed && (
          <div className="p-3 border-t border-border bg-muted/20 space-y-2 animate-fade-in">
            <div className="rounded-md p-2 bg-muted/40 border border-border/70 text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Clearance:</span>
                <span className="text-primary font-bold">{activeRoleConfig?.displayName || operator?.role}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Badge:</span>
                <span className="text-foreground">{operator?.badgeNumber || 'FF-USR'}</span>
              </div>
            </div>

            <div className="rounded-md p-2 bg-muted/30 border border-border/50 text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>SKU Items</span>
                <span className="text-foreground font-bold">{telemetry?.inventoryHealth.totalSkus ?? 7} registered</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Fulfillment OEE</span>
                <span className="text-emerald-500 font-bold">{telemetry?.fulfillmentVelocityPercent ?? 85}%</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
